<?php

return [
    'office_lat' => env('OFFICE_LAT'),
    'office_lng' => env('OFFICE_LNG'),
    'max_radius_meters' => (int) env('MAX_RADIUS_METERS', 50),
    'holidays' => [
        // Add Indonesian national or local holidays here, then run db:seed --class=HolidaySeeder.
        // ['date' => '2026-12-25', 'name' => 'Hari Natal'],
    ],
];
