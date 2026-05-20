using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Services;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAssignmentService _assignmentService;
    private readonly IEmailService _emailService;

    public AssignmentsController(AppDbContext db, IAssignmentService assignmentService, IEmailService emailService)
    {
        _db = db;
        _assignmentService = assignmentService;
        _emailService = emailService;
    }

    [HttpPost("run")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RunAlgorithm()
    {
        // 1. Uruchomienie algorytmu
        var (assigned, unassigned) = await _assignmentService.RunAutoAssignment();

        // 2. Pobranie wyników przydziału wraz z danymi studentów, promotorów i zespołów
        var assignments = await _db.Assignments
            .Include(a => a.Student)
                .ThenInclude(s => s.Team)
            .Include(a => a.Supervisor)
            .ToListAsync();

        // 3. Wysyłka e-maili do każdego przydzielonego studenta
        foreach (var assignment in assignments)
        {
            var studentEmail = assignment.Student.Email;
            var supervisorName = $"{assignment.Supervisor.Title} {assignment.Supervisor.FirstName} {assignment.Supervisor.LastName}".Trim();

            var subject = "Wyniki przydziału promotora";
            var body = $"Witaj {assignment.Student.FirstName},\n\n" +
                       $"Proces wyborów dobiegł końca. Twój przydzielony promotor to:\n" +
                       $"Pan/Pani {supervisorName}.\n\n";

            // Dodatkowa informacja, jeśli student był w zespole
            if (assignment.IsTeamAssignment && assignment.Student.Team != null)
            {
                body += $"Przydział został dokonany w ramach Twojego zespołu: {assignment.Student.Team.Name}.\n\n";
            }

            body += "Pozdrawiamy,\nSystem Wyboru Promotorów";

            await _emailService.SendEmailAsync(studentEmail, subject, body);
        }

        return Ok(new
        {
            message = "Algorytm przydziału został zakończony pomyślnie. Powiadomienia e-mail zostały rozesłane.",
            assignedCount = assigned,
            unassignedCount = unassigned
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAssignments()
    {
        var assignments = await _db.Assignments
            .Include(a => a.Student)
            .Include(a => a.Supervisor)
            .ToListAsync();

        var result = assignments.Select(a => new AssignmentDto(
            a.Id,
            a.StudentId,
            $"{a.Student.FirstName} {a.Student.LastName}".Trim(),
            a.Student.AlbumNumber ?? "",
            a.SupervisorId,
            $"{a.Supervisor.Title} {a.Supervisor.FirstName} {a.Supervisor.LastName}".Trim(),
            a.AssignedAt,
            a.IsTeamAssignment
        )).ToList();

        return Ok(result);
    }
}