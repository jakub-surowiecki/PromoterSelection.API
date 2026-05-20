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
        // 1. Bezpieczne usunięcie starych przypisań
        var existingAssignments = await _db.Assignments.ToListAsync();
        _db.Assignments.RemoveRange(existingAssignments);

        // Zresetowanie powiązań zespołów
        var allTeams = await _db.Teams.ToListAsync();
        foreach (var t in allTeams) t.AssignedSupervisorId = null;

        await _db.SaveChangesAsync();

        // 2. Pobranie promotorów i śledzenie ich wolnych miejsc
        var supervisors = await _db.Users
            .Where(u => u.Role == UserRole.Supervisor)
            .ToListAsync();

        var capacity = supervisors.ToDictionary(s => s.Id, s => s.MaxStudents ?? 0);

        // 3. Pobranie wszystkich studentów z ich preferencjami (posortowani po ocenach)
        var students = await _db.Users
            .Where(u => u.Role == UserRole.Student)
            .Include(u => u.Preferences)
            .OrderByDescending(u => u.GPA ?? 0)
            .ToListAsync();

        // 4. Identyfikacja zespołów
        var teams = await _db.Teams
            .Include(t => t.Members)
            .ToListAsync();

        var assignedStudentIds = new HashSet<int>();
        int assignedCount = 0;
        int unassignedCount = 0;

        // --- ETAP 1: Przetwarzanie zespołów ---
        foreach (var team in teams)
        {
            if (!team.Members.Any()) continue;

            var leader = team.Members.OrderByDescending(m => m.GPA ?? 0).First();
            var leaderStudent = students.FirstOrDefault(s => s.Id == leader.Id);
            var leaderPrefs = leaderStudent?.Preferences.OrderBy(p => p.Priority).ToList() ?? new List<Preference>();

            int? assignedSupervisorId = null;
            int teamSize = team.Members.Count;

            // Przejście przez wybory
            foreach (var pref in leaderPrefs)
            {
                if (capacity.TryGetValue(pref.SupervisorId, out int cap) && cap >= teamSize)
                {
                    assignedSupervisorId = pref.SupervisorId;
                    capacity[pref.SupervisorId] -= teamSize;
                    break;
                }
            }

            if (assignedSupervisorId.HasValue)
            {
                // Zespół dostał promotora z preferencji
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
            else
            {
                // FALLBACK DLA ZESPOŁU: Szukamy jakiegokolwiek promotora, który zmieści całą grupę
                var fallback = capacity.FirstOrDefault(kvp => kvp.Value >= teamSize);
                if (fallback.Key != 0)
                {
                    foreach (var member in team.Members)
                    {
                        _db.Assignments.Add(new Assignment
                        {
                            StudentId = member.Id,
                            SupervisorId = fallback.Key,
                            AssignedAt = DateTime.UtcNow,
                            IsTeamAssignment = true
                        });
                        assignedStudentIds.Add(member.Id);
                        assignedCount++;
                    }
                    team.AssignedSupervisorId = fallback.Key;
                    capacity[fallback.Key] -= teamSize;
                }
                else
                {
                    // Całkowity brak miejsc na uczelni dla tej drużyny!
                    unassignedCount += teamSize;
                }
            }
        }

        // --- ETAP 2: Przetwarzanie studentów bez zespołu ---
        var individualStudents = students
            .Where(s => s.TeamId == null && !assignedStudentIds.Contains(s.Id))
            .ToList();

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
                // FALLBACK DLA STUDENTA
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