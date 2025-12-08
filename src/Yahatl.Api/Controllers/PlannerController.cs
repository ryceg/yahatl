using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yahatl.Domain.Services;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class PlannerController(IDayGeneratorService dayGeneratorService) : ControllerBase
{
    /// <summary>
    /// Get today's committed plan - items the user has pulled in to work on today.
    /// </summary>
    [HttpGet("today")]
    public async Task<ActionResult<List<PlanItem>>> GetTodaysPlan()
    {
        var plan = await dayGeneratorService.GetTodaysPlanAsync();
        return Ok(plan);
    }

    /// <summary>
    /// Get candidate items grouped by urgency section.
    /// Candidates are actionable items not yet in today's plan.
    /// </summary>
    [HttpGet("candidates")]
    public async Task<ActionResult<CandidatesResult>> GetCandidates()
    {
        var candidates = await dayGeneratorService.GetCandidatesAsync();
        return Ok(candidates);
    }

    /// <summary>
    /// Add an item to today's plan.
    /// </summary>
    [HttpPost("today/{noteId:guid}")]
    public async Task<IActionResult> AddToPlan(Guid noteId)
    {
        await dayGeneratorService.AddToPlanAsync(noteId);
        return Ok();
    }

    /// <summary>
    /// Remove an item from today's plan.
    /// </summary>
    [HttpDelete("today/{noteId:guid}")]
    public async Task<IActionResult> RemoveFromPlan(Guid noteId)
    {
        await dayGeneratorService.RemoveFromPlanAsync(noteId);
        return NoContent();
    }

    /// <summary>
    /// Reorder items in today's plan.
    /// </summary>
    [HttpPut("today/reorder")]
    public async Task<IActionResult> ReorderPlan([FromBody] List<Guid> noteIds)
    {
        await dayGeneratorService.ReorderPlanAsync(noteIds);
        return Ok();
    }

    /// <summary>
    /// Roll incomplete items from today to tomorrow.
    /// </summary>
    [HttpPost("rollover")]
    public async Task<ActionResult<RolloverResult>> RolloverItems()
    {
        var result = await dayGeneratorService.RolloverIncompleteAsync();
        return Ok(result);
    }
}
