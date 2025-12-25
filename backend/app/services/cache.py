"""Caching service with in-memory LRU + TTL support."""

import hashlib
from typing import Optional

from cachetools import TTLCache

from app.config import get_settings

settings = get_settings()


class CacheService:
    """In-memory cache service with LRU eviction and TTL expiration."""

    def __init__(self):
        self._cache: TTLCache = TTLCache(
            maxsize=settings.cache_max_size,
            ttl=settings.cache_ttl_seconds,
        )

    def _make_key(self, bbox: tuple[float, float, float, float]) -> str:
        """Generate cache key from bbox."""
        # Round to 4 decimal places for cache key stability
        rounded = tuple(round(v, 4) for v in bbox)
        key_str = f"restrictions:{rounded}"
        return hashlib.sha256(key_str.encode()).hexdigest()[:32]

    async def get(self, bbox: tuple[float, float, float, float]) -> Optional[dict]:
        """Get cached data for bbox."""
        key = self._make_key(bbox)
        return self._cache.get(key)

    async def set(self, bbox: tuple[float, float, float, float], data: dict) -> None:
        """Cache data for bbox."""
        key = self._make_key(bbox)
        self._cache[key] = data

    def clear(self) -> None:
        """Clear all cached data."""
        self._cache.clear()


# Singleton cache instance
cache_service = CacheService()
