<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
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
                throw new RuntimeException('Google Calendar API key belum dikonfigurasi.');
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
                        throw new RuntimeException('Google Calendar API mengembalikan HTTP '.$response->status().'.');
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
                Log::warning('Gagal mengambil hari libur dari Google Calendar.', [
                    'year' => $year,
                    'message' => $exception->getMessage(),
                ]);

                throw new RuntimeException('Data hari libur nasional tidak dapat dimuat. Coba lagi nanti.', previous: $exception);
            }

            return array_values(array_unique($dates));
        });
    }
}
