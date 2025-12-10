using System.ComponentModel.DataAnnotations;
using Yahatl.Domain.Entities;

namespace Yahatl.Api.Models;

// ==================== PAGINATION ====================

public record PaginatedResponse<T>(
    List<T> Items,
    int TotalCount,
    int Limit,
    int Offset
);

// ==================== NOTE DTOs ====================

public record CreateNoteRequest(
    [Required] string Title,
    string? Body = null,
    TemplateType TemplateType = TemplateType.None,
    Guid? AssigneeId = null,
    List<string>? Tags = null,
    bool NeedsDetail = false
);

public record UpdateNoteRequest(
    [Required] string Title,
    string? Body = null,
    TemplateType TemplateType = TemplateType.None,
    Guid? AssigneeId = null,
    List<string>? Tags = null,
    bool NeedsDetail = false
);

public record NoteResponse(
    Guid Id,
    string Title,
    string? Body,
    TemplateType TemplateType,
    Guid OwnerId,
    Guid? AssigneeId,
    Guid HouseholdId,
    bool IsArchived,
    bool IsInbox,
    bool NeedsDetail,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<string> Tags,
    List<NoteLinkResponse> LinksFrom,
    List<NoteLinkResponse> LinksTo,
    List<BehaviourResponse> Behaviours
);

public record NoteListItemResponse(
    Guid Id,
    string Title,
    TemplateType TemplateType,
    Guid OwnerId,
    Guid? AssigneeId,
    bool IsInbox,
    bool NeedsDetail,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<string> Tags
);

public record NoteLinkResponse(
    Guid Id,
    Guid NoteId,
    string NoteTitle
);

// ==================== BEHAVIOUR DTOs ====================

public abstract record BehaviourResponse(
    Guid Id,
    string Type
);

public record TaskBehaviourResponse(
    Guid Id,
    Domain.Entities.TaskExecutionStatus Status,
    DateTime? DueDate,
    Priority Priority,
    DateTime? CompletedAt
) : BehaviourResponse(Id, "Task");

public record HabitBehaviourResponse(
    Guid Id,
    string FrequencyGoal,
    int CurrentStreak,
    int LongestStreak
) : BehaviourResponse(Id, "Habit");

public record ChoreBehaviourResponse(
    Guid Id,
    DateTime? LastCompleted,
    DateTime NextDue
) : BehaviourResponse(Id, "Chore");

public record ReminderBehaviourResponse(
    Guid Id,
    string NotificationSettingsJson
) : BehaviourResponse(Id, "Reminder");

// ==================== CREATE BEHAVIOUR DTOs ====================

public record CreateTaskBehaviourRequest(
    DateTime? DueDate = null,
    Priority Priority = Priority.Normal
);

public record CreateHabitBehaviourRequest(
    string FrequencyGoal = "daily"
);

public record CreateChoreBehaviourRequest(
    DateTime? NextDue = null
);

public record CreateReminderBehaviourRequest(
    string NotificationSettingsJson = "{}"
);

// ==================== QUICK CAPTURE ====================

public record QuickCaptureRequest(
    [Required] string Title,
    List<string>? Tags = null
);

public record AddTagsRequest(
    [Required] List<string> Tags
);

// ==================== NEEDS DETAIL ====================

public record ToggleNeedsDetailRequest(
    bool? NeedsDetail = null
);

public record NeedsDetailResponse(
    Guid NoteId,
    bool NeedsDetail
);
