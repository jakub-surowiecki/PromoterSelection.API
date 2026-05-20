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
    private readonly IConfiguration _config;

    public TeamsController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string CurrentRole => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpPost]
    [Authorize(Roles = "Student,Admin")]
    public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest req)
    {
        var targetUserId = CurrentUserId;
        var targetUser = await _db.Users.FindAsync(targetUserId);

        if (targetUser == null) return NotFound();

        if (targetUser.TeamId != null && CurrentRole != "Admin")
            return BadRequest(new { message = "Jesteś już w zespole." });

        var team = new Team { Name = req.Name };
        _db.Teams.Add(team);
        await _db.SaveChangesAsync();

        if (CurrentRole == "Student")
        {
            targetUser.TeamId = team.Id;
            await _db.SaveChangesAsync();
        }

        return Ok(new { TeamId = team.Id });
    }

    [HttpPost("{teamId}/members")]
    [Authorize(Roles = "Student,Admin")]
    public async Task<IActionResult> AddMember(int teamId, [FromBody] AddMemberRequest req)
    {
        var team = await _db.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);
        if (team == null) return NotFound(new { message = "Zespół nie istnieje." });

        int maxTeamSize = _config.GetValue<int>("MaxTeamSize", 3);
        if (team.Members.Count >= maxTeamSize)
            return BadRequest(new { message = "Zespół osiągnął maksymalną dozwoloną liczbę członków." });

        var newMember = await _db.Users.FindAsync(req.StudentId);
        if (newMember == null || newMember.Role != UserRole.Student)
            return NotFound(new { message = "Student nie został znaleziony." });

        if (newMember.TeamId != null)
            return BadRequest(new { message = "Ten student jest już w innym zespole." });

        newMember.TeamId = team.Id;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetTeams()
    {
        var teams = await _db.Teams
            .Include(t => t.Members)
            .ToListAsync();

        var supervisorIds = teams.Where(t => t.AssignedSupervisorId.HasValue).Select(t => t.AssignedSupervisorId.Value).Distinct();
        var supervisors = await _db.Users.Where(u => supervisorIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);

        var result = teams.Select(t =>
        {
            var leader = t.Members.OrderByDescending(m => m.GPA ?? 0).FirstOrDefault();

            var supervisor = t.AssignedSupervisorId.HasValue && supervisors.ContainsKey(t.AssignedSupervisorId.Value)
                ? supervisors[t.AssignedSupervisorId.Value] : null;

            return new TeamDto(
                t.Id,
                t.Name,
                t.Members.Select(m => new TeamMemberDto(m.Id, $"{m.FirstName} {m.LastName}".Trim(), m.AlbumNumber ?? string.Empty, m.GPA)).ToList(),
                t.AssignedSupervisorId,
                supervisor != null ? $"{supervisor.Title} {supervisor.FirstName} {supervisor.LastName}".Trim() : null,
                leader?.Id,
                leader != null ? $"{leader.FirstName} {leader.LastName}".Trim() : null
            );
        }).ToList();

        return Ok(result);
    }
}