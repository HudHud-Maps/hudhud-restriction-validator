"""Validation rules module with auto-discovery."""

from app.validation.rules.base import ValidationRule
from app.validation.rules.member_rules import (
    MissingFromMemberRule,
    MissingToMemberRule,
    MissingViaMemberRule,
)
from app.validation.rules.type_rules import (
    InvalidFromTypeRule,
    InvalidToTypeRule,
    InvalidViaTypeRule,
    MissingRestrictionTagRule,
)
from app.validation.rules.warning_rules import (
    NonExistentMemberRule,
    OnewayInconsistencyRule,
)

# All available validation rules
ALL_RULES: list[type[ValidationRule]] = [
    # Error rules
    MissingFromMemberRule,
    MissingToMemberRule,
    MissingViaMemberRule,
    InvalidFromTypeRule,
    InvalidToTypeRule,
    InvalidViaTypeRule,
    MissingRestrictionTagRule,
    # Warning rules
    NonExistentMemberRule,
    OnewayInconsistencyRule,
]

__all__ = ["ValidationRule", "ALL_RULES"]

