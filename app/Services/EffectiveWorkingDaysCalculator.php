<?php

namespace App\Services;

use App\Models\Holiday;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class EffectiveWorkingDaysCalculator
{
    private const HOLIDAY_CALENDAR_ID = 'en.indonesia#holiday@group.v.calendar.google.com';

    /**
     * @return list<string>
     */
    public function getEffectiveWorkingDates(string|\DateTimeInterface $startDate, string|\DateTimeInterface $endDate): array
    {
        $start = CarbonImmutable::parse($startDate)->startOfDay();
        $end = CarbonImmutable::parse($endDate)->startOfDay();

        if ($end->lessThan($start)) {
            return [];
        }

        $holidays = [];
        foreach (range((int) $start->format('Y'), (int) $end->format('Y')) as $year) {
            $holidays += $this->getHolidayCalendarForYear($year);
        }

        $workingDates = [];

        for ($date = $start; $date->lessThanOrEqualTo($end); $date = $date->addDay()) {
            if (! $date->isWeekend() && ! isset($holidays[$date->toDateString()])) {
                $workingDates[] = $date->toDateString();
            }
        }

        return $workingDates;
    }

    public function getEffectiveWorkingDays(string|\DateTimeInterface $startDate, string|\DateTimeInterface $endDate): int
    {
        return count($this->getEffectiveWorkingDates($startDate, $endDate));
    }

    /**
     * @return array{date: string, is_weekend: bool, is_holiday: bool, is_attendance_open: bool, holiday_name: ?string, message: ?string}
     */
    public function getDayStatus(string|\DateTimeInterface $date): array
    {
        $day = CarbonImmutable::parse($date)->startOfDay();
        $isWeekend = $day->isWeekend();
        $holidayName = Holiday::query()->whereDate('date', $day->toDateString())->value('name');

        if (! $holidayName && ! $isWeekend) {
            $holidayName = $this->getHolidayCalendarForYear((int) $day->format('Y'))[$day->toDateString()] ?? null;
        }

        $isHoliday = $holidayName !== null;
        $isOpen = ! $isWeekend && ! $isHoliday;
        $message = $isOpen
            ? null
            : ($holidayName
                ? "Presensi tidak dibuka pada hari libur: {$holidayName}."
                : 'Presensi tidak dibuka pada hari libur akhir pekan.');

        return [
            'date' => $day->toDateString(),
            'is_weekend' => $isWeekend,
            'is_holiday' => $isHoliday,
            'is_attendance_open' => $isOpen,
            'holiday_name' => $holidayName,
            'message' => $message,
        ];
    }

    /**
     * @return array<string, string>
     */
    private function getHolidayCalendarForYear(int $year): array
    {
        $holidays = Holiday::query()
            ->whereYear('date', $year)
            ->pluck('name', 'date')
            ->all();

        $calendarHolidays = Cache::remember("google-calendar-indonesia-holidays-{$year}", now()->addDay(), function () use ($year): array {
            $apiKey = config('services.google_calendar.api_key');

            if (! is_string($apiKey) || $apiKey === '') {
                return [];
            }

            $timeMin = CarbonImmutable::create($year, 1, 1, 0, 0, 0, 'Asia/Jakarta')->subSecond()->toRfc3339String();
            $timeMax = CarbonImmutable::create($year + 1, 1, 1, 0, 0, 0, 'Asia/Jakarta')->toRfc3339String();
            $calendarHolidays = [];
            $pageToken = null;

            try {
                do {
                    $query = [
                        'key' => $apiKey,
                        'timeMin' => $timeMin,
                        'timeMax' => $timeMax,
                        'singleEvents' => 'true',
                        'maxResults' => 2500,
                        'orderBy' => 'startTime',
                        'timeZone' => 'Asia/Jakarta',
                    ];
                    if ($pageToken !== null) {
                        $query['pageToken'] = $pageToken;
                    }

                    $response = Http::connectTimeout(3)
                        ->timeout(8)
                        ->get('https://www.googleapis.com/calendar/v3/calendars/'.rawurlencode(self::HOLIDAY_CALENDAR_ID).'/events', $query);

                    if (! $response->successful()) {
                        Log::warning('Google Calendar API mengembalikan status non-200. Menggunakan daftar hari libur lokal.', [
                            'status' => $response->status(),
                        ]);

                        return [];
                    }

                    foreach ($response->json('items', []) as $event) {
                        $holidayDate = $event['start']['date'] ?? null;
                        if (is_string($holidayDate)) {
                            $calendarHolidays[$holidayDate] ??= $event['summary'] ?? 'Hari Libur Nasional';
                        }
                    }

                    $pageToken = $response->json('nextPageToken');
                } while (is_string($pageToken) && $pageToken !== '');
            } catch (Throwable $exception) {
                Log::warning('Gagal mengambil hari libur dari Google Calendar. Menggunakan daftar hari libur lokal.', [
                    'year' => $year,
                    'message' => $exception->getMessage(),
                ]);

                return [];
            }

            return $calendarHolidays;
        });

        return $holidays + $calendarHolidays;
    }
}
