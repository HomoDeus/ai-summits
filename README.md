# AI Summits

**An open atlas of human challenges—and the ground AI has gained.**

[Explore the atlas](https://homodeus.github.io/ai-summits/) · [中文地图](https://homodeus.github.io/ai-summits/?lang=zh-CN) · [Explorar en español](https://homodeus.github.io/ai-summits/?lang=es)

[English](README.md) · [简体中文](docs/README.zh-CN.md) · [Español](docs/README.es.md)

Explore a continuous 3D mountain world you can orbit, tilt, pan and zoom of known problems across the sciences and humanities. Follow historical AI milestones, inspect their evidence, and see exactly what remains unsolved.

## First edition

- **30 problems across 23 disciplines:** mathematics, computer science, physics, astronomy, chemistry, materials science, biology, medicine, neuroscience, Earth science, energy engineering, robotics, economics, social sciences, history and archaeology, linguistics, agriculture, ecology, philosophy, law and justice, education, psychology, and arts and aesthetics.
- English by default, with complete Simplified Chinese and Spanish interface and record translations.
- All challenges share one WebGL mountain world, grouped by discipline. Procedural black mountain ranges extend beyond known provinces, with tiles generated and released as the camera travels. Scroll or pinch to zoom, orbit or pan, and fly directly to a selected peak. Fixed peak locations persist across selections, filters and historical replay. Select any peak for “Where we are” and “What is still ahead”; filters dim other peaks without removing them. A keyboard-accessible challenge list provides an alternative.
- Year-by-year replay of selected milestones, with shareable language, peak and year query parameters.
- Original-source links, explicit human/AI attribution and clearly stated limits for each recorded advance.

This is a representative collection, **not an exhaustive list or a live frontier ranking**. Named peak height uses the equal-weight average of provisional editorial difficulty and importance ratings (1–5); these are subjective estimates, not consensus measurements. Unnamed mountains symbolize unframed or unlisted questions and have no ratings. Human and AI climbers indicate dated evidence categories; unknown records carry a question mark, and achieved targets receive a summit flag. No completion percentages are claimed. “Target achieved” always refers to the exact stated target—not an entire discipline. Read the [editorial policy](docs/EDITORIAL_POLICY.md).

## Run locally

Requires Node 24 (see `.nvmrc`) and npm.

```sh
git clone https://github.com/HomoDeus/ai-summits.git
cd ai-summits
npm ci
npm run dev
```

Open the local URL printed by the server. No accounts, API keys or environment secrets are required.

```sh
npm run check     # TypeScript, lint, catalog and behavior tests
npm run build     # Static website in out/
npm start         # Serve that build on 127.0.0.1:4173
```

To host under a subdirectory, set `BASE_PATH` when building:

```sh
BASE_PATH=/ai-summits npm run build
```

The GitHub Pages workflow builds and publishes `out/` on pushes to `main`. Enable GitHub Pages with GitHub Actions as the source in repository settings. Static hosts can serve the same export; use the matching base path.

## Contribute

Add a sourced problem, document a new milestone, improve a translation or fix accessibility. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Problem data lives in readable JSON and is validated by automated tests. English is the canonical source language; more locales are welcome.

See [architecture](docs/ARCHITECTURE.md) for implementation details. The core experience uses a Three.js terrain mesh with streamed tiles with a fully usable text alternative.

## Related work

- [AI Capability Terrain](https://apartresearch.com/project/ai-capability-terrain-ixd9): related 3D AI-capability visualization.
- [FrontierMath: Open Problems](https://epoch.ai/frontiermath/open-problems): evidence-driven tracking of open mathematics problems.
- [Moravec’s landscape of human competence](https://lifearchitect.ai/flood/): an earlier landscape metaphor for machine capabilities.

AI Summits is an independent implementation. It does not claim to originate the terrain metaphor, copy those projects’ code, or imply endorsement by source institutions.

## License

[MIT](LICENSE) applies to this repository’s original code, data summaries and translations. Referenced papers, websites and dependency code retain their respective licenses. No third-party article text or imagery is redistributed.
