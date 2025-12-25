"""Validation rules for checking required members (from/to/via)."""

from typing import Any

from app.validation.models import Issue, IssueSeverity
from app.validation.rules.base import ValidationRule


class MissingFromMemberRule(ValidationRule):
    """Check that the relation has a 'from' member."""

    @property
    def code(self) -> str:
        return "missing_from_member"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        has_from = any(m.get("role") == "from" for m in members)

        if not has_from:
            return [
                Issue(
                    code=self.code,
                    message='"from" member is missing',
                    severity=IssueSeverity.ERROR,
                )
            ]
        return []


class MissingToMemberRule(ValidationRule):
    """Check that the relation has a 'to' member."""

    @property
    def code(self) -> str:
        return "missing_to_member"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        has_to = any(m.get("role") == "to" for m in members)

        if not has_to:
            return [
                Issue(
                    code=self.code,
                    message='"to" member is missing',
                    severity=IssueSeverity.ERROR,
                )
            ]
        return []


class MissingViaMemberRule(ValidationRule):
    """Check that the relation has a 'via' member."""

    @property
    def code(self) -> str:
        return "missing_via_member"

    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        members = relation.get("members", [])
        has_via = any(m.get("role") == "via" for m in members)

        if not has_via:
            return [
                Issue(
                    code=self.code,
                    message='"via" member is missing',
                    severity=IssueSeverity.ERROR,
                )
            ]
        return []

