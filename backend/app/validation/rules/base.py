"""Base class for validation rules."""

from abc import ABC, abstractmethod
from typing import Any

from app.validation.models import Issue


class ValidationRule(ABC):
    """
    Abstract base class for validation rules.

    To add a new rule:
    1. Create a new file in the rules/ directory
    2. Subclass ValidationRule
    3. Implement the check() method
    4. Add the rule to ALL_RULES in rules/__init__.py
    """

    @property
    @abstractmethod
    def code(self) -> str:
        """Unique code for this rule (e.g., 'missing_from_member')."""
        pass

    @abstractmethod
    def check(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> list[Issue]:
        """
        Check a relation for issues.

        Args:
            relation: The OSM relation dict with 'id', 'members', 'tags'
            elements_by_id: Lookup dict of all elements (nodes, ways) by their ID

        Returns:
            List of Issue objects found (empty if rule passes)
        """
        pass
