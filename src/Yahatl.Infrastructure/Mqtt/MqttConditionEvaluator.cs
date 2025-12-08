using System.Globalization;

namespace Yahatl.Infrastructure.Mqtt;

/// <summary>
/// Evaluates conditions from MQTT messages against configured thresholds.
/// Used by ConditionTrigger and ConditionBlocker entities.
/// </summary>
public static class MqttConditionEvaluator
{
    /// <summary>
    /// Evaluate a condition against a value.
    /// </summary>
    /// <param name="operator">The comparison operator: eq, neq, gt, lt, gte, lte, bool</param>
    /// <param name="configuredValue">The configured threshold value (as string)</param>
    /// <param name="actualValue">The actual value received from MQTT (as string)</param>
    /// <returns>True if the condition is met</returns>
    public static bool Evaluate(string @operator, string configuredValue, string actualValue)
    {
        if (string.IsNullOrEmpty(actualValue))
        {
            return false;
        }

        return @operator.ToLowerInvariant() switch
        {
            "eq" => EvaluateEquality(configuredValue, actualValue, equal: true),
            "neq" => EvaluateEquality(configuredValue, actualValue, equal: false),
            "gt" => EvaluateNumeric(configuredValue, actualValue, (a, c) => a > c),
            "lt" => EvaluateNumeric(configuredValue, actualValue, (a, c) => a < c),
            "gte" => EvaluateNumeric(configuredValue, actualValue, (a, c) => a >= c),
            "lte" => EvaluateNumeric(configuredValue, actualValue, (a, c) => a <= c),
            "bool" => EvaluateBool(configuredValue, actualValue),
            _ => false
        };
    }

    private static bool EvaluateEquality(string configuredValue, string actualValue, bool equal)
    {
        // Try numeric comparison first
        if (TryParseDecimal(configuredValue, out var configNum) && TryParseDecimal(actualValue, out var actualNum))
        {
            return equal ? actualNum == configNum : actualNum != configNum;
        }

        // Fall back to string comparison (case-insensitive)
        var areEqual = string.Equals(configuredValue, actualValue, StringComparison.OrdinalIgnoreCase);
        return equal ? areEqual : !areEqual;
    }

    private static bool EvaluateNumeric(string configuredValue, string actualValue, Func<decimal, decimal, bool> comparison)
    {
        if (!TryParseDecimal(configuredValue, out var configNum))
        {
            return false;
        }

        if (!TryParseDecimal(actualValue, out var actualNum))
        {
            return false;
        }

        return comparison(actualNum, configNum);
    }

    private static bool EvaluateBool(string configuredValue, string actualValue)
    {
        var actualBool = ParseBoolValue(actualValue);
        var configBool = ParseBoolValue(configuredValue);

        return actualBool == configBool;
    }

    private static bool ParseBoolValue(string value)
    {
        var lower = value.ToLowerInvariant().Trim();
        return lower switch
        {
            "true" or "1" or "on" or "yes" => true,
            "false" or "0" or "off" or "no" => false,
            _ => false
        };
    }

    private static bool TryParseDecimal(string value, out decimal result)
    {
        return decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }
}
