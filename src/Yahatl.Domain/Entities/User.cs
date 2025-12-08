using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Yahatl.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public required string Email { get; set; }

    [JsonIgnore]
    public required string PasswordHash { get; set; }

    /// <summary>
    /// User's IANA timezone (e.g., "Australia/Sydney").
    /// Used for trigger and blocker evaluation.
    /// </summary>
    [MaxLength(100)]
    public string Timezone { get; set; } = "UTC";

    /// <summary>
    /// Expo Push Token for mobile notifications.
    /// Registered by the mobile app.
    /// </summary>
    [MaxLength(500)]
    public string? ExpoPushToken { get; set; }

    public Guid HouseholdId { get; set; }

    public Household? Household { get; set; }
}

