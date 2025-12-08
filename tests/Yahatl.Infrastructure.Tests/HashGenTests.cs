using Xunit;
using Yahatl.Infrastructure.Identity;
using Xunit.Abstractions;

namespace Yahatl.Infrastructure.Tests;

public class HashGenTests
{
    private readonly ITestOutputHelper _output;

    public HashGenTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public void GenerateHash()
    {
        var hasher = new PasswordHasher();
        var hash = hasher.HashPassword("password");
        _output.WriteLine($"HASH:{hash}");
        Assert.True(true);
    }
}
