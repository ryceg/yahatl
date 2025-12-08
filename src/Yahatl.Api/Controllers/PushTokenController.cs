using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Yahatl.Domain.Services;
using Yahatl.Infrastructure.Data;

namespace Yahatl.Api.Controllers;

/// <summary>
/// Controller for managing push notification tokens.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PushTokenController : ControllerBase
{
    private readonly YahatlDbContext _dbContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<PushTokenController> _logger;

    public PushTokenController(
        YahatlDbContext dbContext,
        ICurrentUserService currentUserService,
        ILogger<PushTokenController> logger)
    {
        _dbContext = dbContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Register an Expo push token for the current user.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> RegisterPushToken([FromBody] RegisterPushTokenRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        user.ExpoPushToken = request.PushToken;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Push token registered for user {UserId}", userId);
        return Ok(new { message = "Push token registered successfully" });
    }

    /// <summary>
    /// Unregister the push token for the current user.
    /// </summary>
    [HttpDelete("unregister")]
    public async Task<IActionResult> UnregisterPushToken()
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            return Unauthorized();
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        user.ExpoPushToken = null;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Push token unregistered for user {UserId}", userId);
        return Ok(new { message = "Push token unregistered successfully" });
    }

    /// <summary>
    /// Update the user's timezone.
    /// </summary>
    [HttpPut("timezone")]
    public async Task<IActionResult> UpdateTimezone([FromBody] UpdateTimezoneRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId == null)
        {
            return Unauthorized();
        }

        // Validate timezone
        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(request.Timezone);
        }
        catch (TimeZoneNotFoundException)
        {
            return BadRequest($"Invalid timezone: {request.Timezone}");
        }

        var user = await _dbContext.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        user.Timezone = request.Timezone;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Timezone updated for user {UserId}: {Timezone}", userId, request.Timezone);
        return Ok(new { message = "Timezone updated successfully" });
    }
}

/// <summary>
/// Request model for registering a push token.
/// </summary>
public class RegisterPushTokenRequest
{
    /// <summary>
    /// The Expo push token from the mobile app.
    /// </summary>
    public required string PushToken { get; set; }
}

/// <summary>
/// Request model for updating timezone.
/// </summary>
public class UpdateTimezoneRequest
{
    /// <summary>
    /// IANA timezone identifier (e.g., "Australia/Sydney").
    /// </summary>
    public required string Timezone { get; set; }
}
