"""Pydantic models for validation results."""

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel


class IssueSeverity(str, Enum):
    """Severity level for validation issues."""

    ERROR = "error"
    WARNING = "warning"


class Issue(BaseModel):
    """A single validation issue."""

    code: str
    message: str
    severity: IssueSeverity


class RestrictionMember(BaseModel):
    """A member of a turn restriction relation."""

    id: int
    type: str  # "node", "way", or "relation"
    role: str  # "from", "to", "via", or other
    ref: Optional[int] = None


class Coordinates(BaseModel):
    """Geographic coordinates."""

    lat: float
    lon: float


class ValidatedRestriction(BaseModel):
    """A turn restriction with validation results."""

    id: int
    restriction_type: Optional[str] = None
    members: list[RestrictionMember] = []
    tags: dict[str, str] = {}
    issues: list[Issue] = []
    status: str = "ok"  # "ok", "warning", "error"
    location: Optional[Coordinates] = None

    def compute_status(self) -> None:
        """Compute status based on issues."""
        if any(i.severity == IssueSeverity.ERROR for i in self.issues):
            self.status = "error"
        elif any(i.severity == IssueSeverity.WARNING for i in self.issues):
            self.status = "warning"
        else:
            self.status = "ok"


class RestrictionResponse(BaseModel):
    """API response for restrictions endpoint."""

    restrictions: list[ValidatedRestriction]
    meta: dict[str, Any]


class ErrorResponse(BaseModel):
    """API error response."""

    error: str
    detail: Optional[str] = None

