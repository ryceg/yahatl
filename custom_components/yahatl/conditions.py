"""Condition evaluation for HA entity state triggers.

Ported from C# MqttConditionEvaluator — supports eq, neq, gt, lt, gte, lte, bool operators.
"""
from __future__ import annotations

_TRUTHY = {"on", "true", "yes", "1"}
_FALSY = {"off", "false", "no", "0"}


def evaluate_condition(actual: str, operator: str, expected: str) -> bool:
    if operator == "eq":
        return actual == expected
    if operator == "neq":
        return actual != expected
    if operator == "bool":
        actual_bool = actual.lower() in _TRUTHY
        expected_bool = expected.lower() in _TRUTHY
        return actual_bool == expected_bool
    if operator in ("gt", "lt", "gte", "lte"):
        try:
            a, b = float(actual), float(expected)
        except (ValueError, TypeError):
            return False
        if operator == "gt":
            return a > b
        if operator == "lt":
            return a < b
        if operator == "gte":
            return a >= b
        if operator == "lte":
            return a <= b
    return False
