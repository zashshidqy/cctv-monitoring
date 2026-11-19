<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Map Tile Provider Configuration
    |--------------------------------------------------------------------------
    |
    | Provider abstraction for MapLibre GL JS:
    | - 'osm': OpenStreetMap standard raster tiles (development only, observe terms)
    | - 'maptiler': MapTiler vector tiles (production recommended)
    | - 'mapbox': Mapbox vector tiles
    | - 'custom': Custom self-hosted vector tile server
    |
    */

    'provider' => env('MAP_PROVIDER', 'osm'),

    'api_key' => env('MAP_API_KEY', ''),

    // Style URL or raster tile pattern
    'style_url' => env('MAP_STYLE_URL', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'),

    'attribution' => env('MAP_ATTRIBUTION', '© OpenStreetMap contributors'),

    'default_center' => [
        'lng' => (float) env('MAP_DEFAULT_LNG', 106.8456),
        'lat' => (float) env('MAP_DEFAULT_LAT', -6.2088),
    ],

    'default_zoom' => (int) env('MAP_DEFAULT_ZOOM', 11),

    'max_pitch' => 20, // Strict design limit per 12-MAP-SPECIFICATION.md
];
