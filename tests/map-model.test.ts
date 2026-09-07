import assert from 'node:assert/strict';
import test from 'node:test';
import {
  province,
  peakHeight,
  humanAt,
  camp,
  atlasCopy,
} from '../lib/map-model.ts';
import { problems, disciplines, milestoneAt } from '../lib/catalog.ts';
import { locales } from '../lib/types.ts';
void test('adjacent provinces reuse complete shared border segments, including merged province', () => {
  const edges = disciplines.flatMap((_, i) => {
    const pts = province(i).points;
    return pts.map((a, j) => {
      const b = pts[(j + 1) % pts.length];
      return [JSON.stringify(a), JSON.stringify(b)].sort().join('|');
    });
  });
  const counts = new Map<string, number>();
  for (const e of edges) counts.set(e, (counts.get(e) ?? 0) + 1);
  assert.ok([...counts.values()].filter((n) => n === 2).length >= 60);
  assert.ok([...counts.values()].every((n) => n === 1 || n === 2));
  const merged = province(22);
  assert.equal(merged.points.length, 12);
});
void test('both ratings affect height equally and never encode completion', () => {
  assert.equal(
    peakHeight({ difficulty: 5, importance: 3 }),
    peakHeight({ difficulty: 3, importance: 5 }),
  );
  assert.ok(
    peakHeight({ difficulty: 5, importance: 5 }) >
      peakHeight({ difficulty: 4, importance: 5 }),
  );
  assert.ok(
    peakHeight({ difficulty: 5, importance: 5 }) >
      peakHeight({ difficulty: 5, importance: 4 }),
  );
});
void test('human and AI positions use independent dated records; only achieved reaches the summit', () => {
  const go = problems.find((p) => p.id === 'go')!,
    protein = problems.find((p) => p.id === 'protein-structure')!,
    imo = problems.find((p) => p.id === 'imo-2024')!;
  assert.equal(humanAt(go, 2015), undefined);
  assert.equal(camp(humanAt(go, 2016)?.status), 1);
  assert.equal(camp(milestoneAt(go, 2015)?.status), 0);
  assert.equal(camp(milestoneAt(go, 2016)?.status), 1);
  assert.ok(humanAt(protein, 2015));
  assert.equal(milestoneAt(protein, 2015), undefined);
  assert.equal(humanAt(imo, 2023), undefined);
  assert.equal(camp(humanAt(imo, 2024)?.status), 0.53);
  for (const locale of locales)
    assert.deepEqual(
      Object.keys(atlasCopy[locale]).sort(),
      Object.keys(atlasCopy.en).sort(),
    );
});
