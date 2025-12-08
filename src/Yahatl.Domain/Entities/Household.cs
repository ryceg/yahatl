using System.ComponentModel.DataAnnotations;

namespace Yahatl.Domain.Entities;

public class Household
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
}
