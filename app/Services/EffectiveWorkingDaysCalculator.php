<?php

namespace App\Services;

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
            $holidays = [...$holidays, ...$this->getHolidayDatesForYear($year)];
        }

        $holidaySet = array_fill_keys($holidays, true);
        $workingDates = [];

        for ($date = $start; $date->lessThanOrEqualTo($end); $date = $date->addDay()) {
            if ($date->isWeekday() && ! isset($holidaySet[$date->toDateString()])) {
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
     * @return list<string>
     */
    private function getHolidayDatesForYear(int $year): array
    {
        return Cache::remember("google-calendar-indonesia-holidays-{$year}", now()->addDay(), function () use ($year): array {
            $apiKey = config('services.google_calendar.api_key');

            if (! is_string($apiKey) || $apiKey === '') {
                Log::warning('Google Calendar API key belum dikonfigurasi. Menggunakan kalkulasi tanpa hari libur nasional.');

                return [];
            }

            $timeMin = CarbonImmutable::create($year, 1, 1, 0, 0, 0, 'Asia/Jakarta')->subSecond()->toRfc3339String();
            $timeMax = CarbonImmutable::create($year + 1, 1, 1, 0, 0, 0, 'Asia/Jakarta')->toRfc3339String();
            $dates = [];
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
                        Log::warning('Google Calendar API mengembalikan status non-200. Menggunakan kalkulasi tanpa hari libur nasional.', [
                            'status' => $response->status(),
                        ]);

                        return [];
                    }

                    foreach ($response->json('items', []) as $event) {
                        $holidayDate = $event['start']['date'] ?? null;
                        if (is_string($holidayDate)) {
                            $dates[] = $holidayDate;
                        }
                    }

                    $pageToken = $response->json('nextPageToken');
                } while (is_string($pageToken) && $pageToken !== '');
            } catch (Throwable $exception) {
                Log::warning('Gagal mengambil hari libur dari Google Calendar. Menggunakan kalkulasi tanpa hari libur nasional.', [
                    'year' => $year,
                    'message' => $exception->getMessage(),
                ]);

                return [];
            }

            return array_values(array_unique($dates));
        });
    }
}