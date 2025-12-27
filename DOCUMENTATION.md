# Turn Restriction Validator - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Repository Structure](#repository-structure)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [Data Flow](#data-flow)
7. [Validation System](#validation-system)
8. [Deployment](#deployment)
9. [Development Guide](#development-guide)
10. [API Reference](#api-reference)

---

## Project Overview

### What is This Project?

The **Turn Restriction Validator** is a web application that validates OpenStreetMap (OSM) turn restriction relations. It analyzes turn restrictions in a geographic area and identifies potential errors and warnings, displaying them on an interactive map.

### Key Features

- **Interactive Map**: Leaflet-based map with multiple base layers
- **Real-time Validation**: Automatically validates restrictions as you pan/zoom
- **Error Detection**: Identifies missing members, wrong types, invalid tags
- **Warning Detection**: Flags suspicious but not strictly invalid configurations
- **Marker Clustering**: Groups nearby restrictions for better performance
- **Filtering**: Filter by status (OK/Warning/Error) and restriction type
- **Search**: Find specific restrictions by relation ID
- **OSM Integration**: Direct links to edit in HudHud OSM or JOSM

### Technology Stack

**Backend:**
- Python 3.11
- FastAPI (async web framework)
- Pydantic (data validation)
- httpx (async HTTP client)
- cachetools (in-memory caching)
- slowapi (rate limiting)

**Frontend:**
- React 18
- TypeScript
- Vite (build tool)
- Leaflet (mapping library)
- React-Leaflet (React bindings for Leaflet)
- leaflet.markercluster (marker clustering)

**Infrastructure:**
- Docker & Docker Compose
- Multi-stage builds for production
- Health checks
- Environment-based configuration

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Frontend (Vite + TypeScript)                 │   │
│  │  • Map UI (Leaflet)                                  │   │
│  │  • Components (Controls, Markers, Popups)             │   │
│  │  • State Management (React Hooks)                    │   │
│  └───────────────────┬──────────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP REST API
                       │ GET /api/restrictions?bbox=...
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Layer                                            │   │
│  │  • Routes (/api/restrictions, /api/health)           │   │
│  │  • Rate Limiting (slowapi)                           │   │
│  │  • Request Validation                                 │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                       │                                       │
│  ┌───────────────────▼──────────────────────────────────┐   │
│  │  Service Layer                                        │   │
│  │  • OverpassClient (fetch OSM data)                   │   │
│  │  • CacheService (LRU + TTL cache)                    │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                       │                                       │
│  ┌───────────────────▼──────────────────────────────────┐   │
│  │  Validation Layer                                     │   │
│  │  • ValidationEngine (orchestrates rules)             │   │
│  │  • Validation Rules (plugin architecture)            │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ Overpass Query
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Overpass API (HudHud Cloud)                         │
│  overpass-api.hudhud.cloud                                  │
│  • Returns OSM relations, ways, nodes                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **User Interaction** → User pans/zooms map
2. **Frontend** → Debounces map events (500ms), extracts bbox
3. **API Request** → `GET /api/restrictions?bbox=minLon,minLat,maxLon,maxLat`
4. **Backend** → Validates request, checks cache
5. **Cache Miss** → Fetches from Overpass API
6. **Validation** → Runs all validation rules
7. **Response** → Returns validated restrictions with issues
8. **Frontend** → Renders markers on map with clustering

---

## Repository Structure

```
hudhud-restriction-validator/
│
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Configuration (Pydantic Settings)
│   │   │
│   │   ├── api/                      # API layer
│   │   │   ├── __init__.py
│   │   │   ├── routes.py             # API endpoints
│   │   │   └── dependencies.py      # Rate limiter setup
│   │   │
│   │   ├── services/                 # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── overpass.py           # Overpass API client
│   │   │   └── cache.py              # Caching service
│   │   │
│   │   └── validation/               # Validation system
│   │       ├── __init__.py
│   │       ├── engine.py             # Validation orchestrator
│   │       ├── models.py             # Pydantic models
│   │       └── rules/                 # Validation rules (plugins)
│   │           ├── __init__.py      # Rule registry
│   │           ├── base.py           # Base rule class
│   │           ├── member_rules.py   # Member validation rules
│   │           ├── type_rules.py     # Type validation rules
│   │           └── warning_rules.py  # Warning rules
│   │
│   ├── tests/                        # Backend tests
│   │   ├── __init__.py
│   │   └── test_api.py               # API endpoint tests
│   │
│   ├── Dockerfile                    # Backend Docker image
│   ├── requirements.txt              # Python dependencies
│   └── pyproject.toml                # Python project config
│
├── frontend/                         # React TypeScript frontend
│   ├── src/
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # Main app component
│   │   │
│   │   ├── components/               # React components
│   │   │   ├── Map/                  # Map-related components
│   │   │   │   ├── MapContainer.tsx  # Main map wrapper
│   │   │   │   ├── MarkerCluster.tsx # Marker clustering
│   │   │   │   ├── RestrictionMarker.tsx # Individual markers
│   │   │   │   └── RestrictionPopup.tsx  # Marker popup
│   │   │   │
│   │   │   ├── Controls/             # Control components
│   │   │   │   ├── FilterPanel.tsx   # Filter UI
│   │   │   │   ├── LayerControl.tsx  # Base layer switcher
│   │   │   │   └── SearchBox.tsx     # Search by ID
│   │   │   │
│   │   │   └── UI/                   # UI components
│   │   │       ├── ErrorBanner.tsx    # Error display
│   │   │       ├── LoadingOverlay.tsx # Loading indicator
│   │   │       └── HelpModal.tsx      # Help/info modal
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useRestrictions.ts    # Fetch restrictions hook
│   │   │   └── useDebounce.ts        # Debounce utility hook
│   │   │
│   │   ├── services/                 # API client
│   │   │   └── api.ts                # API service class
│   │   │
│   │   ├── types/                    # TypeScript types
│   │   │   ├── index.ts               # Shared types
│   │   │   └── leaflet.markercluster.d.ts # Leaflet types
│   │   │
│   │   ├── config/                   # Configuration
│   │   │   └── tiles.ts              # Map tile configurations
│   │   │
│   │   └── styles/                   # CSS styles
│   │       └── index.css             # Main stylesheet
│   │
│   ├── public/                       # Static assets
│   │   └── favicon.svg
│   │
│   ├── dist/                         # Build output (gitignored)
│   ├── Dockerfile                    # Frontend Docker image
│   ├── package.json                  # NPM dependencies
│   ├── vite.config.ts                # Vite configuration
│   └── tsconfig.json                 # TypeScript configuration
│
├── docker-compose.yml                # Development Docker Compose
├── docker-compose.prod.yml           # Production Docker Compose
├── Dockerfile                        # Multi-stage production build
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── README.md                         # Quick start guide
├── CODE_REVIEW.md                    # Code review document
└── DOCUMENTATION.md                  # This file
```

---

## Backend Documentation

### Entry Point: `main.py`

The FastAPI application entry point that:
- Initializes the FastAPI app
- Sets up middleware (CORS, rate limiting, request size limits)
- Mounts API routes
- Serves static frontend files in production
- Handles global exceptions

**Key Components:**
- `lifespan()`: Startup/shutdown events
- `RequestSizeLimitMiddleware`: Limits request body size
- Static file serving for production builds

### Configuration: `config.py`

Uses Pydantic Settings to load configuration from environment variables:

```python
class Settings(BaseSettings):
    overpass_url: str = "https://overpass-api.hudhud.cloud/api/interpreter"
    overpass_timeout: int = 120
    cache_ttl_seconds: int = 300
    rate_limit_rpm: int = 60
    max_bbox_area: float = 2000.0
    # ... more settings
```

**Settings are:**
- Loaded from `.env` file or environment variables
- Type-validated by Pydantic
- Cached via `@lru_cache` decorator

### API Layer: `api/routes.py`

**Endpoints:**

1. **`GET /api/health`**
   - Health check endpoint
   - Returns: `{"status": "healthy", "service": "restriction-validator"}`

2. **`GET /api/restrictions`**
   - Main endpoint for fetching restrictions
   - **Parameters:**
     - `bbox` (required): `minLon,minLat,maxLon,maxLat`
     - `status` (optional): Filter by `ok`, `warning`, or `error`
     - `type` (optional): Filter by restriction type
   - **Flow:**
     1. Parse and validate bbox
     2. Check cache
     3. If cache miss: fetch from Overpass
     4. Validate restrictions
     5. Cache results
     6. Apply filters
     7. Return response

3. **`GET /api/restriction/{relation_id}`**
   - Fetch specific restriction by ID
   - Directly queries Overpass for single relation

**Rate Limiting:**
- Applied via `@limiter.limit("60/minute")` decorator
- Uses IP address for rate limit key

### Services Layer

#### `services/overpass.py` - OverpassClient

**Purpose:** Fetches OSM turn restriction data from Overpass API

**Key Methods:**
- `_build_query(bbox)`: Builds Overpass QL query
- `fetch_restrictions(bbox)`: Fetches with retry logic

**Features:**
- Retry with exponential backoff (3 retries)
- Timeout handling (120s default)
- Error categorization (rate limit, timeout, network error)

**Query Structure:**
```overpassql
[out:json][timeout:120];
(
  relation["type"="restriction"](bbox);
);
out body;
>;
out body qt;
```

#### `services/cache.py` - CacheService

**Purpose:** In-memory caching with LRU eviction and TTL

**Implementation:**
- Uses `cachetools.TTLCache`
- Cache key: SHA256 hash of rounded bbox coordinates
- TTL: 300 seconds (configurable)
- Max size: 1000 entries (configurable)

**Methods:**
- `get(bbox)`: Retrieve cached data
- `set(bbox, data)`: Store data in cache
- `clear()`: Clear all cache

### Validation System

#### `validation/engine.py` - ValidationEngine

**Purpose:** Orchestrates all validation rules

**Process:**
1. Parse Overpass response into lookup tables
2. Filter to only turn restrictions (exclude access restrictions)
3. For each relation:
   - Extract members and tags
   - Run all validation rules
   - Compute location from via node
   - Create `ValidatedRestriction` object
   - Compute status (ok/warning/error)

**Key Methods:**
- `validate(overpass_data)`: Main validation entry point
- `_validate_relation(...)`: Validate single relation
- `_compute_location(...)`: Extract coordinates from members

#### `validation/models.py` - Data Models

**Pydantic Models:**

1. **`Issue`**
   - `code`: Issue code (e.g., "missing_from_member")
   - `message`: Human-readable message
   - `severity`: `ERROR` or `WARNING`

2. **`ValidatedRestriction`**
   - `id`: OSM relation ID
   - `restriction_type`: Type (e.g., "no_left_turn")
   - `members`: List of relation members
   - `tags`: OSM tags
   - `issues`: List of validation issues
   - `status`: Computed status ("ok", "warning", "error")
   - `location`: Coordinates (lat/lon)

3. **`RestrictionResponse`**
   - `restrictions`: List of validated restrictions
   - `meta`: Metadata (total, errors, warnings, ok counts)

#### Validation Rules

**Architecture:** Plugin-based system

**Base Class:** `ValidationRule`
```python
class ValidationRule:
    @property
    def code(self) -> str:
        """Unique rule code."""
        ...
    
    def check(self, relation, elements_by_id) -> list[Issue]:
        """Check relation and return issues."""
        ...
```

**Rule Categories:**

1. **Member Rules** (`member_rules.py`)
   - `MissingFromMemberRule`: Checks for "from" member
   - `MissingToMemberRule`: Checks for "to" member
   - `MissingViaMemberRule`: Checks for "via" member

2. **Type Rules** (`type_rules.py`)
   - `InvalidFromTypeRule`: "from" must be a way
   - `InvalidToTypeRule`: "to" must be a way
   - `InvalidViaTypeRule`: "via" must be node or way
   - `MissingRestrictionTagRule`: Must have restriction tag

3. **Warning Rules** (`warning_rules.py`)
   - `NonExistentMemberRule`: Member ID not found in data
   - `OnewayInconsistencyRule`: Direction conflicts with oneway tag

**Adding New Rules:**
1. Create rule class inheriting from `ValidationRule`
2. Implement `code` property and `check()` method
3. Register in `validation/rules/__init__.py`

---

## Frontend Documentation

### Entry Point: `main.tsx`

- Initializes React app
- Renders `<App />` component
- Imports Leaflet CSS

### Main Component: `App.tsx`

**State Management:**
- `baseLayer`: Selected map base layer
- `bbox`: Current map bounding box
- `highlightedId`: Currently highlighted restriction
- `filters`: Filter state (showOk, showWarnings, showErrors, restrictionType)

**Key Features:**
- Uses `useRestrictions` hook for data fetching
- Manages map state and user interactions
- Renders map container and sidebar controls

### Components

#### Map Components (`components/Map/`)

**`MapContainer.tsx`**
- Wraps Leaflet map
- Handles map events (pan/zoom)
- Filters restrictions based on filter state
- Renders `MarkerCluster` component

**`MarkerCluster.tsx`**
- Uses `leaflet.markercluster` for grouping
- Creates custom cluster icons (color-coded by worst status)
- Manages marker lifecycle (add/remove/update)
- Binds popups to markers

**`RestrictionMarker.tsx`**
- Creates custom SVG icons for restriction types
- Adds status indicator badges (error/warning)
- Exports `createRestrictionIcon()` function

**`RestrictionPopup.tsx`**
- Displays restriction details in popup
- Shows restriction type, ID, issues
- Provides edit links (OSM/JOSM)

#### Control Components (`components/Controls/`)

**`FilterPanel.tsx`**
- Checkboxes for status filters (OK/Warnings/Errors)
- Dropdown for restriction type filter
- Displays filtered counts

**`LayerControl.tsx`**
- Radio buttons for base layer selection
- Dynamically reads available layers from config

**`SearchBox.tsx`**
- Input for searching by relation ID
- Highlights found restriction on map

#### UI Components (`components/UI/`)

**`ErrorBanner.tsx`**
- Displays error messages
- Dismissible banner

**`LoadingOverlay.tsx`**
- Full-screen loading indicator
- Shown during API requests

**`HelpModal.tsx`**
- Modal dialog explaining restriction icons
- Icon legend and usage guide

### Hooks

#### `hooks/useRestrictions.ts`

**Purpose:** Fetch and manage restrictions data

**Features:**
- Debounces bbox changes (500ms default)
- Manages loading/error states
- Provides `refetch()` function

**Usage:**
```typescript
const { restrictions, meta, loading, error } = useRestrictions(bbox, {
  debounceMs: 500,
});
```

#### `hooks/useDebounce.ts`

**Purpose:** Debounce value changes

**Usage:**
```typescript
const debouncedValue = useDebounce(value, 500);
```

### Services

#### `services/api.ts` - ApiService

**Methods:**
- `getRestrictions(bbox, filters?)`: Fetch restrictions
- `getRestrictionById(relationId)`: Fetch single restriction
- `healthCheck()`: Health check

**Helper Functions:**
- `getOsmEditUrl(relationId)`: Generate OSM edit URL
- `getJosmUrl(relationId)`: Generate JOSM URL

### Configuration

#### `config/tiles.ts`

**Tile Layer Configurations:**
- `grayscale`: CARTO Light basemap
- `osm`: OpenStreetMap Standard

**Default Settings:**
- Center: Riyadh, Saudi Arabia `[24.7136, 46.6753]`
- Default zoom: 14

### Types

#### `types/index.ts`

**TypeScript Interfaces:**
- `ValidatedRestriction`: Restriction data structure
- `Issue`: Validation issue
- `FilterState`: Filter state structure
- `RestrictionResponse`: API response structure
- `BaseLayerType`: Available base layers

---

## Data Flow

### Complete Request Flow

```
1. User pans/zooms map
   ↓
2. MapContainer detects bounds change
   ↓
3. useRestrictions hook debounces bbox (500ms)
   ↓
4. ApiService.getRestrictions(bbox)
   ↓
5. GET /api/restrictions?bbox=...
   ↓
6. Backend: routes.py - get_restrictions()
   ├─ Validate bbox format/size
   ├─ Check cache (cache_service.get())
   │  ├─ Cache HIT → Return cached data
   │  └─ Cache MISS → Continue
   ├─ OverpassClient.fetch_restrictions(bbox)
   │  ├─ Build Overpass query
   │  ├─ POST to Overpass API (with retries)
   │  └─ Return OSM data
   ├─ ValidationEngine.validate(overpass_data)
   │  ├─ Parse elements into lookup tables
   │  ├─ Filter turn restrictions
   │  ├─ For each relation:
   │  │  ├─ Run all validation rules
   │  │  ├─ Compute location
   │  │  └─ Create ValidatedRestriction
   │  └─ Return list of ValidatedRestriction
   ├─ Cache results (cache_service.set())
   ├─ Apply filters (status, type)
   └─ Return RestrictionResponse
   ↓
7. Frontend receives response
   ↓
8. useRestrictions updates state
   ↓
9. MapContainer filters restrictions
   ↓
10. MarkerCluster renders markers
    ├─ Groups nearby markers
    ├─ Creates custom icons
    └─ Binds popups
```

### Validation Flow

```
Overpass Response
  ↓
ValidationEngine.validate()
  ↓
For each relation:
  ├─ Extract restriction type
  ├─ Filter (only turn restrictions)
  ├─ Parse members
  ├─ Run ALL_RULES:
  │  ├─ Member Rules
  │  │  ├─ MissingFromMemberRule
  │  │  ├─ MissingToMemberRule
  │  │  └─ MissingViaMemberRule
  │  ├─ Type Rules
  │  │  ├─ InvalidFromTypeRule
  │  │  ├─ InvalidToTypeRule
  │  │  ├─ InvalidViaTypeRule
  │  │  └─ MissingRestrictionTagRule
  │  └─ Warning Rules
  │     ├─ NonExistentMemberRule
  │     └─ OnewayInconsistencyRule
  ├─ Collect all issues
  ├─ Compute location
  └─ Create ValidatedRestriction
     └─ compute_status() → "ok" | "warning" | "error"
```

---

## Validation System

### How Validation Works

1. **Input:** Overpass API response (JSON with elements)
2. **Processing:**
   - Parse elements into lookup tables (by ID, by type)
   - Filter to only turn restrictions
   - For each restriction relation:
     - Extract members (from/to/via)
     - Extract tags
     - Run all validation rules
     - Collect issues
     - Compute location
3. **Output:** List of `ValidatedRestriction` objects

### Status Computation

```python
def compute_status(self) -> None:
    if any(i.severity == IssueSeverity.ERROR for i in self.issues):
        self.status = "error"
    elif any(i.severity == IssueSeverity.WARNING for i in self.issues):
        self.status = "warning"
    else:
        self.status = "ok"
```

**Priority:** ERROR > WARNING > OK

### Supported Restriction Types

**Prohibitory (No):**
- `no_left_turn`
- `no_right_turn`
- `no_straight_on`
- `no_u_turn`

**Mandatory (Only):**
- `only_left_turn`
- `only_right_turn`
- `only_straight_on`
- `only_u_turn`

**Note:** Access restrictions (`no_entry`, `no_exit`) are filtered out.

---

## Deployment

### Development

**Using Docker Compose:**
```bash
docker compose up
```

**Services:**
- `backend`: FastAPI on port 8080 (hot reload)
- `frontend`: Vite dev server on port 3000 (hot reload)

**Features:**
- Volume mounts for live code changes
- Separate containers for frontend/backend
- Environment variables from `.env`

### Production

**Multi-Stage Build:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

**Build Process:**
1. **Frontend Stage:**
   - Install dependencies
   - Build with Vite → `dist/`
2. **Backend Stage:**
   - Install Python dependencies
   - Copy backend code
   - Copy frontend `dist/` to `/app/frontend/dist`
3. **Production Stage:**
   - Copy built files
   - Create non-root user
   - Run uvicorn server

**Single Container:**
- Backend serves static frontend files
- FastAPI handles API routes and SPA routing
- Port 8080

### Environment Variables

**Required:**
- `OVERPASS_URL`: Overpass API endpoint
- `CORS_ORIGINS`: Allowed CORS origins (JSON array)

**Optional:**
- `PORT`: Server port (default: 8080)
- `DEBUG`: Enable debug mode (default: false)
- `CACHE_TTL_SECONDS`: Cache TTL (default: 300)
- `RATE_LIMIT_RPM`: Rate limit (default: 60)
- `MAX_BBOX_AREA`: Max bbox area (default: 2000)
- `MAX_REQUEST_SIZE`: Max request size in bytes (default: 1000000)

---

## Development Guide

### Setting Up Development Environment

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Adding a New Validation Rule

1. **Create rule file:**
   ```python
   # backend/app/validation/rules/my_rule.py
   from app.validation.models import Issue, IssueSeverity
   from app.validation.rules.base import ValidationRule
   
   class MyRule(ValidationRule):
       @property
       def code(self) -> str:
           return "my_rule_code"
       
       def check(self, relation, elements_by_id) -> list[Issue]:
           issues = []
           # Your validation logic
           if something_wrong:
               issues.append(Issue(
                   code=self.code,
                   message="Description",
                   severity=IssueSeverity.ERROR,  # or WARNING
               ))
           return issues
   ```

2. **Register in `__init__.py`:**
   ```python
   # backend/app/validation/rules/__init__.py
   from app.validation.rules.my_rule import MyRule
   
   ALL_RULES = [
       # ... existing rules ...
       MyRule,
   ]
   ```

### Running Tests

**Backend:**
```bash
cd backend
pytest tests/ -v
```

**Frontend:**
```bash
cd frontend
npm run type-check
npm run lint
```

### Code Style

**Backend:**
- Python: Black formatter, Ruff linter
- Type hints required
- Docstrings for public functions

**Frontend:**
- TypeScript: ESLint + Prettier
- React: Functional components, hooks
- Type definitions for all props

---

## API Reference

### Base URL

- Development: `http://localhost:8080`
- Production: `https://your-domain.com`

### Endpoints

#### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "restriction-validator"
}
```

#### `GET /api/restrictions`

Fetch turn restrictions for a bounding box.

**Query Parameters:**
- `bbox` (required): `minLon,minLat,maxLon,maxLat`
- `status` (optional): Filter by `ok`, `warning`, or `error`
- `type` (optional): Filter by restriction type

**Example:**
```bash
GET /api/restrictions?bbox=13.3,52.5,13.4,52.52&status=error
```

**Response:**
```json
{
  "restrictions": [
    {
      "id": 123456,
      "restriction_type": "no_left_turn",
      "status": "error",
      "issues": [
        {
          "code": "missing_from_member",
          "message": "\"from\" member is missing",
          "severity": "error"
        }
      ],
      "location": {
        "lat": 52.52,
        "lon": 13.405
      },
      "members": [...],
      "tags": {...}
    }
  ],
  "meta": {
    "total": 1,
    "errors": 1,
    "warnings": 0,
    "ok": 0,
    "bbox": [13.3, 52.5, 13.4, 52.52]
  }
}
```

#### `GET /api/restriction/{relation_id}`

Fetch a specific restriction by OSM relation ID.

**Path Parameters:**
- `relation_id` (required): OSM relation ID

**Example:**
```bash
GET /api/restriction/123456
```

**Response:**
```json
{
  "id": 123456,
  "restriction_type": "no_left_turn",
  "status": "ok",
  "issues": [],
  "location": {...},
  "members": [...],
  "tags": {...}
}
```

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid bbox format",
  "detail": "Bounding box too large (2500.0 sq degrees)..."
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded"
}
```

**503 Service Unavailable:**
```json
{
  "error": "Network error connecting to Overpass API"
}
```

---

## Additional Resources

- **README.md**: Quick start guide
- **CODE_REVIEW.md**: Detailed code review and recommendations
- **.env.example**: Environment variables template
- **docker-compose.yml**: Development setup
- **docker-compose.prod.yml**: Production setup

---

## Support

For issues or questions:
1. Check `CODE_REVIEW.md` for known issues
2. Review API documentation above
3. Check Docker logs: `docker compose logs`

---

**Last Updated:** 2024-12-25


