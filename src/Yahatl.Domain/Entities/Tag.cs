using System.ComponentModel.DataAnnotations;

namespace Yahatl.Domain.Entities;

/// <summary>
/// Simple string tag for flexible note categorisation.
/// Tags are scoped to a household.
/// </summary>
public class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    /// <summary>
    /// Household this tag belongs to (for tenant isolation).
    /// </summary>
    public Guid HouseholdId { get; set; }

    // Navigation properties
    public Household? Household { get; set; }
    public ICollection<Note> Notes { get; set; } = [];
}
