using Microsoft.AspNetCore.Identity;
using Yahatl.Domain.Entities;

namespace Yahatl.Infrastructure.Identity;

public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    // We use a dummy user object since the hasher requires it, but for our simple use case
    // we don't vary the algorithm based on the user instance in this specific implementation
    // (though Identity supports it).
    private readonly User _dummyUser = new User
    {
        Id = Guid.Empty,
        Email = "dummy@example.com",
        PasswordHash = "",
        HouseholdId = Guid.Empty
    };

    public string HashPassword(string password)
    {
        return _hasher.HashPassword(_dummyUser, password);
    }

    public bool VerifyPassword(string hashedPassword, string providedPassword)
    {
        var result = _hasher.VerifyHashedPassword(_dummyUser, hashedPassword, providedPassword);
        return result != PasswordVerificationResult.Failed;
    }
}
