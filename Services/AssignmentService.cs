using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.Models;

namespace PromoterSelection.API.Services;

public interface IAssignmentService
{
    Task<(int assigned, int unassigned)> RunAutoAssignment();
}

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _db;

    public AssignmentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(int assigned, int unassigned)> RunAutoAssignment()
    {
        // Remove existing assignments
        _db.Assignments.RemoveRange(_db.Assignments);
        await _db.SaveChangesAsync();

        var supervisors = await _db.Users
            .Where(u => u.Role == UserRole.Supervisor)
            .ToListAsync();

        // Track remaining capacity per supervisor
        var capacity = supervisors.ToDictionary(s => s.Id, s => s.MaxStudents ?? 0);

        // Get all students sorted by GPA descending (higher GPA = higher priority)
        var students = await _db.Users
            .Where(u => u.Role == UserRole.Student)
            .Include(u => u.Preferences)
            .Include(u => u.Team)
            .OrderByDescending(u => u.GPA ?? 0)
            .ToListAsync();

        // Identify teams and their leaders (highest GPA in team)
        var teams = await _db.Teams
            .Include(t => t.Members)
            .ToListAsync();

        var assignedStudentIds = new HashSet<int>();
        int assignedCount = 0;

        // Process team leaders first (they choose for whole team)
        foreach (var team in teams)
        {
            if (!team.Members.Any()) continue;

            // Leader = member with highest GPA
            var leader = team.Members.OrderByDescending(m => m.GPA ?? 0).First();

            // Get leader's preferences
            var leaderPrefs = await _db.Preferences
                .Where(p => p.StudentId == leader.Id)
                .OrderBy(p => p.Priority)
                .ToListAsync();

            int? assignedSupervisorId = null;
            foreach (var pref in leaderPrefs)
            {
                int teamSize = team.Members.Count;
                if (capacity.TryGetValue(pref.SupervisorId, out int cap) && cap >= teamSize)
                {
                    assignedSupervisorId = pref.SupervisorId;
                    capacity[pref.SupervisorId] -= teamSize;
                    break;
                }
            }

            if (assignedSupervisorId.HasValue)
            {
                // Assign all team members
                foreach (var member in team.Members)
                {
                    _db.Assignments.Add(new Assignment
                    {
                        StudentId = member.Id,
                        SupervisorId = assignedSupervisorId.Value,
                        AssignedAt = DateTime.UtcNow,
                        IsTeamAssignment = true
                    });
                    assignedStudentIds.Add(member.Id);
                    assignedCount++;
                }
                team.AssignedSupervisorId = assignedSupervisorId;
            }
        }

        // Process individual students (not in teams), sorted by GPA desc
        var individualStudents = students
            .Where(s => !s.TeamId.HasValue && !assignedStudentIds.Contains(s.Id))
            .ToList();

        int unassignedCount = 0;

        foreach (var student in individualStudents)
        {
            var prefs = student.Preferences.OrderBy(p => p.Priority).ToList();
            bool wasAssigned = false;

            foreach (var pref in prefs)
            {
                if (capacity.TryGetValue(pref.SupervisorId, out int cap) && cap > 0)
                {
                    _db.Assignments.Add(new Assignment
                    {
                        StudentId = student.Id,
                        SupervisorId = pref.SupervisorId,
                        AssignedAt = DateTime.UtcNow,
                        IsTeamAssignment = false
                    });
                    capacity[pref.SupervisorId]--;
                    assignedCount++;
                    wasAssigned = true;
                    break;
                }
            }

            if (!wasAssigned)
            {
                // Try any supervisor with available slot
                var fallback = capacity.FirstOrDefault(kvp => kvp.Value > 0);
                if (fallback.Key != 0)
                {
                    _db.Assignments.Add(new Assignment
                    {
                        StudentId = student.Id,
                        SupervisorId = fallback.Key,
                        AssignedAt = DateTime.UtcNow,
                        IsTeamAssignment = false
                    });
                    capacity[fallback.Key]--;
                    assignedCount++;
                }
                else
                {
                    unassignedCount++;
                }
            }
        }

        await _db.SaveChangesAsync();
        return (assignedCount, unassignedCount);
    }
}
