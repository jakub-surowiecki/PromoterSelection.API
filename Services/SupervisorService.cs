using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;

namespace PromoterSelection.API.Services;

public interface ISupervisorService
{
    Task<IEnumerable<AssignmentDto>> GetSupervisorAssignmentsAsync(int supervisorId);
    Task<ProcessDescriptionDto> GetProcessDescriptionAsync();
}

public class SupervisorService : ISupervisorService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public SupervisorService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<IEnumerable<AssignmentDto>> GetSupervisorAssignmentsAsync(int supervisorId)
    {
        var assignments = await _context.Assignments
            .AsNoTracking()
            .Include(a => a.Student)
            .Include(a => a.Supervisor)
            .Where(a => a.SupervisorId == supervisorId)
            .ToListAsync();

        return assignments.Select(a => new AssignmentDto(
            a.Id,
            a.StudentId,
            $"{a.Student.FirstName} {a.Student.LastName}".Trim(),
            a.Student.AlbumNumber ?? string.Empty,
            a.SupervisorId,
            $"{a.Supervisor.Title} {a.Supervisor.FirstName} {a.Supervisor.LastName}".Trim(),
            a.AssignedAt,
            a.IsTeamAssignment
        )).ToList();
    }

    public async Task<ProcessDescriptionDto> GetProcessDescriptionAsync()
    {
        var description = _configuration["ElectionProcessDescription"] ?? string.Empty;
        return new ProcessDescriptionDto(description);
    }
}