"""Tests for condition evaluation."""
from custom_components.yahatl.conditions import evaluate_condition


def test_eq():
    assert evaluate_condition("idle", "eq", "idle") is True
    assert evaluate_condition("running", "eq", "idle") is False


def test_neq():
    assert evaluate_condition("running", "neq", "idle") is True
    assert evaluate_condition("idle", "neq", "idle") is False


def test_numeric_gt():
    assert evaluate_condition("25.5", "gt", "20") is True
    assert evaluate_condition("15", "gt", "20") is False


def test_numeric_lt():
    assert evaluate_condition("15", "lt", "20") is True
    assert evaluate_condition("25", "lt", "20") is False


def test_numeric_gte():
    assert evaluate_condition("20", "gte", "20") is True
    assert evaluate_condition("19", "gte", "20") is False


def test_numeric_lte():
    assert evaluate_condition("20", "lte", "20") is True
    assert evaluate_condition("21", "lte", "20") is False


def test_bool_truthy():
    for truthy in ["on", "true", "yes", "1", "True", "ON"]:
        assert evaluate_condition(truthy, "bool", "true") is True
    for falsy in ["off", "false", "no", "0", "False", "OFF"]:
        assert evaluate_condition(falsy, "bool", "true") is False


def test_bool_falsy():
    for falsy in ["off", "false", "no", "0"]:
        assert evaluate_condition(falsy, "bool", "false") is True


def test_non_numeric_comparison_falls_back():
    assert evaluate_condition("abc", "gt", "def") is False


def test_unknown_operator():
    assert evaluate_condition("x", "unknown_op", "y") is False
