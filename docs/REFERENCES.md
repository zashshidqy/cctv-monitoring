# References

Dokumentasi berikut diperiksa pada 20 November 2026. Selalu periksa kembali versi terbaru sebelum instalasi atau deployment.

## O!Save brand and store context

- O!Save official website: https://www.osave.id/
- About O!Save: https://www.osave.id/about-us
- Store locator: https://www.osave.id/store-locator

Website publik memberi konteks merek dan store locator. Website publik bukan brand guideline internal. Gunakan logo dan color values resmi dari organisasi bila tersedia.

## Laravel / frontend

- Laravel 13 starter kits: https://laravel.com/docs/13.x/starter-kits
- shadcn/ui manual installation: https://ui.shadcn.com/docs/installation/manual
- shadcn/ui official resources: https://ui.shadcn.com/docs/official

## Map

- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- MapLibre Map API (`setPitch`): https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/
- MapLibre CameraOptions: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/
- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/

## CCTV / streaming

- MediaMTX documentation: https://mediamtx.org/docs/
- MediaMTX publish/read streams: https://mediamtx.org/docs/features/publish-and-read
- MediaMTX specifications: https://mediamtx.org/docs/misc/specifications
- ONVIF profiles: https://www.onvif.org/profiles/
- ONVIF conformant products: https://www.onvif.org/conformant-products/

## Important interpretation notes

- Laravel 13 official React starter kit is documented as using React, TypeScript, Tailwind, and shadcn/ui with Inertia. Confirm compatibility with the target repository before adopting.
- MapLibre GL JS supports map pitch/camera controls. A target of 15–20° is a product design choice and must be tuned using the real style and store geography.
- OSM data may be used under its licensing terms, but the public OSM tile service has its own usage policy and no production SLA. Choose an appropriate tile provider or self-host if usage requires it.
- ONVIF interoperability is profile-based. Check product conformance and actual capabilities, not just marketing claims.
- MediaMTX supports multiple media protocols and can read/write streams across protocols; actual support must be validated against deployed camera codecs, network setup, and browser behavior.
