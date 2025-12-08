using Microsoft.EntityFrameworkCore;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Infrastructure.Services;

/// <summary>
/// Implementation of the Day Generator service for calculating actionable items.
/// </summary>
public class DayGeneratorService(
    YahatlDbContext dbContext,
    ICurrentUserService currentUserService) : IDayGeneratorService
{
    public async Task<CandidatesResult> GetCandidatesAsync()
    {
        var userId = currentUserService.UserId ?? throw new InvalidOperationException("User not authenticated");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Get all notes with task or chore behaviours that aren't complete
        var notes = await dbContext.Notes
            .Include(n => n.Behaviours)
            .Include(n => n.Triggers)
            .Include(n => n.Blockers)
            .Where(n => n.OwnerId == userId || n.AssigneeId == userId)
            .Where(n => n.Behaviours.Any(b =>
                (b is TaskBehaviour tb && tb.Status == TaskStatus.Pending) ||
                b is ChoreBehaviour ||
                b is HabitBehaviour))
            .ToListAsync();

        // Get items already in today's plan
        var plannedNoteIds = await dbContext.DailyPlanItems
            .Where(p => p.UserId == userId && p.PlanDate == today)
            .Select(p => p.NoteId)
            .ToListAsync();

        var urgent = new List<CandidateItem>();
        var dueSoon = new List<CandidateItem>();
        var available = new List<CandidateItem>();

        foreach (var note in notes)
        {
            // Skip if already in today's plan
            if (plannedNoteIds.Contains(note.Id))
                continue;

            // Check if blocked
            if (IsBlocked(note))
                continue;

            var candidate = EvaluateCandidate(note, today);
            if (candidate == null)
                continue;

            switch (candidate.Reason)
            {
                case CandidateReason.Overdue:
                case CandidateReason.StreakAtRisk:
                    urgent.Add(candidate);
                    break;
                case CandidateReason.DueToday:
                case CandidateReason.WindowClosingSoon:
                    dueSoon.Add(candidate);
                    break;
                default:
                    available.Add(candidate);
                    break;
            }
        }

        // Sort each section
        urgent = [.. urgent.OrderByDescending(c => c.OverdueDays ?? 0).ThenBy(c => c.Priority)];
        dueSoon = [.. dueSoon.OrderBy(c => c.DueDate).ThenBy(c => c.Priority)];
        available = [.. available.OrderBy(c => c.Priority)];

        return new CandidatesResult(urgent, dueSoon, available);
    }

    public async Task<List<PlanItem>> GetTodaysPlanAsync()
    {
        var userId = currentUserService.UserId ?? throw new InvalidOperationException("User not authenticated");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var planItems = await dbContext.DailyPlanItems
            .Include(p => p.Note)
                .ThenInclude(n => n!.Behaviours)
            .Where(p => p.UserId == userId && p.PlanDate == today)
            .OrderBy(p => p.Order)
            .ToListAsync();

        return planItems.Select(p =>
        {
            var taskBehaviour = p.Note?.Behaviours.OfType<TaskBehaviour>().FirstOrDefault();
            var isComplete = taskBehaviour?.Status == TaskStatus.Complete;

            return new PlanItem(
                p.NoteId,
                p.Note?.Title ?? "",
                p.Note?.TemplateType ?? TemplateType.None,
                p.Order,
                isComplete,
                taskBehaviour?.CompletedAt
            );
        }).ToList();
    }

    public async Task AddToPlanAsync(Guid noteId)
    {
        var userId = currentUserService.UserId ?? throw new InvalidOperationException("User not authenticated");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Check if already in plan
        var exists = await dbContext.DailyPlanItems
            .AnyAsync(p => p.UserId == userId && p.PlanDate == today && p.NoteId == noteId);

        if (exists)
            return;

        // Get next order
        var maxOrder = await dbContext.DailyPlanItems
            .Where(p => p.UserId == userId && p.PlanDate == today)
            .MaxAsync(p => (int?)p.Order) ?? 0;

        var planItem = new DailyPlanItem
        {
            UserId = userId,
            NoteId = noteId,
            PlanDate = today,
            Order = maxOrder + 1
        };

        dbContext.DailyPlanItems.Add(planItem);
        await dbContext.SaveChangesAsync();
    }

    public async Task RemoveFromPlanAsync(Guid noteId)
    {
        var userId = currentUserService.UserId ?? throw new InvalidOperationException("User not authenticated");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var planItem = await dbContext.DailyPlanItems
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PlanDate == today && p.NoteId == noteId);

        if (planItem != null)
        {
            dbContext.DailyPlanItems.Remove(planItem);
            await dbContext.SaveChangesAsync();
        }
    }

    public async Task ReorderPlanAsync(List<Guid> noteIds)
    {
        var userId = currentUserService.UserId ?? throw new InvalidOperationException("User not authenticated");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var planItems = await dbContext.DailyPlanItems
            .Where(p => p.UserId == userId && p.PlanDate == today)
            .ToListAsync();

        for (int i = 0; i < noteIds.Count; i++)
        {
            var item = planItems.FirstOrDefault(p => p.NoteId == noteIds[i]);
            if (item != null)
            {
                item.Order = i + 1;
            }
        }

        await dbContext.SaveChangesAsync();
    }

    public Task<bool> IsActionableAsync(Note note)
    {
        // Check if any trigger is active
        var hasActiveTrigger = note.Triggers.Any(t => IsTriggerFired(t, note));

        // Check if any blocker is active
        var isBlocked = IsBlocked(note);

        return Task.FromResult(hasActiveTrigger && !isBlocked);
    }

    public async Task<RolloverResult> RolloverIncompleteAsync()
    {
        var userId = currentUserService.UserId ?? throw new InvalidOperationException("User not authenticated");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var tomorrow = today.AddDays(1);

        // Get today's incomplete items
        var incompleteItems = await dbContext.DailyPlanItems
            .Include(p => p.Note)
                .ThenInclude(n => n!.Behaviours)
            .Where(p => p.UserId == userId && p.PlanDate == today)
            .Where(p => !p.Note!.Behaviours.OfType<TaskBehaviour>().Any(t => t.Status == TaskStatus.Complete))
            .ToListAsync();

        var rolledOverIds = new List<Guid>();

        foreach (var item in incompleteItems)
        {
            // Check if already has tomorrow's plan item for this note
            var existsForTomorrow = await dbContext.DailyPlanItems
                .AnyAsync(p => p.UserId == userId && p.PlanDate == tomorrow && p.NoteId == item.NoteId);

            if (!existsForTomorrow)
            {
                var maxOrder = await dbContext.DailyPlanItems
                    .Where(p => p.UserId == userId && p.PlanDate == tomorrow)
                    .MaxAsync(p => (int?)p.Order) ?? 0;

                var newPlanItem = new DailyPlanItem
                {
                    UserId = userId,
                    NoteId = item.NoteId,
                    PlanDate = tomorrow,
                    Order = maxOrder + 1
                };

                dbContext.DailyPlanItems.Add(newPlanItem);
                rolledOverIds.Add(item.NoteId);
            }
        }

        await dbContext.SaveChangesAsync();

        return new RolloverResult(rolledOverIds.Count, rolledOverIds);
    }

    private bool IsBlocked(Note note)
    {
        var now = DateTime.UtcNow;

        foreach (var blocker in note.Blockers.Where(b => b.IsActive))
        {
            switch (blocker)
            {
                case UntilDateBlocker udb:
                    if (now < udb.Until)
                        return true;
                    break;

                case TimeBlocker tb:
                    // TODO: Parse WindowsJson and check current time
                    break;

                case NoteBlocker:
                case PersonBlocker:
                case FreetextBlocker:
                case ConditionBlocker:
                    // These are manually managed or MQTT-driven
                    return true;
            }
        }

        return false;
    }

    private CandidateItem? EvaluateCandidate(Note note, DateOnly today)
    {
        var taskBehaviour = note.Behaviours.OfType<TaskBehaviour>().FirstOrDefault();
        var choreBehaviour = note.Behaviours.OfType<ChoreBehaviour>().FirstOrDefault();
        var habitBehaviour = note.Behaviours.OfType<HabitBehaviour>().FirstOrDefault();

        // Task behaviour evaluation
        if (taskBehaviour != null)
        {
            if (taskBehaviour.DueDate.HasValue)
            {
                var dueDate = DateOnly.FromDateTime(taskBehaviour.DueDate.Value);

                if (dueDate < today)
                {
                    var overdueDays = today.DayNumber - dueDate.DayNumber;
                    return new CandidateItem(
                        note.Id,
                        note.Title,
                        note.TemplateType,
                        CandidateReason.Overdue,
                        taskBehaviour.DueDate,
                        overdueDays,
                        false,
                        taskBehaviour.Priority
                    );
                }
                else if (dueDate == today)
                {
                    return new CandidateItem(
                        note.Id,
                        note.Title,
                        note.TemplateType,
                        CandidateReason.DueToday,
                        taskBehaviour.DueDate,
                        null,
                        false,
                        taskBehaviour.Priority
                    );
                }
            }

            // No due date, but still a pending task
            return new CandidateItem(
                note.Id,
                note.Title,
                note.TemplateType,
                CandidateReason.Available,
                null,
                null,
                false,
                taskBehaviour.Priority
            );
        }

        // Chore behaviour evaluation
        if (choreBehaviour != null)
        {
            var nextDue = DateOnly.FromDateTime(choreBehaviour.NextDue);

            if (nextDue <= today)
            {
                var overdueDays = nextDue < today ? today.DayNumber - nextDue.DayNumber : 0;
                return new CandidateItem(
                    note.Id,
                    note.Title,
                    note.TemplateType,
                    overdueDays > 0 ? CandidateReason.Overdue : CandidateReason.DueToday,
                    choreBehaviour.NextDue,
                    overdueDays > 0 ? overdueDays : null,
                    false,
                    Priority.Normal
                );
            }
        }

        // Habit behaviour evaluation
        if (habitBehaviour != null)
        {
            // TODO: Implement proper streak calculation
            // For now, habits are always available
            return new CandidateItem(
                note.Id,
                note.Title,
                note.TemplateType,
                CandidateReason.Available,
                null,
                null,
                false,
                Priority.Normal
            );
        }

        // Check triggers for condition-based items
        foreach (var trigger in note.Triggers)
        {
            if (IsTriggerFired(trigger, note))
            {
                return new CandidateItem(
                    note.Id,
                    note.Title,
                    note.TemplateType,
                    trigger is ConditionTrigger ? CandidateReason.ConditionMet : CandidateReason.Available,
                    null,
                    null,
                    false,
                    Priority.Normal
                );
            }
        }

        return null;
    }

    private bool IsTriggerFired(Trigger trigger, Note note)
    {
        var now = DateTime.UtcNow;

        return trigger switch
        {
            IntervalTrigger it =>
                (note.Behaviours.OfType<ChoreBehaviour>().FirstOrDefault()?.LastCompleted ?? DateTime.MinValue)
                    .AddDays(it.IntervalDays) <= now,

            ConditionTrigger ct => ct.IsActive,

            FixedTrigger => true, // TODO: Implement cron evaluation

            WindowTrigger => true, // TODO: Implement window evaluation

            _ => false
        };
    }
}
