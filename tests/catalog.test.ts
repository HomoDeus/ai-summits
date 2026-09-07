import assert from 'node:assert/strict';
import test from 'node:test';
import {
  disciplines,
  filterProblems,
  milestoneAt,
  parseView,
  problems,
  statusAt,
} from '../lib/catalog.ts';
import { progressCopy, routeAt } from '../lib/progress.ts';
import { messages } from '../lib/i18n.ts';
import { locales, type Problem } from '../lib/types.ts';

void test('catalog IDs, sources and all three translations are complete', () => {
  const ids = new Set<string>();
  const domains = new Set(disciplines.map((d) => d.id));
  assert.equal(domains.size, disciplines.length);
  const checkText = (text: Record<string, string>) => {
    assert.deepEqual(Object.keys(text).sort(), [...locales].sort());
    for (const locale of locales)
      assert.ok(text[locale]?.trim().length, `Missing ${locale} translation`);
  };
  for (const d of disciplines) checkText(d.name);
  for (const p of problems) {
    assert.match(p.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!ids.has(p.id));
    ids.add(p.id);
    assert.ok(domains.has(p.discipline), `Unknown discipline: ${p.discipline}`);
    [p.title, p.question, p.boundary, p.frontier].forEach(checkText);
    assert.match(p.reviewed, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isFinite(Date.parse(p.reviewed)));
    assert.ok(p.sources.length > 0);
    for (const source of [
      ...p.sources,
      ...p.milestones.flatMap((m) => m.sources),
    ]) {
      assert.ok(source.title.trim());
      assert.equal(new URL(source.url).protocol, 'https:');
    }
    const years = new Set<number>();
    for (const m of p.milestones) {
      assert.ok(
        Number.isInteger(m.year) &&
          m.year >= 1900 &&
          m.year <= Number(p.reviewed.slice(0, 4)),
      );
      assert.ok(
        !years.has(m.year),
        'One year-summary per problem; consolidate same-year events',
      );
      years.add(m.year);
      assert.ok(['partial', 'achieved'].includes(m.status));
      assert.ok(
        [
          'proof',
          'competition',
          'benchmark',
          'experiment',
          'simulation',
          'discovery',
        ].includes(m.evidence),
      );
      assert.ok(m.system.trim());
      assert.ok(m.sources.length > 0);
      checkText(m.summary);
      checkText(m.headline);
    }
  }
  for (const d of disciplines)
    assert.ok(
      problems.some((p) => p.discipline === d.id),
      `Empty discipline: ${d.id}`,
    );
});

void test('UI translation dictionaries have identical nonempty keys', () => {
  for (const locale of locales) {
    assert.deepEqual(
      Object.keys(messages[locale]).sort(),
      Object.keys(messages.en).sort(),
    );
    assert.ok(
      Object.values(messages[locale]).every((v) => v.trim().length > 0),
    );
  }
});

void test('replay never leaks a future achievement', () => {
  const go = problems.find((p) => p.id === 'go')!;
  assert.equal(statusAt(go, 2015), 'open');
  assert.equal(milestoneAt(go, 2015), undefined);
  assert.equal(statusAt(go, 2016), 'achieved');
  assert.equal(statusAt(go, 2026), 'achieved');
  assert.equal(
    statusAt(
      problems.find((p) => p.id === 'riemann')!,
      2026,
    ),
    'open',
  );
});

void test('replay selects latest eligible milestone without mutating source history', () => {
  const original = problems.find((p) => p.id === 'go')!;
  const fake: Problem = {
    ...original,
    milestones: [
      { ...original.milestones[0], year: 2024 },
      { ...original.milestones[0], year: 2018, status: 'partial' },
    ],
  };
  assert.equal(milestoneAt(fake, 2020)?.year, 2018);
  assert.equal(milestoneAt(fake, 2024)?.year, 2024);
  assert.deepEqual(
    fake.milestones.map((m) => m.year),
    [2024, 2018],
  );
});

void test('search combines language, discipline, status and cutoff year', () => {
  assert.deepEqual(
    filterProblems(problems, 'zh-CN', '蛋白质', 'biology', 'partial', 2020).map(
      (p) => p.id,
    ),
    ['protein-structure'],
  );
  assert.deepEqual(
    filterProblems(
      problems,
      'es',
      '  PROTEÍNA  ',
      'biology',
      'partial',
      2020,
    ).map((p) => p.id),
    ['protein-structure'],
  );
  assert.deepEqual(
    filterProblems(problems, 'en', 'AlphaFold', 'all', 'partial', 2019),
    [],
  );
  assert.deepEqual(
    filterProblems(problems, 'en', '', 'computing', 'achieved', 2016).map(
      (p) => p.id,
    ),
    ['go'],
  );
  assert.equal(
    filterProblems(problems, 'en', '', 'all', 'all', 2026).length,
    problems.length,
  );
  assert.equal(
    filterProblems(problems, 'en', 'no-such-peak-xyz', 'all', 'all', 2026)
      .length,
    0,
  );
});

void test('shareable URL values are validated and English is the default', () => {
  assert.deepEqual(parseView(''), {
    locale: 'en',
    year: 2026,
    selected: 'protein-structure',
  });
  assert.deepEqual(parseView('?lang=es&year=2016&peak=go'), {
    locale: 'es',
    year: 2016,
    selected: 'go',
  });
  assert.deepEqual(
    parseView('?lang=evil&year=Infinity&peak=missing'),
    parseView(''),
  );
  for (const year of ['2014', '2027', '2020.5', 'NaN', ''])
    assert.equal(parseView(`?year=${year}`).year, 2026);
});

void test('ascent uses dated evidence, without invented intermediate stages', () => {
  const protein = problems.find((p) => p.id === 'protein-structure')!;
  assert.deepEqual(routeAt(protein, 2019), []);
  assert.deepEqual(
    routeAt(protein, 2020).map((m) => m.year),
    [2020],
  );
  assert.deepEqual(
    routeAt(protein, 2024).map((m) => m.year),
    [2020, 2024],
  );
  assert.equal(milestoneAt(protein, 2024)?.system, 'AlphaFold 3');
  assert.deepEqual(
    routeAt(
      problems.find((p) => p.id === 'riemann')!,
      2026,
    ),
    [],
  );
  for (const locale of locales) {
    assert.deepEqual(
      Object.keys(progressCopy[locale]).sort(),
      Object.keys(progressCopy.en).sort(),
    );
    assert.ok(Object.values(progressCopy[locale]).every((v) => v.trim()));
  }
});

void test('editorial ratings and human evidence are explicit and replay-safe', () => {
  for (const p of problems) {
    for (const rating of Object.values(p.rating))
      assert.ok(Number.isInteger(rating) && rating >= 1 && rating <= 5);
    for (const m of p.humanMilestones) {
      assert.ok(
        Number.isInteger(m.year) && m.year <= Number(p.reviewed.slice(0, 4)),
      );
      assert.ok(['partial', 'achieved'].includes(m.status));
      for (const locale of locales)
        assert.ok(m.headline[locale].trim() && m.summary[locale].trim());
      assert.ok(m.sources.length);
      for (const source of m.sources)
        assert.equal(new URL(source.url).protocol, 'https:');
    }
  }
});
