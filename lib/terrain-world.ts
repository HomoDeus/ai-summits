import { disciplines, problems } from './catalog.ts';
import { MAP_WIDTH, MAP_HEIGHT, province, peakHeight } from './map-model.ts';
export const TILE_SIZE = 32,
  TILE_SEGMENTS = 32,
  TILE_RADIUS = 7;
export const toWorld = (x: number, z: number) => ({
  x: (x - MAP_WIDTH / 2) / 20,
  z: (z - MAP_HEIGHT / 2) / 20,
});
export const worldProvinces = disciplines.map((domain, i) => {
  const region = province(i);
  const points = region.points.map((p) => toWorld(p.x, p.y));
  return {
    domain,
    points,
    center: toWorld(region.x + region.width / 2, region.y + 80),
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minZ: Math.min(...points.map((p) => p.z)),
    maxZ: Math.max(...points.map((p) => p.z)),
  };
});
export const worldPeaks = disciplines.flatMap((d, di) => {
  const region = province(di),
    items = problems.filter((p) => p.discipline === d.id);
  const columns = Math.ceil(Math.sqrt((items.length * region.width) / 420));
  const rows = Math.ceil(items.length / columns);
  return items.map((problem, i) => {
    const row = Math.floor(i / columns);
    const rowCount = Math.min(columns, items.length - row * columns);
    const px =
      region.width / 2 +
      ((i % columns) - (rowCount - 1) / 2) *
        ((region.width - 140) / Math.max(1, columns - 1));
    const pz = rows === 1 ? 240 : 140 + (row * 200) / (rows - 1);
    const at = toWorld(region.x + px, region.y + pz);
    return {
      problem,
      x: Math.round(at.x),
      z: Math.round(at.z),
      height: 4 + peakHeight(problem.rating) / 8,
    };
  });
});
// A height sample only needs peaks whose footprint touches its spatial bucket.
// Unknown terrain remains cheap as the curated catalog grows.
const PEAK_RADIUS = 7.5;
const BUCKET_SIZE = 8;
const peakBuckets = new Map<string, typeof worldPeaks>();
for (const peak of worldPeaks) {
  for (
    let bx = Math.floor((peak.x - PEAK_RADIUS) / BUCKET_SIZE);
    bx <= Math.floor((peak.x + PEAK_RADIUS) / BUCKET_SIZE);
    bx++
  ) {
    for (
      let bz = Math.floor((peak.z - PEAK_RADIUS) / BUCKET_SIZE);
      bz <= Math.floor((peak.z + PEAK_RADIUS) / BUCKET_SIZE);
      bz++
    ) {
      const key = `${bx},${bz}`;
      const bucket = peakBuckets.get(key) ?? [];
      bucket.push(peak);
      peakBuckets.set(key, bucket);
    }
  }
}
function hash(x: number, z: number) {
  const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return v - Math.floor(v);
}
function noise(x: number, z: number) {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz,
    u = fx * fx * (3 - 2 * fx),
    v = fz * fz * (3 - 2 * fz);
  return (
    (hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u) * (1 - v) +
    (hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u) * v
  );
}
export function terrainHeight(x: number, z: number) {
  const broad = 1 - Math.abs(noise(x * 0.055, z * 0.055) * 2 - 1),
    ridge = 1 - Math.abs(noise(x * 0.16 + 20, z * 0.16 - 10) * 2 - 1);
  let height = 1 + broad * 7 + ridge * 3 + noise(x * 0.43, z * 0.43) * 1.5;
  const nearby = peakBuckets.get(
    `${Math.floor(x / BUCKET_SIZE)},${Math.floor(z / BUCKET_SIZE)}`,
  );
  for (const peak of nearby ?? []) {
    const dist = Math.hypot(x - peak.x, z - peak.z);
    if (dist < PEAK_RADIUS)
      height = Math.max(
        height,
        peak.height - (peak.height - 2) * Math.pow(dist / PEAK_RADIUS, 0.85),
      );
  }
  return height;
}
export function regionAt(x: number, z: number) {
  for (let n = 0; n < worldProvinces.length; n++) {
    const r = worldProvinces[n];
    if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
    let inside = false;
    for (let i = 0, j = r.points.length - 1; i < r.points.length; j = i++) {
      const a = r.points[i],
        b = r.points[j];
      if (
        a.z > z !== b.z > z &&
        x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x
      )
        inside = !inside;
    }
    if (inside) return n;
  }
  return -1;
}
export function tileKeys(x: number, z: number) {
  const cx = Math.floor(x / TILE_SIZE),
    cz = Math.floor(z / TILE_SIZE);
  return Array.from({ length: (TILE_RADIUS * 2 + 1) ** 2 }, (_, i) => ({
    x: cx + (i % (TILE_RADIUS * 2 + 1)) - TILE_RADIUS,
    z: cz + Math.floor(i / (TILE_RADIUS * 2 + 1)) - TILE_RADIUS,
  }));
}
