# Architecture

The application is a static React site built with Vinext and Vite. No API key, database, backend, telemetry or account is required. The Sites plugin is retained from the original scaffold; the runtime is a portable static export.

- `data/problems.json`: canonical problem records, translations, sources and milestones.
- `data/disciplines.json`: editorial discipline groups and translations.
- `lib/types.ts`: shared schema types and supported locales.
- `lib/catalog.ts`: pure filtering, milestone selection and URL validation.
- `lib/progress.ts`: localized progress labels and chronological, year-filtered routes.
- `lib/i18n.ts`: English, Simplified Chinese and Spanish interface strings.
- `components/atlas/terrain.tsx`: procedural height-field projection rendered as SVG triangles. A solid route connects dated milestones; a dashed route leads to the unestablished frontier. Geometry is illustrative, with no numeric completion score. Rotation buttons and the separate challenge list are keyboard accessible.
- `app/page.tsx`: filters, selected record, timeline and accessible text index.

The language, selected peak and year are encoded in query parameters. English is the initial and fallback language. Filtering is local; nothing is sent to a service. Missing or invalid URL values receive safe defaults. HTML metadata and the initial server-rendered document are English; switching language updates the document language and title on the client. Per-language SEO routes are not implemented.

`BASE_PATH` configures a subdirectory deployment, such as `/ai-summits`. `npm run build` produces the static `out/` directory. The GitHub Pages workflow sets the subdirectory automatically. A separate static server can host that directory at the matching path.

Future work should improve evidence coverage and test usability before adding ranking or forecasting. When adding statuses or locales, extend types, translations, schema and tests together.

## Optional agent interface

Browsers implementing `document.modelContext` can expose `explore_summit`, which validates a peak, year and locale before updating the same UI state as the controls. Unsupported browsers continue normally. The initial environment did not provide a compatible WebMCP/browser context, so registry integration was not exercised; input validation is covered by unit tests. Vendored Shadcn primitives are excluded from project lint, while TypeScript checks still cover them.
