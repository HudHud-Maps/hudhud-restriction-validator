"""Validation engine that orchestrates all validation rules."""

from typing import Any

from app.validation.models import (
    Coordinates,
    Issue,
    RestrictionMember,
    ValidatedRestriction,
)
from app.validation.rules import ALL_RULES, ValidationRule
from app.validation.rules.type_rules import VALID_TURN_RESTRICTION_TYPES


class ValidationEngine:
    """
    Engine that runs all validation rules against turn restrictions.

    The engine processes Overpass API response data and produces
    validated restriction objects with issues attached.
    """

    def __init__(self, rules: list[type[ValidationRule]] | None = None):
        """
        Initialize the validation engine.

        Args:
            rules: Optional list of rule classes to use. Defaults to ALL_RULES.
        """
        rule_classes = rules if rules is not None else ALL_RULES
        self.rules = [rule_class() for rule_class in rule_classes]

    def validate(self, overpass_data: dict[str, Any]) -> list[ValidatedRestriction]:
        """
        Validate all turn restrictions in Overpass response.

        Args:
            overpass_data: Raw Overpass API JSON response

        Returns:
            List of ValidatedRestriction objects with issues
        """
        elements = overpass_data.get("elements", [])

        # Build lookup tables
        elements_by_id: dict[int, dict[str, Any]] = {}
        relations: list[dict[str, Any]] = []
        nodes_by_id: dict[int, dict[str, Any]] = {}

        for element in elements:
            elem_id = element.get("id")
            elem_type = element.get("type")

            if elem_id:
                elements_by_id[elem_id] = element

            if elem_type == "relation":
                relations.append(element)
            elif elem_type == "node":
                nodes_by_id[elem_id] = element

        # Validate each relation (only turn restrictions, not access restrictions)
        validated = []
        for relation in relations:
            # Get restriction type to filter
            tags = relation.get("tags", {})
            restriction_type = None
            for key, value in tags.items():
                if key == "restriction" or key.startswith("restriction:"):
                    restriction_type = value
                    break
            
            # Skip non-turn restrictions (no_entry, no_exit, etc.)
            if restriction_type and restriction_type not in VALID_TURN_RESTRICTION_TYPES:
                continue
            
            validated_restriction = self._validate_relation(
                relation, elements_by_id, nodes_by_id
            )
            validated.append(validated_restriction)

        return validated

    def _validate_relation(
        self,
        relation: dict[str, Any],
        elements_by_id: dict[int, dict[str, Any]],
        nodes_by_id: dict[int, dict[str, Any]],
    ) -> ValidatedRestriction:
        """Validate a single relation and return ValidatedRestriction."""
        # Extract basic info
        relation_id = relation.get("id", 0)
        tags = relation.get("tags", {})
        members_raw = relation.get("members", [])

        # Get restriction type
        restriction_type = None
        for key, value in tags.items():
            if key == "restriction" or key.startswith("restriction:"):
                restriction_type = value
                break

        # Parse members
        members = [
            RestrictionMember(
                id=m.get("ref", 0),
                type=m.get("type", ""),
                role=m.get("role", ""),
                ref=m.get("ref"),
            )
            for m in members_raw
        ]

        # Run all validation rules
        all_issues: list[Issue] = []
        for rule in self.rules:
            issues = rule.check(relation, elements_by_id)
            all_issues.extend(issues)

        # Compute location from via node
        location = self._compute_location(members_raw, nodes_by_id, elements_by_id)

        # Create validated restriction
        validated = ValidatedRestriction(
            id=relation_id,
            restriction_type=restriction_type,
            members=members,
            tags=tags,
            issues=all_issues,
            location=location,
        )
        validated.compute_status()

        return validated

    def _compute_location(
        self,
        members: list[dict[str, Any]],
        nodes_by_id: dict[int, dict[str, Any]],
        elements_by_id: dict[int, dict[str, Any]],
    ) -> Coordinates | None:
        """
        Compute the location of a restriction from its via member.

        Tries to find coordinates from:
        1. Via node directly
        2. First node of via way
        3. First node of from way as fallback
        """
        # Try via member first
        for member in members:
            if member.get("role") == "via":
                ref = member.get("ref")
                if member.get("type") == "node" and ref in nodes_by_id:
                    node = nodes_by_id[ref]
                    if "lat" in node and "lon" in node:
                        return Coordinates(lat=node["lat"], lon=node["lon"])
                elif member.get("type") == "way" and ref in elements_by_id:
                    way = elements_by_id[ref]
                    nodes = way.get("nodes", [])
                    if nodes and nodes[0] in nodes_by_id:
                        node = nodes_by_id[nodes[0]]
                        if "lat" in node and "lon" in node:
                            return Coordinates(lat=node["lat"], lon=node["lon"])

        # Fallback to from member
        for member in members:
            if member.get("role") == "from":
                ref = member.get("ref")
                if ref in elements_by_id:
                    way = elements_by_id[ref]
                    nodes = way.get("nodes", [])
                    if nodes and nodes[-1] in nodes_by_id:
                        node = nodes_by_id[nodes[-1]]
                        if "lat" in node and "lon" in node:
                            return Coordinates(lat=node["lat"], lon=node["lon"])

        return None

