namespace PromoterSelection.API.Models;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<User> Members { get; set; } = new();
    public int? AssignedSupervisorId { get; set; }
}

public class Preference
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public int SupervisorId { get; set; }
    public User Supervisor { get; set; } = null!;
    public int Priority { get; set; } // 1, 2, 3
}

public class Assignment
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public User Student { get; set; } = null!;
    public int SupervisorId { get; set; }
    public User Supervisor { get; set; } = null!;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsTeamAssignment { get; set; }
}

public class Schedule
{
    public int Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class ThesisTopic
{
    public int Id { get; set; }
    public int SupervisorId { get; set; }
    public User Supervisor { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
