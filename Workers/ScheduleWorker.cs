using Microsoft.EntityFrameworkCore;
using PromoterSelection.API.Data;
using PromoterSelection.API.Services;

namespace PromoterSelection.API.Workers;

public class ScheduleWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ScheduleWorker> _logger;

    public ScheduleWorker(IServiceProvider serviceProvider, ILogger<ScheduleWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Serwis harmonogramu został uruchomiony w tle.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var assignmentService = scope.ServiceProvider.GetRequiredService<IAssignmentService>();

                // Pobierz aktywny harmonogram
                var schedule = await db.Schedules.FirstOrDefaultAsync(s => s.IsActive, stoppingToken);

                if (schedule != null && DateTime.UtcNow >= schedule.EndDate)
                {
                    _logger.LogInformation("Czas harmonogramu minął! Zamykam wybory i uruchamiam algorytm...");

                    schedule.IsActive = false;
                    await db.SaveChangesAsync(stoppingToken);

                    var (assigned, unassigned) = await assignmentService.RunAutoAssignment();
                    _logger.LogInformation($"Algorytm zakończony. Pomyślnie przypisano: {assigned}, Brak miejsc dla: {unassigned}");

                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Wystąpił błąd podczas sprawdzania harmonogramu.");
            }

            // Usypiamy workera na minutę (sprawdza czas co 60 sekund)
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}