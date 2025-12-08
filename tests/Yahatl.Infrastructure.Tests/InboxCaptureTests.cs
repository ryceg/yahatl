using Xunit;
using Yahatl.Domain.Entities;

namespace Yahatl.Infrastructure.Tests;

public class InboxCaptureTests
{
    // ==================== NOTE INBOX STATE TESTS ====================

    [Fact]
    public void NewNote_IsInbox_DefaultsFalse()
    {
        // Arrange & Act
        var note = new Note
        {
            Title = "Test Note"
        };

        // Assert
        Assert.False(note.IsInbox);
        Assert.False(note.NeedsDetail);
    }

    [Fact]
    public void CapturedNote_HasIsInboxTrue()
    {
        // Arrange & Act - Simulating quick capture
        var note = new Note
        {
            Title = "Quick thought",
            IsInbox = true,
            NeedsDetail = false
        };

        // Assert
        Assert.True(note.IsInbox);
        Assert.False(note.NeedsDetail);
    }

    [Fact]
    public void ProcessedNote_HasIsInboxFalse()
    {
        // Arrange - Note was captured
        var note = new Note
        {
            Title = "Quick thought",
            IsInbox = true
        };

        // Act - Process the note
        note.IsInbox = false;
        note.TemplateType = TemplateType.Project;

        // Assert
        Assert.False(note.IsInbox);
    }

    [Fact]
    public void ProcessedNote_CanHaveNeedsDetail()
    {
        // Arrange - Note was captured
        var note = new Note
        {
            Title = "Quick thought",
            IsInbox = true,
            NeedsDetail = false
        };

        // Act - Process but mark as needing detail
        note.IsInbox = false;
        note.NeedsDetail = true;

        // Assert
        Assert.False(note.IsInbox);
        Assert.True(note.NeedsDetail);
    }

    // ==================== INBOX VS NEEDS DETAIL SEPARATION TESTS ====================

    [Fact]
    public void InboxAndNeedsDetail_AreSeparateConcepts()
    {
        // Arrange
        var inboxNote = new Note
        {
            Title = "Inbox item",
            IsInbox = true,
            NeedsDetail = false
        };

        var needsDetailNote = new Note
        {
            Title = "Needs enrichment",
            IsInbox = false,
            NeedsDetail = true
        };

        var processedNote = new Note
        {
            Title = "Complete note",
            IsInbox = false,
            NeedsDetail = false
        };

        // Assert - All combinations are valid
        Assert.True(inboxNote.IsInbox);
        Assert.False(inboxNote.NeedsDetail);

        Assert.False(needsDetailNote.IsInbox);
        Assert.True(needsDetailNote.NeedsDetail);

        Assert.False(processedNote.IsInbox);
        Assert.False(processedNote.NeedsDetail);
    }

    [Fact]
    public void Note_CanHaveBothFlags_ButNotTypical()
    {
        // This state is technically possible but represents an edge case
        var note = new Note
        {
            Title = "Edge case",
            IsInbox = true,
            NeedsDetail = true
        };

        // Assert - Both flags can be set
        Assert.True(note.IsInbox);
        Assert.True(note.NeedsDetail);
    }

    // ==================== TEMPLATE TYPE TESTS ====================

    [Fact]
    public void CapturedNote_HasNoTemplate()
    {
        // Arrange & Act - Quick capture should have no template
        var note = new Note
        {
            Title = "Quick thought",
            IsInbox = true
        };

        // Assert
        Assert.Equal(TemplateType.None, note.TemplateType);
    }

    [Fact]
    public void ProcessedNote_CanHaveTemplate()
    {
        // Arrange - Captured note
        var note = new Note
        {
            Title = "Gift idea for Claire",
            IsInbox = true,
            TemplateType = TemplateType.None
        };

        // Act - Process with template
        note.IsInbox = false;
        note.TemplateType = TemplateType.GiftIdea;

        // Assert
        Assert.False(note.IsInbox);
        Assert.Equal(TemplateType.GiftIdea, note.TemplateType);
    }
}
