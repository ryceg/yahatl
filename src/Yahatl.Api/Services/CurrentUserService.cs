using System.Security.Claims;
using Yahatl.Domain.Services;

namespace Yahatl.Api.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var userId = httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId != null ? Guid.Parse(userId) : null;
        }
    }

    public Guid? HouseholdId
    {
        get
        {
            var householdId = httpContextAccessor.HttpContext?.User?.FindFirstValue("household_id");
            return householdId != null ? Guid.Parse(householdId) : null;
        }
    }

    public string? Email => httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email);
}
