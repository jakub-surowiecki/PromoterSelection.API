using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PromoterSelection.API.Services;

namespace PromoterSelection.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("pdf")]
    public async Task<IActionResult> DownloadPdf()
    {
        var bytes = await _reportService.GeneratePdfReportAsync();
        return File(bytes, "application/pdf", $"Raport_Przydzialow_{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpGet("xlsx")]
    public async Task<IActionResult> DownloadExcel()
    {
        var bytes = await _reportService.GenerateExcelReportAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Raport_Przydzialow_{DateTime.Now:yyyyMMdd}.xlsx");
    }
}