namespace PromoterSelection.API.Models;

public enum UserRole { Admin, Student, Supervisor }

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // Student-specific
    public string? AlbumNumber { get; set; }
    public double? GPA { get; set; }
    public bool IsGPAConfirmed { get; set; }
    public int? TeamId { get; set; }
    public Team? Team { get; set; }

    // Supervisor-specific
    public string? Title { get; set; }
    public int? MaxStudents { get; set; }

    public List<Preference> Preferences { get; set; } = new();
    public Assignment? Assignment { get; set; }
    public List<ThesisTopic> ThesisTopics { get; set; } = new();
}
