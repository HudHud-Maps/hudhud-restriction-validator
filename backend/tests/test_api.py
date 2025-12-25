"""Tests for the API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_check(self, client):
        """Test health check returns healthy status."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data


class TestRestrictionsEndpoint:
    """Tests for the restrictions endpoint."""

    def test_missing_bbox_parameter(self, client):
        """Test error when bbox parameter is missing."""
        response = client.get("/api/restrictions")
        assert response.status_code == 422  # Validation error

    def test_invalid_bbox_format(self, client):
        """Test error with invalid bbox format."""
        response = client.get("/api/restrictions?bbox=invalid")
        assert response.status_code == 400
        assert "Invalid bbox format" in response.json()["detail"]

    def test_invalid_bbox_values(self, client):
        """Test error with invalid bbox values."""
        # min > max
        response = client.get("/api/restrictions?bbox=14,53,13,52")
        assert response.status_code == 400
        assert "min values must be less than max values" in response.json()["detail"]

    def test_invalid_latitude(self, client):
        """Test error with invalid latitude."""
        response = client.get("/api/restrictions?bbox=13,100,14,101")
        assert response.status_code == 400
        assert "Latitude" in response.json()["detail"]

    def test_invalid_longitude(self, client):
        """Test error with invalid longitude."""
        response = client.get("/api/restrictions?bbox=200,52,201,53")
        assert response.status_code == 400
        assert "Longitude" in response.json()["detail"]

    @patch("app.api.routes.cache_service")
    @patch("app.api.routes.overpass_client")
    def test_successful_request(self, mock_overpass, mock_cache, client):
        """Test successful restrictions request."""
        # Setup mocks
        mock_cache.get = AsyncMock(return_value=None)
        mock_cache.set = AsyncMock()
        mock_overpass.fetch_restrictions = AsyncMock(
            return_value={
                "elements": [
                    {
                        "type": "relation",
                        "id": 123,
                        "members": [
                            {"type": "way", "role": "from", "ref": 1},
                            {"type": "way", "role": "to", "ref": 2},
                            {"type": "node", "role": "via", "ref": 3},
                        ],
                        "tags": {"type": "restriction", "restriction": "no_left_turn"},
                    },
                    {"type": "node", "id": 3, "lat": 52.5, "lon": 13.4},
                ]
            }
        )

        response = client.get("/api/restrictions?bbox=13.3,52.5,13.4,52.52")
        assert response.status_code == 200

        data = response.json()
        assert "restrictions" in data
        assert "meta" in data
        assert len(data["restrictions"]) == 1
        assert data["restrictions"][0]["id"] == 123

    @patch("app.api.routes.cache_service")
    def test_cached_response(self, mock_cache, client):
        """Test that cached responses are returned."""
        cached_data = {
            "restrictions": [
                {
                    "id": 456,
                    "restriction_type": "no_u_turn",
                    "members": [],
                    "tags": {},
                    "issues": [],
                    "status": "ok",
                    "location": {"lat": 52.5, "lon": 13.4},
                }
            ]
        }
        mock_cache.get = AsyncMock(return_value=cached_data)

        response = client.get("/api/restrictions?bbox=13.3,52.5,13.4,52.52")
        assert response.status_code == 200

        data = response.json()
        assert len(data["restrictions"]) == 1
        assert data["restrictions"][0]["id"] == 456

    @patch("app.api.routes.cache_service")
    @patch("app.api.routes.overpass_client")
    def test_status_filter(self, mock_overpass, mock_cache, client):
        """Test filtering by status."""
        mock_cache.get = AsyncMock(return_value=None)
        mock_cache.set = AsyncMock()
        mock_overpass.fetch_restrictions = AsyncMock(
            return_value={
                "elements": [
                    {
                        "type": "relation",
                        "id": 100,
                        "members": [
                            {"type": "way", "role": "from", "ref": 1},
                            {"type": "way", "role": "to", "ref": 2},
                            {"type": "node", "role": "via", "ref": 3},
                        ],
                        "tags": {"type": "restriction", "restriction": "no_left_turn"},
                    },
                    {
                        "type": "relation",
                        "id": 200,
                        "members": [],
                        "tags": {"type": "restriction"},
                    },
                ]
            }
        )

        # Filter for errors only
        response = client.get("/api/restrictions?bbox=13.3,52.5,13.4,52.52&status=error")
        assert response.status_code == 200

        data = response.json()
        # Only the restriction with errors should be returned
        assert all(r["status"] == "error" for r in data["restrictions"])


class TestRootEndpoint:
    """Tests for the root endpoint."""

    def test_root_returns_response(self, client):
        """Test root endpoint returns either API info (dev) or HTML (prod with static files)."""
        response = client.get("/")
        assert response.status_code == 200
        # In dev mode (no static files), returns JSON
        # In prod mode (with static files), returns HTML
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            data = response.json()
            assert "message" in data
            assert "docs" in data
        else:
            # HTML response from static files
            assert "<!DOCTYPE html>" in response.text or "<html" in response.text

