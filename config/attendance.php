<?php

return [
    'office_lat' => env('OFFICE_LAT'),
    'office_lng' => env('OFFICE_LNG'),
    'max_radius_meters' => (int) env('MAX_RADIUS_METERS', 50),
];
