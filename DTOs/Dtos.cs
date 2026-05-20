namespace PromoterSelection.API.DTOs;

// Auth
public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, string Role, int UserId, string FullName);

// Users
public record CreateUserRequest(
    string Email, string Password, string FirstName, string LastName,
    string Role,
    string? AlbumNumber = null, double? GPA = null,
    string? Title = null, int? MaxStudents = null);

public record UpdateUserRequest(
    string? FirstName, string? LastName,
    string? Email, string? Password,
    double? GPA, bool? IsGPAConfirmed,
    string? Title, int? MaxStudents);

public record UserDto(
    int Id, string Email, string Role, string FirstName, string LastName,
    string? AlbumNumber, double? GPA, bool IsGPAConfirmed,
    int? TeamId, string? Title, int? MaxStudents,
    int AssignedStudentsCount);

// Teams
public record CreateTeamRequest(string Name);
public record UpdateTeamRequest(string Name);
public record AddMemberRequest(int StudentId);

public record TeamDto(
    int Id, string Name,
    List<TeamMemberDto> Members,
    int? AssignedSupervisorId,
    string? AssignedSupervisorName,
    int? LeaderId,
    string? LeaderName);

public record TeamMemberDto(int Id, string FullName, string AlbumNumber, double? GPA);

// Preferences
public record SetPreferencesRequest(List<PreferenceItemDto> Preferences);
public record PreferenceItemDto(int SupervisorId, int Priority);
public record PreferenceDto(int Id, int SupervisorId, string SupervisorName, string SupervisorTitle, int Priority, int AvailableSlots);

// Schedule
public record ScheduleDto(int Id, DateTime StartDate, DateTime EndDate, bool IsActive, bool IsOpen);
public record SetScheduleRequest(DateTime StartDate, DateTime EndDate, bool IsActive);

// Topics
public record CreateTopicRequest(string Title, string Description);
public record TopicDto(int Id, int SupervisorId, string SupervisorName, string Title, string Description, DateTime CreatedAt);

// Assignment
public record AssignmentDto(int Id, int StudentId, string StudentName, string AlbumNumber, int SupervisorId, string SupervisorName, DateTime AssignedAt, bool IsTeamAssignment);

// CSV Import
public record CsvStudentRow
{
    public string AlbumNumber { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public double GPA { get; set; }
}

// Reports
public record ReportStudentRow(string AlbumNumber, string StudentName, string SupervisorName, string SupervisorTitle);
public record ReportTeamRow(string TeamName, string LeaderName, string SupervisorName, List<string> Members);
public record ReportUnusedSlotRow(string SupervisorName, int TotalSlots, int UsedSlots, int UnusedSlots);

// Supervisor
public record ProcessDescriptionDto(string Description);