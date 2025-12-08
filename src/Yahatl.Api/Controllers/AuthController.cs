using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Yahatl.Api.Models;
using Yahatl.Domain.Entities;
using Yahatl.Infrastructure.Data;
using Yahatl.Infrastructure.Identity;

namespace Yahatl.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController(
    YahatlDbContext dbContext,
    IPasswordHasher passwordHasher,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        // TODO: We need to bypass the Query Filter for login since CurrentHouseholdId is null
        // But how? With helper method or modifying DbContext to allow bypassing?
        // Actually, if CurrentHouseholdId is null, our filter allows 'true' if we set it up right.
        // Filter: u => CurrentHouseholdId == null || u.HouseholdId == CurrentHouseholdId
        // So global filter allows access if CurrentHouseholdId is not set.
        // CAUTION: This means unfiltered access if ICurrentUserService returns null.
        // We must ensure 'Authorize' attribute protects other endpoints, and Login explicitly checks credentials.

        var user = await dbContext.Users
            .Include(u => u.Household)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !passwordHasher.VerifyPassword(user.PasswordHash, request.Password))
        {
            return Unauthorized("Invalid credentials");
        }

        var token = GenerateJwtToken(user);
        return Ok(new AuthResponse(token, "refresh_token_placeholder"));
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        // Check if user exists
        if (await dbContext.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("User already exists");
        }

        var household = new Household { Name = request.HouseholdName };
        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordHasher.HashPassword(request.Password),
            Household = household
        };

        dbContext.Households.Add(household);
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(new AuthResponse(token, "refresh_token_placeholder"));
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("household_id", user.HouseholdId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
