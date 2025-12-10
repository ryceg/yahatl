using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class DashboardController(YahatlDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Get dashboard summary stats.
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummary>> GetSummary()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var tomorrow = today.AddDays(1);

        var overdueCount = await dbContext.TaskBehaviours
            .Where(t => t.Status == TaskExecutionStatus.Pending && t.DueDate.HasValue && t.DueDate.Value < today)
            .CountAsync();

        var dueTodayCount = await dbContext.TaskBehaviours
            .Where(t => t.Status == TaskExecutionStatus.Pending &&
                   t.DueDate.HasValue &&
                   t.DueDate.Value >= today &&
                   t.DueDate.Value < tomorrow)
            .CountAsync();

        // Habits with streaks at risk (not completed yesterday)
        var yesterday = today.AddDays(-1);
        var streaksAtRisk = await dbContext.HabitBehaviours
            .Where(h => h.CurrentStreak > 0)
            .CountAsync(); // Simplified - would need proper evaluation

        var blockedCount = await dbContext.Notes
            .Where(n => n.Blockers.Any(b => b.IsActive))
            .CountAsync();

        var inboxCount = await dbContext.Notes
            .Where(n => n.NeedsDetail)
            .CountAsync();

        return Ok(new DashboardSummary(
            overdueCount,
            dueTodayCount,
            streaksAtRisk,
            blockedCount,
            inboxCount
        ));
    }

    /// <summary>
    /// Get upcoming items for the next 7 days.
    /// </summary>
    [HttpGet("upcoming")]
    public async Task<ActionResult<List<UpcomingItem>>> GetUpcoming()
    {
        var today = DateTime.UtcNow.Date;
        var nextWeek = today.AddDays(7);

        var taskItems = await dbContext.TaskBehaviours
            .Include(t => t.Note)
            .Where(t => t.Status == TaskExecutionStatus.Pending &&
                   t.DueDate.HasValue &&
                   t.DueDate.Value >= today &&
                   t.DueDate.Value < nextWeek)
            .OrderBy(t => t.DueDate)
            .Select(t => new UpcomingItem(
                t.NoteId,
                t.Note!.Title,
                t.DueDate!.Value,
                "Task",
                t.Priority.ToString()
            ))
            .ToListAsync();

        var choreItems = await dbContext.ChoreBehaviours
            .Include(c => c.Note)
            .Where(c => c.NextDue >= today && c.NextDue < nextWeek)
            .OrderBy(c => c.NextDue)
            .Select(c => new UpcomingItem(
                c.NoteId,
                c.Note!.Title,
                c.NextDue,
                "Chore",
                "Normal"
            ))
            .ToListAsync();

        var allItems = taskItems.Concat(choreItems)
            .OrderBy(i => i.DueDate)
            .ToList();

        return Ok(allItems);
    }

    /// <summary>
    /// Get items with active Person or Freetext blockers.
    /// </summary>
    [HttpGet("waiting")]
    public async Task<ActionResult<List<WaitingItem>>> GetWaiting()
    {
        var personBlockedItems = await dbContext.PersonBlockers
            .Include(b => b.Note)
            .Where(b => b.IsActive)
            .Select(b => new WaitingItem(
                b.NoteId,
                b.Note!.Title,
                "Person",
                b.Reason ?? "Waiting on person",
                b.PersonNoteId
            ))
            .ToListAsync();

        var freetextBlockedItems = await dbContext.FreetextBlockers
            .Include(b => b.Note)
            .Where(b => b.IsActive)
            .Select(b => new WaitingItem(
                b.NoteId,
                b.Note!.Title,
                "Freetext",
                b.Description,
                null
            ))
            .ToListAsync();

        var allWaiting = personBlockedItems.Concat(freetextBlockedItems).ToList();

        return Ok(allWaiting);
    }

    /// <summary>
    /// Get habits with streak info, sorted by at-risk.
    /// </summary>
    [HttpGet("streaks")]
    public async Task<ActionResult<List<StreakItem>>> GetStreaks()
    {
        var habits = await dbContext.HabitBehaviours
            .Include(h => h.Note)
            .OrderByDescending(h => h.CurrentStreak)
            .Select(h => new StreakItem(
                h.NoteId,
                h.Note!.Title,
                h.FrequencyGoal,
                h.CurrentStreak,
                h.LongestStreak,
                h.CurrentStreak > 0 // Simplified at-risk check
            ))
            .ToListAsync();

        return Ok(habits);
    }
}

public record DashboardSummary(
    int OverdueCount,
    int DueTodayCount,
    int StreaksAtRisk,
    int BlockedCount,
    int InboxCount
);

public record UpcomingItem(
    Guid NoteId,
    string Title,
    DateTime DueDate,
    string Type,
    string Priority
);

public record WaitingItem(
    Guid NoteId,
    string Title,
    string BlockerType,
    string Reason,
    Guid? PersonNoteId
);

public record StreakItem(
    Guid NoteId,
    string Title,
    string FrequencyGoal,
    int CurrentStreak,
    int LongestStreak,
    bool AtRisk
);
