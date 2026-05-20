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

    public AssignmentsController(AppDbContext db, IAssignmentService assignmentService)
    {
        _db = db;
        _assignmentService = assignmentService;
    }

    [HttpPost("run")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RunAlgorithm()
    {
        // Wywołujemy prawdziwy algorytm z Twojego serwisu
        var (assigned, unassigned) = await _assignmentService.RunAutoAssignment();

        // Zwracamy pełne statystyki
        return Ok(new
        {
            message = "Algorytm przydziału został zakończony pomyślnie.",
            assignedCount = assigned,
            unassignedCount = unassigned
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAssignments()
    {
        // Najpierw pobieramy dane do pamięci za pomocą ToListAsync()
        // Zapobiega to błędowi z łączeniem stringów (imienia i nazwiska) przez bazę danych
        var assignments = await _db.Assignments
            .Include(a => a.Student)
            .Include(a => a.Supervisor)
            .ToListAsync();

        // Następnie bezpiecznie mapujemy je na DTO
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