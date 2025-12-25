"""Validation rules for checking member types and restriction tags."""

from typing import Any

from app.validation.models import Issue, IssueSeverity
from app.validation.rules.base import ValidationRule

# Valid turn restriction types (excluding no_entry/no_exit which are access restrictions)
VALID_TURN_RESTRICTION_TYPES = {
    # Prohibitory turn restrictions
    "no_left_turn",
    "no_right_turn",
    "no_straight_on",
    "no_u_turn",
    # Mandatory turn restrictions
    "only_left_turn",
    "only_right_turn",
    "only_straight_on",
    "only_u_turn",
}

# All valid restriction types (for reference, but we focus on turn restrictions)
VALID_RESTRICTION_TYPES = VALID_TURN_RESTRICTION_TYPES | {"no_entry", "no_exit"}


class InvalidFromTypeRule(ValidationRule):
    """Check that 'from' member is a way."""

    @property
    def code(self) -> str:
        return "invalid_from_type"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        issues = []

        for member in members:
            if member.get("role") == "from":
                if member.get("type") != "way":
                    issues.append(
                        Issue(
                            code=self.code,
                            message=f'"from" member must be a way, got {member.get("type")}',
                            severity=IssueSeverity.ERROR,
                        )
                    )

        return issues


class InvalidToTypeRule(ValidationRule):
    """Check that 'to' member is a way."""

    @property
    def code(self) -> str:
        return "invalid_to_type"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        issues = []

        for member in members:
            if member.get("role") == "to":
                if member.get("type") != "way":
                    issues.append(
                        Issue(
                            code=self.code,
                            message=f'"to" member must be a way, got {member.get("type")}',
                            severity=IssueSeverity.ERROR,
                        )
                    )

        return issues


class InvalidViaTypeRule(ValidationRule):
    """Check that 'via' member is a node or way."""

    @property
    def code(self) -> str:
        return "invalid_via_type"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        issues = []

        for member in members:
            if member.get("role") == "via":
                member_type = member.get("type")
                if member_type not in ("node", "way"):
                    issues.append(
                        Issue(
                            code=self.code,
                            message=f'"via" member must be a node or way, got {member_type}',
                            severity=IssueSeverity.ERROR,
                        )
                    )

        return issues


class MissingRestrictionTagRule(ValidationRule):
    """Check that the relation has a valid restriction tag."""

    @property
    def code(self) -> str:
        return "missing_restriction_tag"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        tags = relation.get("tags", {})

        # Check for restriction tag (can be 'restriction' or 'restriction:*')
        restriction_value = None
        for key, value in tags.items():
            if key == "restriction" or key.startswith("restriction:"):
                restriction_value = value
                break

        if not restriction_value:
            return [
                Issue(
                    code=self.code,
                    message="restriction tag is missing",
                    severity=IssueSeverity.ERROR,
                )
            ]

        # Check if it's a recognized restriction type
        if restriction_value not in VALID_RESTRICTION_TYPES:
            return [
                Issue(
                    code="unrecognized_restriction_type",
                    message=f'unrecognized restriction type: "{restriction_value}"',
                    severity=IssueSeverity.WARNING,
                )
            ]

        return []

