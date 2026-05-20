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

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> SetPreferences([FromBody] SetPreferencesRequest req)
    {
        // Usunięcie starych preferencji studenta
        var existing = await _db.Preferences.Where(p => p.StudentId == CurrentUserId).ToListAsync();
        _db.Preferences.RemoveRange(existing);

        // Dodanie nowych preferencji
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
                $"{p.Supervisor.FirstName} {p.Supervisor.LastName}",
                p.Supervisor.Title ?? "",
                p.Priority,
                p.Supervisor.MaxStudents ?? 0)) // Należałoby odjąć przypisanych studentów do AvailableSlots
            .OrderBy(p => p.Priority)
            .ToListAsync();

        return Ok(prefs);
    }
}