using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Api.Models;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class SearchController(YahatlDbContext dbContext) : ControllerBase
{
    /// <summary>
    /// Search notes by title, body, and tags.
    /// Supports filtering by template type.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<SearchResultItem>>> Search(
        [FromQuery] string q,
        [FromQuery] Domain.Entities.TemplateType? templateType = null,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest("Query parameter 'q' is required");
        }

        var searchLower = q.ToLower();

        var query = dbContext.Notes
            .Include(n => n.Tags)
            .Where(n =>
                n.Title.ToLower().Contains(searchLower) ||
                (n.Body != null && n.Body.ToLower().Contains(searchLower)) ||
                n.Tags.Any(t => t.Name.ToLower().Contains(searchLower)));

        if (templateType.HasValue)
        {
            query = query.Where(n => n.TemplateType == templateType.Value);
        }

        var totalCount = await query.CountAsync();

        var results = await query
            .OrderByDescending(n =>
                // Rank by relevance - title matches first
                n.Title.ToLower().Contains(searchLower) ? 2 :
                n.Tags.Any(t => t.Name.ToLower().Contains(searchLower)) ? 1 : 0)
            .ThenByDescending(n => n.UpdatedAt)
            .Skip(offset)
            .Take(limit)
            .Select(n => new SearchResultItem(
                n.Id,
                n.Title,
                n.Body != null ? (n.Body.Length > 200 ? n.Body.Substring(0, 200) + "..." : n.Body) : null,
                n.TemplateType,
                n.UpdatedAt,
                n.Tags.Select(t => t.Name).ToList(),
                CalculateRelevance(n.Title, n.Body, searchLower)
            ))
            .ToListAsync();

        return Ok(new PaginatedResponse<SearchResultItem>(results, totalCount, limit, offset));
    }

    private static int CalculateRelevance(string title, string? body, string searchTerm)
    {
        var score = 0;

        if (title.ToLower().Contains(searchTerm))
            score += 10;

        if (body != null && body.ToLower().Contains(searchTerm))
            score += 5;

        return score;
    }
}

public record SearchResultItem(
    Guid Id,
    string Title,
    string? BodySnippet,
    Domain.Entities.TemplateType TemplateType,
    DateTime UpdatedAt,
    List<string> Tags,
    int Relevance
);
