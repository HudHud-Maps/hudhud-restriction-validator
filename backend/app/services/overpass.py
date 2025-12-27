"""Overpass API client with retry logic and timeout handling."""

import asyncio
from typing import Any

import httpx

from app.config import get_settings

settings = get_settings()


class OverpassError(Exception):
    """Custom exception for Overpass API errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class OverpassClient:
    """Async client for Overpass API with retry and timeout support."""

    def __init__(self):
        self.base_url = settings.overpass_url
        self.timeout = settings.overpass_timeout
        self.retries = settings.overpass_retries

    def _build_query(self, bbox: tuple[float, float, float, float]) -> str:
        """
        Build Overpass query for turn restrictions in bbox.
        bbox format: (min_lon, min_lat, max_lon, max_lat)
        Overpass bbox format: (south, west, north, east) = (min_lat, min_lon, max_lat, max_lon)
        """
        min_lon, min_lat, max_lon, max_lat = bbox
        overpass_bbox = f"{min_lat},{min_lon},{max_lat},{max_lon}"

        # Query explanation:
        # 1. Get all restriction relations in bbox
        # 2. Recurse to get all member ways and nodes (>)
        # 3. Output with full geometry (body for relations/ways, body for nodes with lat/lon)
        query = f"""
[out:json][timeout:{self.timeout}];
(
  relation["type"="restriction"]({overpass_bbox});
);
out body;
>;
out body qt;
"""
        return query.strip()

    async def fetch_restrictions(self, bbox: tuple[float, float, float, float]) -> dict[str, Any]:
        """
        Fetch turn restrictions from Overpass API.

        Args:
            bbox: Bounding box as (min_lon, min_lat, max_lon, max_lat)

        Returns:
            Parsed Overpass response with elements

        Raises:
            OverpassError: If the request fails after retries
        """
        query = self._build_query(bbox)
        last_error: Exception | None = None

        for attempt in range(self.retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout + 10) as client:
                    response = await client.post(
                        self.base_url,
                        data={"data": query},
                        headers={"Content-Type": "application/x-www-form-urlencoded"},
                    )

                    if response.status_code == 200:
                        return response.json()
                    elif response.status_code == 429:
                        raise OverpassError(
                            "Overpass API rate limit exceeded. Please try again later.",
                            429,
                        )
                    elif response.status_code == 504:
                        raise OverpassError(
                            "Overpass API timeout. Try zooming in to a smaller area.",
                            504,
                        )
                    else:
                        raise OverpassError(
                            f"Overpass API error: {response.status_code}",
                            response.status_code,
                        )

            except httpx.TimeoutException:
                last_error = OverpassError(
                    "Request to Overpass API timed out. Try zooming in to a smaller area.",
                    504,
                )
            except httpx.RequestError as e:
                last_error = OverpassError(
                    f"Network error connecting to Overpass API: {str(e)}",
                    503,
                )
            except OverpassError:
                raise
            except Exception as e:
                last_error = OverpassError(f"Unexpected error: {str(e)}", 500)

            # Wait before retry (exponential backoff)
            if attempt < self.retries - 1:
                await asyncio.sleep(2**attempt)

        raise last_error or OverpassError("Failed to fetch data from Overpass API", 500)


# Singleton client instance
overpass_client = OverpassClient()
