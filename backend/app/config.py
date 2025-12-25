"""Application configuration via environment variables."""

from functools import lru_cache
from typing import Optional

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Overpass API configuration
    overpass_url: str = "https://overpass-api.hudhud.cloud/api/interpreter"
    overpass_timeout: int = 120  # seconds (increased for large area queries)
    overpass_retries: int = 3

    # Cache configuration (in-memory LRU cache with TTL)
    cache_ttl_seconds: int = 300
    cache_max_size: int = 1000

    # Rate limiting
    rate_limit_rpm: int = 60  # requests per minute per IP

    # Server configuration
    port: int = 8080
    host: str = "0.0.0.0"
    debug: bool = False

    # CORS - Set specific origins in production
    # Use comma-separated list in env: CORS_ORIGINS=https://app.hudhud.cloud,https://admin.hudhud.cloud
    cors_origins: list[str] = ["https://osm.hudhud.cloud", "https://hudhud.cloud"]
    
    # Security: Request size limit (bytes) - default 1MB
    max_request_size: int = 1_000_000
    
    # Security: Maximum bbox area (in square degrees)
    # Large area to cover Middle East + surrounding regions
    # Set to 2000 to allow full regional views
    max_bbox_area: float = 2000.0


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

