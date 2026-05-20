using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Models;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class PreferencesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PreferencesController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

    [HttpPost]
    public async Task<IActionResult> SetPreferences([FromBody] SetPreferencesRequest req)
    {
        if (req.Preferences == null || req.Preferences.Count != 3)
            return BadRequest(new { message = "Musisz wybrać dokładnie trzech promotorów w kolejności preferencji." });

        var currentUser = await _db.Users
            .Include(u => u.Team)
            .ThenInclude(t => t.Members)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId);

        if (currentUser == null) return NotFound();

        if (currentUser.TeamId != null)
        {
            var leader = currentUser.Team.Members.OrderByDescending(m => m.GPA ?? 0).FirstOrDefault();
            if (leader != null && leader.Id != CurrentUserId)
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Tylko lider zespołu (osoba z najwyższą średnią) może zdefiniować preferencje dla całego zespołu." });
        }

        var existing = await _db.Preferences.Where(p => p.StudentId == CurrentUserId).ToListAsync();
        _db.Preferences.RemoveRange(existing);

        foreach (var pref in req.Preferences)
        {
            _db.Preferences.Add(new Preference
            {
                StudentId = CurrentUserId,
                SupervisorId = pref.SupervisorId,
                Priority = pref.Priority
            });
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyPreferences()
    {
        var prefs = await _db.Preferences
            .Include(p => p.Supervisor)
            .Where(p => p.StudentId == CurrentUserId)
            .Select(p => new PreferenceDto(
                p.Id,
                p.SupervisorId,
                $"{p.Supervisor.FirstName} {p.Supervisor.LastName}".Trim(),
                p.Supervisor.Title ?? string.Empty,
                p.Priority,
                p.Supervisor.MaxStudents ?? 0))
            .OrderBy(p => p.Priority)
            .ToListAsync();

        return Ok(prefs);
    }
}