using Xunit;
using Yahatl.Infrastructure.Mqtt;

namespace Yahatl.Infrastructure.Tests;

public class MqttConditionEvaluatorTests
{
    // ==================== EQUALITY TESTS ====================

    [Theory]
    [InlineData("42", "42", true)]
    [InlineData("42", "43", false)]
    [InlineData("hello", "hello", true)]
    [InlineData("hello", "Hello", true)] // Case insensitive
    [InlineData("hello", "world", false)]
    [InlineData("3.14", "3.14", true)]
    [InlineData("3.14", "3.140", true)] // Numeric comparison
    public void Evaluate_Eq_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("eq", configured, actual);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("42", "42", false)]
    [InlineData("42", "43", true)]
    [InlineData("hello", "hello", false)]
    [InlineData("hello", "world", true)]
    public void Evaluate_Neq_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("neq", configured, actual);
        Assert.Equal(expected, result);
    }

    // ==================== NUMERIC COMPARISON TESTS ====================

    [Theory]
    [InlineData("50", "51", true)]
    [InlineData("50", "50", false)]
    [InlineData("50", "49", false)]
    [InlineData("3.14", "3.15", true)]
    [InlineData("-10", "-5", true)]
    public void Evaluate_Gt_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("gt", configured, actual);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("50", "49", true)]
    [InlineData("50", "50", false)]
    [InlineData("50", "51", false)]
    [InlineData("3.14", "3.13", true)]
    public void Evaluate_Lt_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("lt", configured, actual);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("50", "50", true)]
    [InlineData("50", "51", true)]
    [InlineData("50", "49", false)]
    public void Evaluate_Gte_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("gte", configured, actual);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("50", "50", true)]
    [InlineData("50", "49", true)]
    [InlineData("50", "51", false)]
    public void Evaluate_Lte_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("lte", configured, actual);
        Assert.Equal(expected, result);
    }

    // ==================== BOOLEAN TESTS ====================

    [Theory]
    [InlineData("true", "true", true)]
    [InlineData("true", "false", false)]
    [InlineData("false", "false", true)]
    [InlineData("true", "1", true)]
    [InlineData("true", "0", false)]
    [InlineData("true", "on", true)]
    [InlineData("true", "off", false)]
    [InlineData("true", "yes", true)]
    [InlineData("true", "no", false)]
    [InlineData("false", "0", true)]
    [InlineData("1", "true", true)]
    [InlineData("0", "false", true)]
    public void Evaluate_Bool_ReturnsExpected(string configured, string actual, bool expected)
    {
        var result = MqttConditionEvaluator.Evaluate("bool", configured, actual);
        Assert.Equal(expected, result);
    }

    // ==================== EDGE CASES ====================

    [Fact]
    public void Evaluate_EmptyActualValue_ReturnsFalse()
    {
        Assert.False(MqttConditionEvaluator.Evaluate("eq", "test", ""));
        Assert.False(MqttConditionEvaluator.Evaluate("gt", "50", ""));
        Assert.False(MqttConditionEvaluator.Evaluate("bool", "true", ""));
    }

    [Fact]
    public void Evaluate_NullActualValue_ReturnsFalse()
    {
        Assert.False(MqttConditionEvaluator.Evaluate("eq", "test", null!));
    }

    [Fact]
    public void Evaluate_UnknownOperator_ReturnsFalse()
    {
        Assert.False(MqttConditionEvaluator.Evaluate("unknown", "test", "test"));
        Assert.False(MqttConditionEvaluator.Evaluate("INVALID", "50", "50"));
    }

    [Theory]
    [InlineData("EQ")]
    [InlineData("Eq")]
    [InlineData("eQ")]
    public void Evaluate_OperatorIsCaseInsensitive(string op)
    {
        var result = MqttConditionEvaluator.Evaluate(op, "test", "test");
        Assert.True(result);
    }

    [Fact]
    public void Evaluate_NumericComparisonWithNonNumericValue_ReturnsFalse()
    {
        Assert.False(MqttConditionEvaluator.Evaluate("gt", "50", "not_a_number"));
        Assert.False(MqttConditionEvaluator.Evaluate("lt", "not_a_number", "50"));
    }

    [Fact]
    public void Evaluate_DecimalValues_WorkCorrectly()
    {
        Assert.True(MqttConditionEvaluator.Evaluate("gt", "99.99", "100.00"));
        Assert.True(MqttConditionEvaluator.Evaluate("eq", "3.14159", "3.14159"));
        Assert.True(MqttConditionEvaluator.Evaluate("lt", "0.001", "0.0005"));
    }

    [Fact]
    public void Evaluate_NegativeNumbers_WorkCorrectly()
    {
        Assert.True(MqttConditionEvaluator.Evaluate("gt", "-10", "-5"));
        Assert.True(MqttConditionEvaluator.Evaluate("lt", "0", "-5"));
        Assert.True(MqttConditionEvaluator.Evaluate("eq", "-42", "-42"));
    }
}
