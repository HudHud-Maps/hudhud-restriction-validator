"""API routes for the restriction validator."""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from app.api.dependencies import limiter
from app.services.cache import cache_service
from app.services.overpass import OverpassError, overpass_client
from app.validation import ValidationEngine
from app.validation.models import ErrorResponse, RestrictionResponse

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
    status_filter: Optional[str] = Query(
        None,
        description="Filter by status: ok, warning, error",
        alias="status",
    ),
    type_filter: Optional[str] = Query(
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
        )

    # Check cache first
    cached = await cache_service.get(bbox_tuple)
    if cached:
        restrictions = cached["restrictions"]
    else:
        # Fetch from Overpass
        try:
            overpass_data = await overpass_client.fetch_restrictions(bbox_tuple)
        except OverpassError as e:
            raise HTTPException(status_code=e.status_code, detail=e.message)

        # Validate restrictions
        engine = ValidationEngine()
        validated = engine.validate(overpass_data)

        # Convert to dict for caching and response
        restrictions = [r.model_dump() for r in validated]

        # Cache the results
        await cache_service.set(bbox_tuple, {"restrictions": restrictions})

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
        },
    )


@router.get("/restriction/{relation_id}")
@limiter.limit("60/minute")
async def get_restriction_by_id(
    request: Request,
    relation_id: int,
):
    """
    Get a specific restriction by its OSM relation ID.

    This fetches the restriction directly from Overpass and validates it.
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
        raise HTTPException(status_code=504, detail="Request timed out")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Network error: {str(e)}")

    # Validate
    engine = ValidationEngine()
    validated = engine.validate(overpass_data)

    if not validated:
        raise HTTPException(
            status_code=404, detail=f"Restriction {relation_id} not found"
        )

    return validated[0]

