"""Caching service with in-memory LRU + TTL support."""

import hashlib
from typing import Optional, Union

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

    def _make_key(self, key_input: Union[tuple[float, float, float, float], str]) -> str:
        """Generate cache key from bbox or string."""
        if isinstance(key_input, str):
            # String key - use directly
            key_str = f"custom:{key_input}"
        else:
            # Bbox tuple - round to 4 decimal places for cache key stability
            rounded = tuple(round(v, 4) for v in key_input)
            key_str = f"restrictions:{rounded}"
        return hashlib.sha256(key_str.encode()).hexdigest()[:32]

    async def get(self, key_input: Union[tuple[float, float, float, float], str]) -> Optional[dict]:
        """Get cached data for bbox or string key."""
        key = self._make_key(key_input)
        return self._cache.get(key)

    async def set(self, key_input: Union[tuple[float, float, float, float], str], data: dict) -> None:
        """Cache data for bbox or string key."""
        key = self._make_key(key_input)
        self._cache[key] = data

    def clear(self) -> None:
        """Clear all cached data."""
        self._cache.clear()


# Singleton cache instance
cache_service = CacheService()
