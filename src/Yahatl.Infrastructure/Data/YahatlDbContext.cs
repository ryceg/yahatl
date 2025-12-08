using Microsoft.EntityFrameworkCore;
using Yahatl.Domain.Entities;
using Yahatl.Domain.Services;

namespace Yahatl.Infrastructure.Data;

public class YahatlDbContext(DbContextOptions<YahatlDbContext> options, ICurrentUserService currentUserService) : DbContext(options)
{
    private readonly ICurrentUserService _currentUserService = currentUserService;

    // Core entities
    public DbSet<User> Users { get; set; }
    public DbSet<Household> Households { get; set; }
    public DbSet<Note> Notes { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<NoteLink> NoteLinks { get; set; }

    // Behaviours (TPH inheritance)
    public DbSet<Behaviour> Behaviours { get; set; }
    public DbSet<TaskBehaviour> TaskBehaviours { get; set; }
    public DbSet<HabitBehaviour> HabitBehaviours { get; set; }
    public DbSet<ChoreBehaviour> ChoreBehaviours { get; set; }
    public DbSet<ReminderBehaviour> ReminderBehaviours { get; set; }

    // Triggers (TPH inheritance)
    public DbSet<Trigger> Triggers { get; set; }
    public DbSet<FixedTrigger> FixedTriggers { get; set; }
    public DbSet<IntervalTrigger> IntervalTriggers { get; set; }
    public DbSet<WindowTrigger> WindowTriggers { get; set; }
    public DbSet<ConditionTrigger> ConditionTriggers { get; set; }

    // Blockers (TPH inheritance)
    public DbSet<Blocker> Blockers { get; set; }
    public DbSet<NoteBlocker> NoteBlockers { get; set; }
    public DbSet<PersonBlocker> PersonBlockers { get; set; }
    public DbSet<TimeBlocker> TimeBlockers { get; set; }
    public DbSet<ConditionBlocker> ConditionBlockers { get; set; }
    public DbSet<UntilDateBlocker> UntilDateBlockers { get; set; }
    public DbSet<FreetextBlocker> FreetextBlockers { get; set; }

    // Planner
    public DbSet<DailyPlanItem> DailyPlanItems { get; set; }

    // Pomodoro
    public DbSet<PomodoroSession> PomodoroSessions { get; set; }

    public Guid? CurrentHouseholdId => _currentUserService.HouseholdId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==================== USER ====================
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.Household)
            .WithMany(h => h.Users)
            .HasForeignKey(u => u.HouseholdId)
            .OnDelete(DeleteBehavior.Restrict);

        // User query filter for tenant isolation
        modelBuilder.Entity<User>().HasQueryFilter(u => CurrentHouseholdId == null || u.HouseholdId == CurrentHouseholdId);

        // ==================== NOTE ====================
        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasIndex(n => n.HouseholdId);
            entity.HasIndex(n => n.OwnerId);
            entity.HasIndex(n => n.TemplateType);
            entity.HasIndex(n => new { n.HouseholdId, n.IsArchived });

            entity.HasOne(n => n.Owner)
                .WithMany()
                .HasForeignKey(n => n.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(n => n.Assignee)
                .WithMany()
                .HasForeignKey(n => n.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(n => n.Household)
                .WithMany()
                .HasForeignKey(n => n.HouseholdId)
                .OnDelete(DeleteBehavior.Restrict);

            // Many-to-many with Tags
            entity.HasMany(n => n.Tags)
                .WithMany(t => t.Notes)
                .UsingEntity("NoteTags");

            // Query filter for tenant isolation (exclude archived by default)
            entity.HasQueryFilter(n =>
                (CurrentHouseholdId == null || n.HouseholdId == CurrentHouseholdId) &&
                !n.IsArchived);
        });

        // ==================== TAG ====================
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasIndex(t => new { t.HouseholdId, t.Name }).IsUnique();

            entity.HasOne(t => t.Household)
                .WithMany()
                .HasForeignKey(t => t.HouseholdId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(t => CurrentHouseholdId == null || t.HouseholdId == CurrentHouseholdId);
        });

        // ==================== NOTE LINK ====================
        modelBuilder.Entity<NoteLink>(entity =>
        {
            entity.HasIndex(l => new { l.SourceNoteId, l.TargetNoteId }).IsUnique();

            entity.HasOne(l => l.SourceNote)
                .WithMany(n => n.LinksFrom)
                .HasForeignKey(l => l.SourceNoteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.TargetNote)
                .WithMany(n => n.LinksTo)
                .HasForeignKey(l => l.TargetNoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== BEHAVIOURS (TPH) ====================
        modelBuilder.Entity<Behaviour>(entity =>
        {
            entity.HasIndex(b => b.NoteId);

            entity.HasDiscriminator<string>("BehaviourType")
                .HasValue<TaskBehaviour>("Task")
                .HasValue<HabitBehaviour>("Habit")
                .HasValue<ChoreBehaviour>("Chore")
                .HasValue<ReminderBehaviour>("Reminder");

            entity.HasOne(b => b.Note)
                .WithMany(n => n.Behaviours)
                .HasForeignKey(b => b.NoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== TRIGGERS (TPH) ====================
        modelBuilder.Entity<Trigger>(entity =>
        {
            entity.HasIndex(t => t.NoteId);

            entity.HasDiscriminator<string>("TriggerType")
                .HasValue<FixedTrigger>("Fixed")
                .HasValue<IntervalTrigger>("Interval")
                .HasValue<WindowTrigger>("Window")
                .HasValue<ConditionTrigger>("Condition");

            entity.HasOne(t => t.Note)
                .WithMany(n => n.Triggers)
                .HasForeignKey(t => t.NoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== BLOCKERS (TPH) ====================
        modelBuilder.Entity<Blocker>(entity =>
        {
            entity.HasIndex(b => b.NoteId);
            entity.HasIndex(b => b.IsActive);

            entity.HasDiscriminator<string>("BlockerType")
                .HasValue<NoteBlocker>("Note")
                .HasValue<PersonBlocker>("Person")
                .HasValue<TimeBlocker>("Time")
                .HasValue<ConditionBlocker>("Condition")
                .HasValue<UntilDateBlocker>("UntilDate")
                .HasValue<FreetextBlocker>("Freetext");

            entity.HasOne(b => b.Note)
                .WithMany(n => n.Blockers)
                .HasForeignKey(b => b.NoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // NoteBlocker additional relationship
        modelBuilder.Entity<NoteBlocker>()
            .HasOne(nb => nb.TargetNote)
            .WithMany()
            .HasForeignKey(nb => nb.TargetNoteId)
            .OnDelete(DeleteBehavior.Restrict);

        // ==================== DAILY PLAN ====================
        modelBuilder.Entity<DailyPlanItem>(entity =>
        {
            entity.HasIndex(p => new { p.UserId, p.PlanDate, p.NoteId }).IsUnique();
            entity.HasIndex(p => new { p.UserId, p.PlanDate, p.Order });

            entity.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Note)
                .WithMany()
                .HasForeignKey(p => p.NoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== POMODORO ====================
        modelBuilder.Entity<PomodoroSession>(entity =>
        {
            entity.HasIndex(p => new { p.UserId, p.Status });
            entity.HasIndex(p => p.StartedAt);

            entity.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.Note)
                .WithMany()
                .HasForeignKey(p => p.NoteId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ==================== SEED DATA ====================
        var householdId = Guid.Parse("d28888e9-2ba9-473a-a40f-e38cb54f9b35");
        var household = new Household
        {
            Id = householdId,
            Name = "Our Home"
        };

        var passwordHash = "AQAAAAIAAYagAAAAEOaynXcSl4C/4jypc/XkeGw8JJ7u/DSCjmYP3CdZLshVLkItVZSwjHZnBPhASwszaw=="; // password

        var user1 = new User
        {
            Id = Guid.Parse("98708c3d-6b74-4b8b-8a8c-6e695f2d1e11"),
            Email = "rhys@example.com",
            PasswordHash = passwordHash,
            HouseholdId = householdId
        };

        var user2 = new User
        {
            Id = Guid.Parse("e5708c3d-6b74-4b8b-8a8c-6e695f2d1e22"),
            Email = "claire@example.com",
            PasswordHash = passwordHash,
            HouseholdId = householdId
        };

        modelBuilder.Entity<Household>().HasData(household);
        modelBuilder.Entity<User>().HasData(user1, user2);
    }
}
