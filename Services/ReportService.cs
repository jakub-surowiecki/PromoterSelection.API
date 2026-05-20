using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.DTOs;
using PromoterSelection.API.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PromoterSelection.API.Services;

public interface IReportService
{
    Task<byte[]> GenerateExcelReportAsync();
    Task<byte[]> GeneratePdfReportAsync();
}

public class ReportService : IReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db)
    {
        _db = db;
        // Wymagane przez licencję QuestPDF do darmowego korzystania
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private async Task<(List<ReportStudentRow> students, List<ReportTeamRow> teams, List<ReportUnusedSlotRow> unused)> GatherData()
    {
        // 1. Studenci i ich promotorzy
        var assignments = await _db.Assignments
            .Include(a => a.Student)
            .Include(a => a.Supervisor)
            .ToListAsync();

        var studentsReport = assignments.Select(a => new ReportStudentRow(
            a.Student.AlbumNumber ?? "-",
            $"{a.Student.FirstName} {a.Student.LastName}".Trim(),
            $"{a.Supervisor.FirstName} {a.Supervisor.LastName}".Trim(),
            a.Supervisor.Title ?? ""
        )).ToList();

        // 2. Miejsca u promotorów
        var supervisors = await _db.Users.Where(u => u.Role == UserRole.Supervisor).ToListAsync();
        var unusedReport = supervisors.Select(s =>
        {
            var total = s.MaxStudents ?? 0;
            var used = assignments.Count(a => a.SupervisorId == s.Id);
            return new ReportUnusedSlotRow(
                $"{s.Title} {s.FirstName} {s.LastName}".Trim(),
                total,
                used,
                Math.Max(0, total - used)
            );
        }).OrderByDescending(x => x.UnusedSlots).ToList();

        // 3. Zespoły i ich promotorzy
        var dbTeams = await _db.Teams
            .Include(t => t.Members)
            .Where(t => t.AssignedSupervisorId != null)
            .ToListAsync();

        var supervisorDict = supervisors.ToDictionary(s => s.Id);

        var teamsReport = dbTeams.Select(t =>
        {
            var leader = t.Members.OrderByDescending(m => m.GPA ?? 0).FirstOrDefault();
            var sup = supervisorDict.TryGetValue(t.AssignedSupervisorId!.Value, out var s) ? s : null;
            var supName = sup != null ? $"{sup.Title} {sup.FirstName} {sup.LastName}".Trim() : "-";

            return new ReportTeamRow(
                t.Name,
                leader != null ? $"{leader.FirstName} {leader.LastName}" : "-",
                supName,
                t.Members.Select(m => $"{m.FirstName} {m.LastName}").ToList()
            );
        }).ToList();

        return (studentsReport, teamsReport, unusedReport);
    }

    public async Task<byte[]> GenerateExcelReportAsync()
    {
        var data = await GatherData();
        using var workbook = new XLWorkbook();

        var ws1 = workbook.Worksheets.Add("Studenci");
        ws1.Cell(1, 1).Value = "Nr Albumu";
        ws1.Cell(1, 2).Value = "Imię i nazwisko";
        ws1.Cell(1, 3).Value = "Promotor";
        for (int i = 0; i < data.students.Count; i++)
        {
            ws1.Cell(i + 2, 1).Value = data.students[i].AlbumNumber;
            ws1.Cell(i + 2, 2).Value = data.students[i].StudentName;
            ws1.Cell(i + 2, 3).Value = $"{data.students[i].SupervisorTitle} {data.students[i].SupervisorName}";
        }

        var ws2 = workbook.Worksheets.Add("Zespoły");
        ws2.Cell(1, 1).Value = "Nazwa zespołu";
        ws2.Cell(1, 2).Value = "Lider";
        ws2.Cell(1, 3).Value = "Promotor";
        ws2.Cell(1, 4).Value = "Członkowie";
        for (int i = 0; i < data.teams.Count; i++)
        {
            ws2.Cell(i + 2, 1).Value = data.teams[i].TeamName;
            ws2.Cell(i + 2, 2).Value = data.teams[i].LeaderName;
            ws2.Cell(i + 2, 3).Value = data.teams[i].SupervisorName;
            ws2.Cell(i + 2, 4).Value = string.Join(", ", data.teams[i].Members);
        }

        var ws3 = workbook.Worksheets.Add("Wolne miejsca");
        ws3.Cell(1, 1).Value = "Promotor";
        ws3.Cell(1, 2).Value = "Limit";
        ws3.Cell(1, 3).Value = "Zajęte";
        ws3.Cell(1, 4).Value = "Wolne";
        for (int i = 0; i < data.unused.Count; i++)
        {
            ws3.Cell(i + 2, 1).Value = data.unused[i].SupervisorName;
            ws3.Cell(i + 2, 2).Value = data.unused[i].TotalSlots;
            ws3.Cell(i + 2, 3).Value = data.unused[i].UsedSlots;
            ws3.Cell(i + 2, 4).Value = data.unused[i].UnusedSlots;
        }

        ws1.Columns().AdjustToContents();
        ws2.Columns().AdjustToContents();
        ws3.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GeneratePdfReportAsync()
    {
        var data = await GatherData();

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Text("Raport z przydzialu promotorow").SemiBold().FontSize(18);

                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                {
                    x.Item().PaddingBottom(5).Text("1. Statystyki miejsc").SemiBold().FontSize(14);
                    x.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(3); c.RelativeColumn(1); c.RelativeColumn(1); });
                        t.Header(h => {
                            h.Cell().BorderBottom(1).PaddingBottom(2).Text("Promotor").Bold();
                            h.Cell().BorderBottom(1).PaddingBottom(2).Text("Limit").Bold();
                            h.Cell().BorderBottom(1).PaddingBottom(2).Text("Zostalo").Bold();
                        });
                        foreach (var row in data.unused)
                        {
                            t.Cell().PaddingVertical(2).Text(row.SupervisorName);
                            t.Cell().PaddingVertical(2).Text(row.TotalSlots.ToString());
                            t.Cell().PaddingVertical(2).Text(row.UnusedSlots.ToString());
                        }
                    });

                    x.Item().PaddingTop(20).PaddingBottom(5).Text("2. Lista studentow").SemiBold().FontSize(14);
                    x.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(1); c.RelativeColumn(2); c.RelativeColumn(3); });
                        t.Header(h => {
                            h.Cell().BorderBottom(1).PaddingBottom(2).Text("Album").Bold();
                            h.Cell().BorderBottom(1).PaddingBottom(2).Text("Student").Bold();
                            h.Cell().BorderBottom(1).PaddingBottom(2).Text("Promotor").Bold();
                        });
                        foreach (var row in data.students)
                        {
                            t.Cell().PaddingVertical(2).Text(row.AlbumNumber);
                            t.Cell().PaddingVertical(2).Text(row.StudentName);
                            t.Cell().PaddingVertical(2).Text($"{row.SupervisorTitle} {row.SupervisorName}");
                        }
                    });
                });
            });
        });

        return doc.GeneratePdf();
    }
}