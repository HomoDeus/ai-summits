import assert from 'node:assert/strict';
import test from 'node:test';
import {
  worldPeaks,
  worldProvinces,
  terrainHeight,
  regionAt,
  tileKeys,
  TILE_SIZE,
  TILE_RADIUS,
} from '../lib/terrain-world.ts';
import { problems, disciplines } from '../lib/catalog.ts';
import { terrainCopy } from '../lib/terrain-copy.ts';
import { locales } from '../lib/types.ts';
void test('3D world places every named summit in its discipline with its rated elevation', () => {
  assert.equal(worldPeaks.length, problems.length);
  assert.equal(worldProvinces.length, disciplines.length);
  assert.equal(
    new Set(worldPeaks.map((p) => `${p.x},${p.z}`)).size,
    problems.length,
  );
  for (const peak of worldPeaks) {
    assert.equal(
      worldProvinces[regionAt(peak.x, peak.z)]?.domain.id,
      peak.problem.discipline,
    );
    assert.equal(terrainHeight(peak.x, peak.z), peak.height);
    assert.ok(
      Number.isInteger(peak.x) && Number.isInteger(peak.z),
      'Summits align with mesh vertices',
    );
  }
});
void test('unknown terrain continues in every direction and resident tiles remain bounded', () => {
  for (const [x, z] of [
    [0, 0],
    [10000, -20000],
    [-5000, 5000],
  ]) {
    const keys = tileKeys(x, z);
    assert.equal(keys.length, (TILE_RADIUS * 2 + 1) ** 2);
    assert.equal(new Set(keys.map((k) => `${k.x},${k.z}`)).size, keys.length);
    assert.ok(
      keys.some(
        (k) =>
          k.x === Math.floor(x / TILE_SIZE) &&
          k.z === Math.floor(z / TILE_SIZE),
      ),
    );
    assert.ok(Number.isFinite(terrainHeight(x, z)));
  }
  assert.equal(regionAt(10000, -20000), -1);
  assert.equal(regionAt(-5000, 5000), -1);
  assert.notEqual(terrainHeight(10000, -20000), terrainHeight(10003, -20002));
});
void test('height sampling is deterministic and continuous at streamed tile edges', () => {
  for (const x of [-64, -32, 0, 32, 64])
    for (const z of [-20, 0, 20]) {
      assert.equal(terrainHeight(x, z), terrainHeight(x, z));
      assert.ok(
        Math.abs(terrainHeight(x - 1e-5, z) - terrainHeight(x + 1e-5, z)) <
          0.002,
      );
    }
  for (const locale of locales)
    assert.deepEqual(
      Object.keys(terrainCopy[locale]).sort(),
      Object.keys(terrainCopy.en).sort(),
    );
});
