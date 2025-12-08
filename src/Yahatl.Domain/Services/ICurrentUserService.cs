namespace Yahatl.Domain.Services;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? HouseholdId { get; }
    string? Email { get; }
}
