using System.ComponentModel.DataAnnotations;

namespace Yahatl.Api.Models;

// ==================== TRIGGER DTOs ====================

public record CreateFixedTriggerRequest(
    [Required] string CronPattern
);

public record CreateIntervalTriggerRequest(
    [Required] int IntervalDays
);

public record CreateWindowTriggerRequest(
    [Required] string WindowsJson,
    string Recurrence = "weekly",
    string WindowExpiry = "end_of_last_window"
);

public record CreateConditionTriggerRequest(
    [Required] string MqttTopic,
    [Required] string Operator,
    [Required] string Value
);

public record TriggerResponse(
    Guid Id,
    string Type,
    object Config
);

// ==================== BLOCKER DTOs ====================

public record CreateNoteBlockerRequest(
    [Required] Guid TargetNoteId,
    bool NotifyOnResolve = false
);

public record CreatePersonBlockerRequest(
    [Required] Guid PersonNoteId,
    string? Reason = null,
    bool NotifyOnResolve = false
);

public record CreateTimeBlockerRequest(
    [Required] string WindowsJson,
    bool NotifyOnResolve = false
);

public record CreateConditionBlockerRequest(
    [Required] string MqttTopic,
    [Required] string Operator,
    [Required] string Value,
    bool NotifyOnResolve = false
);

public record CreateUntilDateBlockerRequest(
    [Required] DateTime Until,
    bool NotifyOnResolve = false
);

public record CreateFreetextBlockerRequest(
    [Required] string Description,
    bool NotifyOnResolve = false
);

public record BlockerResponse(
    Guid Id,
    string Type,
    bool IsActive,
    bool NotifyOnResolve,
    object Config
);

// ==================== UPDATE DTOs ====================

public record UpdateTriggerRequest(
    string? CronPattern = null,
    int? IntervalDays = null,
    string? WindowsJson = null,
    string? Recurrence = null,
    string? WindowExpiry = null,
    string? MqttTopic = null,
    string? Operator = null,
    string? Value = null
);

public record TriggerEvaluationResponse(
    Guid Id,
    string Type,
    bool IsActive
);

public record UpdateBlockerRequest(
    bool? IsActive = null,
    bool? NotifyOnResolve = null,
    Guid? TargetNoteId = null,
    Guid? PersonNoteId = null,
    string? Reason = null,
    string? WindowsJson = null,
    string? MqttTopic = null,
    string? Operator = null,
    string? Value = null,
    DateTime? Until = null,
    string? Description = null
);

public record BlockerEvaluationResponse(
    Guid Id,
    string Type,
    bool IsActive,
    string Reason
);
