using System.ComponentModel.DataAnnotations;

namespace Yahatl.Domain.Entities;

/// <summary>
/// The fundamental unit of the YAHATL system. Everything is a Note.
/// Notes can have optional templates for structure and behaviours for functionality.
/// </summary>
public class Note
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(500)]
    public required string Title { get; set; }

    /// <summary>
    /// Markdown content for the note body.
    /// For template types, this may contain JSON-structured data.
    /// </summary>
    public string? Body { get; set; }

    /// <summary>
    /// Template type for structured notes.
    /// None for plain notes.
    /// </summary>
    public TemplateType TemplateType { get; set; } = TemplateType.None;

    /// <summary>
    /// User who owns this note.
    /// </summary>
    public Guid OwnerId { get; set; }

    /// <summary>
    /// Optional user assigned to action this note (for tasks/chores).
    /// </summary>
    public Guid? AssigneeId { get; set; }

    /// <summary>
    /// Household this note belongs to (for tenant isolation).
    /// </summary>
    public Guid HouseholdId { get; set; }

    /// <summary>
    /// Soft delete flag. Archived notes are hidden but not removed.
    /// </summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// Quick captured items awaiting triage/categorization.
    /// </summary>
    public bool IsInbox { get; set; }

    /// <summary>
    /// Flag for notes that have been categorized but need more detail/enrichment.
    /// </summary>
    public bool NeedsDetail { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? Owner { get; set; }
    public User? Assignee { get; set; }
    public Household? Household { get; set; }
    public ICollection<Tag> Tags { get; set; } = [];
    public ICollection<NoteLink> LinksFrom { get; set; } = [];
    public ICollection<NoteLink> LinksTo { get; set; } = [];
    public ICollection<Behaviour> Behaviours { get; set; } = [];
    public ICollection<Trigger> Triggers { get; set; } = [];
    public ICollection<Blocker> Blockers { get; set; } = [];
}
