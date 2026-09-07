# Contributing to AI Summits

Contributions to evidence, scope, accessibility and translation are as valuable as code.

## Add a problem or milestone

1. Look for an existing record in `data/problems.json` to avoid duplicates.
2. Define a specific question. Distinguish an open research problem, a practical challenge and a benchmark target in the wording.
3. Cite an original paper, benchmark organizer or authoritative institution. A lab's announcement should be identified as such; independently corroborate disputed claims. Search snippets alone are not sufficient for a disputed status change.
4. Add a milestone only when its result, year, system, evidence type and bounded claim are supported. Credit human contributors in `system` where relevant.
5. Describe what the result **does not establish**, in all three languages.
6. Update `reviewed` only after checking the sources. A review date is not a guarantee of comprehensive coverage or the latest result.
7. Run `npm run check` and `npm run build`, then open a pull request explaining the claim and evidence.

See [the editorial policy](docs/EDITORIAL_POLICY.md) for status definitions and contested results. Never infer a percentage complete from a benchmark score. Coordinates and mountain heights are visual layout only.

## Translate

English is the canonical source language. The initial locales are `en`, `zh-CN` and `es`. Translate UI strings in `lib/i18n.ts` and all problem/discipline text in `data/`. Preserve qualifications, dates and the distinction between experiments and deployment. Official source titles and proper names may remain in their original language.

For a new language: add its locale and display name in `lib/types.ts` and `lib/i18n.ts`, translate every required text object, and extend the URL parser in `lib/catalog.ts`. Tests fail when translations are missing. Native-speaker review is welcome; the initial translations are not independently certified.

## Code

Use Node 24 and `npm ci`. Keep changes focused. Test changes to filtering, replay, URL parsing and data integrity. Use semantic controls and maintain a usable text index alongside the terrain. Respect reduced-motion preferences. Keep English documentation as the default.

Do not commit credentials, build output, private conversations or copied third-party papers. Source links do not transfer a publisher's copyright to this repository.
