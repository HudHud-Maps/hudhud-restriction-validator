"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.dependencies import limiter
from app.api.routes import router as api_router
from app.config import get_settings

settings = get_settings()

# Check for static files in multiple possible locations
STATIC_PATHS = [
    Path(__file__).parent.parent / "frontend" / "dist",  # Docker: /app/frontend/dist
    Path(__file__).parent.parent.parent / "frontend" / "dist",  # Local dev
    Path("/app/frontend/dist"),  # Absolute Docker path
]

static_path = None
for path in STATIC_PATHS:
    if path.exists() and (path / "index.html").exists():
        static_path = path
        break


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to limit request body size for security."""

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            if int(content_length) > settings.max_request_size:
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": "Request too large",
                        "detail": f"Maximum request size is {settings.max_request_size} bytes",
                    },
                )
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print(f"Starting Turn Restriction Validator API on port {settings.port}")
    print(f"Overpass URL: {settings.overpass_url}")
    print(f"Cache TTL: {settings.cache_ttl_seconds}s")
    print(f"Rate limit: {settings.rate_limit_rpm} req/min")
    print(f"CORS origins: {settings.cors_origins}")
    print(f"Max bbox area: {settings.max_bbox_area} sq degrees")
    if static_path:
        print(f"Serving static files from: {static_path}")
    else:
        print("No static files found - running in API-only mode")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Turn Restriction Validator API",
    description="Validates OSM turn restrictions and reports errors/warnings",
    version="1.0.0",
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add request size limit middleware
app.add_middleware(RequestSizeLimitMiddleware)

# Add CORS middleware with secure configuration
# When specific origins are set, credentials can be allowed
# When using "*", credentials should be False for security
is_wildcard_cors = "*" in settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=not is_wildcard_cors,  # Disable credentials with wildcard origins
    allow_methods=["GET", "POST", "OPTIONS"],  # Only allow needed methods
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


# Custom error handler for cleaner error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else None,
        },
    )


# Serve static files in production (when frontend is built)
if static_path:
    # Mount static assets (js, css, etc.)
    app.mount("/assets", StaticFiles(directory=str(static_path / "assets")), name="assets")

    # Serve index.html for the root and any non-API routes (SPA fallback)
    @app.get("/")
    async def serve_spa_root():
        """Serve the SPA index.html."""
        return FileResponse(static_path / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa_fallback(full_path: str):
        """Serve static files or fall back to index.html for SPA routing."""
        file_path = static_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_path / "index.html")
else:
    # For development: simple root endpoint
    @app.get("/")
    async def root():
        """Root endpoint - redirects to API docs in dev mode."""
        return {
            "message": "Turn Restriction Validator API",
            "docs": "/docs",
            "api": "/api",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )

