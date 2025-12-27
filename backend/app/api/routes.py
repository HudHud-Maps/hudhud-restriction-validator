"""API routes for the restriction validator."""


from fastapi import APIRouter, HTTPException, Query, Request

from app.api.dependencies import limiter
from app.services.cache import cache_service
from app.services.overpass import OverpassError, overpass_client
from app.validation import ValidationEngine
from app.validation.models import ErrorResponse, RestrictionResponse, SingleRestrictionResponse

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "restriction-validator"}


@router.get(
    "/restrictions",
    response_model=RestrictionResponse,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
@limiter.limit("60/minute")
async def get_restrictions(
    request: Request,
    bbox: str = Query(
        ...,
        description="Bounding box as minLon,minLat,maxLon,maxLat",
        examples=["13.3,52.5,13.4,52.52"],
    ),
    status_filter: str | None = Query(
        None,
        description="Filter by status: ok, warning, error",
        alias="status",
    ),
    type_filter: str | None = Query(
        None,
        description="Filter by restriction type (e.g., no_left_turn)",
        alias="type",
    ),
):
    """
    Get turn restrictions for a bounding box with validation results.

    The bbox parameter should be in the format: minLon,minLat,maxLon,maxLat

    Returns validated restrictions with any errors or warnings detected.
    """
    # Parse bbox
    try:
        parts = [float(x.strip()) for x in bbox.split(",")]
        if len(parts) != 4:
            raise ValueError("bbox must have 4 values")
        min_lon, min_lat, max_lon, max_lat = parts

        # Validate bbox values
        if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if min_lon >= max_lon or min_lat >= max_lat:
            raise ValueError("min values must be less than max values")

        # Security: Validate bbox area is not too large
        from app.config import get_settings
        settings = get_settings()
        bbox_area = (max_lon - min_lon) * (max_lat - min_lat)
        if bbox_area > settings.max_bbox_area:
            raise ValueError(
                f"Bounding box too large ({bbox_area:.3f} sq degrees). "
                f"Maximum allowed is {settings.max_bbox_area} sq degrees. Please zoom in."
            )

        bbox_tuple = (min_lon, min_lat, max_lon, max_lat)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid bbox format: {str(e)}. Expected: minLon,minLat,maxLon,maxLat",
        ) from None

    # Check cache first
    cached = await cache_service.get(bbox_tuple)
    if cached:
        restrictions = cached["restrictions"]
        osm_timestamp = cached.get("osm_timestamp")
    else:
        # Fetch from Overpass
        try:
            overpass_data = await overpass_client.fetch_restrictions(bbox_tuple)
        except OverpassError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message) from None

        # Extract Overpass timestamp (osm3s metadata)
        osm_timestamp = overpass_data.get("osm3s", {}).get("timestamp_osm_base")

        # Validate restrictions
        engine = ValidationEngine()
        validated = engine.validate(overpass_data)

        # Convert to dict for caching and response
        restrictions = [r.model_dump() for r in validated]

        # Cache the results (including timestamp)
        await cache_service.set(bbox_tuple, {"restrictions": restrictions, "osm_timestamp": osm_timestamp})

    # Apply filters
    if status_filter:
        restrictions = [r for r in restrictions if r["status"] == status_filter]

    if type_filter:
        restrictions = [
            r for r in restrictions if r.get("restriction_type") == type_filter
        ]

    # Compute meta
    total = len(restrictions)
    errors = sum(1 for r in restrictions if r["status"] == "error")
    warnings = sum(1 for r in restrictions if r["status"] == "warning")
    ok = sum(1 for r in restrictions if r["status"] == "ok")

    return RestrictionResponse(
        restrictions=restrictions,
        meta={
            "total": total,
            "errors": errors,
            "warnings": warnings,
            "ok": ok,
            "bbox": list(bbox_tuple),
            "osm_timestamp": osm_timestamp,
        },
    )


@router.get(
    "/restriction/{relation_id}",
    response_model=SingleRestrictionResponse,
    responses={
        404: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
        504: {"model": ErrorResponse},
    },
)
@limiter.limit("60/minute")
async def get_restriction_by_id(
    request: Request,
    relation_id: int,
):
    """
    Get a specific restriction by its OSM relation ID.

    This fetches the restriction directly from Overpass and validates it,
    regardless of the current map view.
    """
    # Build a specific query for this relation
    query = f"""
[out:json][timeout:30];
relation({relation_id});
out body;
>;
out skel qt;
"""

    try:
        import httpx

        from app.config import get_settings

        settings = get_settings()

        async with httpx.AsyncClient(timeout=40) as client:
            response = await client.post(
                settings.overpass_url,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch restriction from Overpass",
                )

            overpass_data = response.json()

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out") from None
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Network error: {str(e)}") from None

    # Extract Overpass timestamp
    osm_timestamp = overpass_data.get("osm3s", {}).get("timestamp_osm_base")

    # Validate
    engine = ValidationEngine()
    validated = engine.validate(overpass_data)

    if not validated:
        raise HTTPException(
            status_code=404, detail=f"Restriction {relation_id} not found"
        )

    return SingleRestrictionResponse(
        restriction=validated[0],
        osm_timestamp=osm_timestamp,
    )


@router.post("/cache/clear")
@limiter.limit("10/minute")
async def clear_cache(request: Request):
    """
    Clear the server-side cache.

    This forces fresh data to be fetched from Overpass on the next request.
    """
    cache_service.clear()
    return {"status": "ok", "message": "Cache cleared successfully"}


# Saudi Arabia bounds
SA_BOUNDS = {
    "north": 32.154,
    "south": 16.379,
    "east": 55.666,
    "west": 34.495,
}


@router.get(
    "/issues/sa",
    response_model=RestrictionResponse,
    responses={
        429: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
@limiter.limit("30/minute")
async def get_sa_issues(
    request: Request,
    status: str = Query(
        "all",
        description="Filter by status: error, warning, or all (errors + warnings)",
    ),
):
    """
    Get all restrictions with issues (errors/warnings) across Saudi Arabia.

    This queries the entire SA region and returns only restrictions with problems.
    """
    import httpx

    from app.config import get_settings

    settings = get_settings()

    # Build bbox for Saudi Arabia
    bbox_tuple = (SA_BOUNDS["west"], SA_BOUNDS["south"], SA_BOUNDS["east"], SA_BOUNDS["north"])
    overpass_bbox = f"{SA_BOUNDS['south']},{SA_BOUNDS['west']},{SA_BOUNDS['north']},{SA_BOUNDS['east']}"

    # Check cache first (use special string key for SA-wide query)
    cache_key = f"sa_issues_{status}"
    cached = await cache_service.get(cache_key)
    if cached:
        return RestrictionResponse(
            restrictions=cached["restrictions"],
            meta=cached["meta"],
        )

    # Query all restrictions in Saudi Arabia
    query = f"""
[out:json][timeout:180];
(
  relation["type"="restriction"]({overpass_bbox});
);
out body;
>;
out body qt;
"""

    try:
        async with httpx.AsyncClient(timeout=200) as client:
            response = await client.post(
                settings.overpass_url,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="Overpass API rate limit exceeded. Please try again later.",
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to fetch restrictions from Overpass",
                )

            overpass_data = response.json()

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Saudi Arabia query takes time, please try again.",
        ) from None
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Network error: {str(e)}") from None

    # Extract timestamp
    osm_timestamp = overpass_data.get("osm3s", {}).get("timestamp_osm_base")

    # Validate all restrictions
    engine = ValidationEngine()
    validated = engine.validate(overpass_data)

    # Filter to only issues based on status parameter
    if status == "error":
        issues = [r for r in validated if r.status == "error"]
    elif status == "warning":
        issues = [r for r in validated if r.status == "warning"]
    else:  # "all" - both errors and warnings
        issues = [r for r in validated if r.status in ("error", "warning")]

    # Convert to dict
    restrictions = [r.model_dump() for r in issues]

    # Compute meta
    total = len(restrictions)
    errors = sum(1 for r in restrictions if r["status"] == "error")
    warnings = sum(1 for r in restrictions if r["status"] == "warning")

    meta = {
        "total": total,
        "errors": errors,
        "warnings": warnings,
        "ok": 0,
        "bbox": list(bbox_tuple),
        "osm_timestamp": osm_timestamp,
    }

    # Cache the results
    await cache_service.set(cache_key, {"restrictions": restrictions, "meta": meta})

    return RestrictionResponse(
        restrictions=restrictions,
        meta=meta,
    )

