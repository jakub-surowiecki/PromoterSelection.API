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
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeamsController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest req)
    {
        var me = await _db.Users.FindAsync(CurrentUserId);
        if (me == null) return NotFound();
        if (me.TeamId != null) return BadRequest(new { message = "Jesteś już w zespole." });

        var team = new Team { Name = req.Name };
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();

        me.TeamId = team.Id;
        await _db.SaveChangesAsync();

        return Ok(new { TeamId = team.Id });
    }

    [HttpPost("members")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> AddMember([FromBody] AddMemberRequest req)
    {
        var me = await _db.Users.FindAsync(CurrentUserId);
        if (me?.TeamId == null) return BadRequest(new { message = "Nie jesteś przypisany do żadnego zespołu." });

        var newMember = await _db.Users.FindAsync(req.StudentId);
        if (newMember == null || newMember.Role != UserRole.Student)
            return NotFound(new { message = "Student nie został znaleziony." });

        if (newMember.TeamId != null)
            return BadRequest(new { message = "Ten student jest już w innym zespole." });

        newMember.TeamId = me.TeamId;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetTeams()
    {
        var teams = await _db.Teams
            .Include(t => t.Members)
            .Select(t => new TeamDto(
                t.Id,
                t.Name,
                t.Members.Select(m => new TeamMemberDto(m.Id, $"{m.FirstName} {m.LastName}", m.AlbumNumber ?? "", m.GPA)).ToList(),
                t.AssignedSupervisorId,
                null, // AssignedSupervisorName - do rozwinięcia o relację
                null, // LeaderId
                null  // LeaderName
            )).ToListAsync();

        return Ok(teams);
    }
}