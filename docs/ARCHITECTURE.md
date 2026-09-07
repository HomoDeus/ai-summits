# Architecture

The application is a static React site built with Vinext and Vite. No API key, database, backend, telemetry or account is required. The Sites plugin is retained from the original scaffold; the runtime is a portable static export.

- `data/problems.json`: canonical problem records, translations, sources and milestones.
- `data/disciplines.json`: editorial discipline groups and translations.
- `lib/types.ts`: shared schema types and supported locales.
- `lib/catalog.ts`: pure filtering, milestone selection and URL validation.
- `lib/progress.ts`: localized progress labels and chronological, year-filtered routes.
- `lib/i18n.ts`: English, Simplified Chinese and Spanish interface strings.
- `components/atlas/terrain.tsx`: React controls, projected accessible labels, actor evidence and loading/WebGL-failure states. The Three.js engine is loaded on the client only. The text index remains available without WebGL.
- `components/atlas/world-engine.ts`: perspective camera, OrbitControls (orbit, pan, cursor zoom and touch), focus flights, terrain streaming, draped province borders, routes, actor sprites and achieved-target flags. Static camera frames render on demand; hidden/offscreen surfaces pause rendering. Unmounted or discarded geometry, materials, textures, observers and controls are disposed.
- `lib/terrain-world.ts`: deterministic continuous height field, world coordinates, polygon membership and bounded tile residency. At most 225 terrain tiles (32 × 32 world units, 32 grid segments) surround the camera target. Sampling global coordinates and normals avoids tile seams. Unknown regions have near-black materials; fog softens the distant horizon. The world has no authored outer boundary, although floating-point coordinates and finite rendering distance impose practical limits.
- `lib/map-model.ts`: editorial ratings, province topology and dated human progress. Summit elevations map the existing editorial height to `4 + height / 8` world units; unnamed ridges are unscored. Named summits are aligned with mesh vertices so routes, actors and flags sit on the terrain. Labels thin out at distance while the catalog remains complete.

- `app/page.tsx`: filters, selected record, timeline and accessible text index.

The language, selected peak and year are encoded in query parameters. English is the initial and fallback language. Filtering is local; nothing is sent to a service. Missing or invalid URL values receive safe defaults. HTML metadata and the initial server-rendered document are English; switching language updates the document language and title on the client. Per-language SEO routes are not implemented.

`BASE_PATH` configures a subdirectory deployment, such as `/ai-summits`. `npm run build` produces the static `out/` directory. The GitHub Pages workflow sets the subdirectory automatically. A separate static server can host that directory at the matching path.

Future work should improve evidence coverage and test usability before adding ranking or forecasting. When adding statuses or locales, extend types, translations, schema and tests together.

## Optional agent interface

Browsers implementing `document.modelContext` can expose `explore_summit`, which validates a peak, year and locale before updating the same UI state as the controls. Unsupported browsers continue normally. The initial environment did not provide a compatible WebMCP/browser context, so registry integration was not exercised; input validation is covered by unit tests. Vendored Shadcn primitives are excluded from project lint, while TypeScript checks still cover them.
