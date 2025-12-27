"""Validation rules that produce warnings (suspicious but not strictly invalid)."""

from typing import Any

from app.validation.models import Issue, IssueSeverity
from app.validation.rules.base import ValidationRule


class NonExistentMemberRule(ValidationRule):
    """Check if restriction references members not found in the payload."""

    @property
    def code(self) -> str:
        return "nonexistent_member"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        issues = []

        for member in members:
            ref = member.get("ref")
            if ref and ref not in elements_by_id:
                issues.append(
                    Issue(
                        code=self.code,
                        message=f"member {member.get('role', 'unknown')} (id={ref}) not found in data",
                        severity=IssueSeverity.WARNING,
                    )
                )

        return issues


class OnewayInconsistencyRule(ValidationRule):
    """
    Check if restriction direction seems inconsistent with oneway tags.

    This is a basic heuristic that checks if a 'no_*_turn' restriction
    is applied to a way that's a oneway in the opposite direction.
    """

    @property
    def code(self) -> str:
        return "oneway_inconsistency"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        tags = relation.get("tags", {})
        members = relation.get("members", [])
        issues = []

        # Get restriction type
        restriction_type = None
        for key, value in tags.items():
            if key == "restriction" or key.startswith("restriction:"):
                restriction_type = value
                break

        if not restriction_type:
            return []

        # Check 'to' ways for oneway inconsistencies
        for member in members:
            if member.get("role") == "to":
                ref = member.get("ref")
                if ref and ref in elements_by_id:
                    way = elements_by_id[ref]
                    way_tags = way.get("tags", {})

                    # Check if it's a oneway
                    oneway = way_tags.get("oneway")
                    if oneway == "-1":
                        # Oneway in reverse direction - might be suspicious
                        # for certain restriction types
                        if restriction_type in ("no_entry", "no_exit"):
                            issues.append(
                                Issue(
                                    code=self.code,
                                    message="restriction on way with oneway=-1 may be redundant",
                                    severity=IssueSeverity.WARNING,
                                )
                            )

        return issues


class RedundantRestrictionRule(ValidationRule):
    """
    Basic heuristic to detect potentially redundant restrictions.

    For example, a no_u_turn on a divided highway might be redundant
    due to physical barriers.
    """

    @property
    def code(self) -> str:
        return "redundant_restriction"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        # This is a placeholder for more sophisticated redundancy detection
        # In a real implementation, this would analyze road geometry,
        # physical barriers, and other factors
        return []
