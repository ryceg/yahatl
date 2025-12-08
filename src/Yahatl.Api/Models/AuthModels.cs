using System.ComponentModel.DataAnnotations;

namespace Yahatl.Api.Models;

public record LoginRequest(
    [Required] [EmailAddress] string Email,
    [Required] string Password
);

public record RegisterRequest(
    [Required] [EmailAddress] string Email,
    [Required] [MinLength(6)] string Password,
    [Required] string HouseholdName
);

public record AuthResponse(
    string Token,
    string RefreshToken // Not implementing full refresh flow yet, but placeholder
);
