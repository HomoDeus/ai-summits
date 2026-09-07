import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExploration } from '../lib/explore-tool.ts';
void test('agent exploration validates before changing any UI state', () => {
  assert.deepEqual(
    validateExploration({ peak: 'go', year: 2016, locale: 'es' }),
    { peak: 'go', year: 2016, locale: 'es' },
  );
  for (const value of [
    null,
    {},
    { peak: 'unknown', year: 2016, locale: 'en' },
    { peak: 'go', year: 9999, locale: 'en' },
    { peak: 'go', year: 2016, locale: 'fr' },
    { peak: 'go', year: 2016, locale: 'en', extra: true },
  ])
    assert.throws(() => validateExploration(value));
});
