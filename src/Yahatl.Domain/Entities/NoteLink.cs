namespace Yahatl.Domain.Entities;

/// <summary>
/// Bidirectional link between two notes.
/// Used for connecting related items (e.g., Gift Idea → Person, Shopping Item → Recipe).
/// </summary>
public class NoteLink
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The note where the link originates.
    /// </summary>
    public Guid SourceNoteId { get; set; }

    /// <summary>
    /// The note being linked to.
    /// </summary>
    public Guid TargetNoteId { get; set; }

    // Navigation properties
    public Note? SourceNote { get; set; }
    public Note? TargetNote { get; set; }
}
