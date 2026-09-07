'use client';
import { useMemo, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import { milestoneAt } from '@/lib/catalog';
import { messages } from '@/lib/i18n';
import { progressCopy, routeAt } from '@/lib/progress';
import type { Locale, Problem } from '@/lib/types';

type Point = { x: number; y: number; depth: number };
// This is an illustrative 3D projection. Geometry encodes no scientific score.
export function Terrain({
  problem,
  locale,
  year,
}: {
  problem: Problem;
  locale: Locale;
  year: number;
}) {
  const [angle, setAngle] = useState(-0.3);
  const t = messages[locale],
    copy = progressCopy[locale];
  const route = routeAt(problem, year);
  const reached = milestoneAt(problem, year)?.status === 'achieved';
  const scene = useMemo(() => {
    const surface = (x: number, z: number) => {
      const main =
        Math.max(0, 1 - Math.sqrt(x * x * 0.95 + z * z * 1.2) / 3.6) * 4.25;
      const shoulder =
        Math.max(0, 1 - Math.sqrt((x + 2.15) ** 2 + (z + 1.3) ** 2) / 2.3) *
        2.15;
      const ridge =
        Math.max(0, 1 - Math.sqrt((x - 2.05) ** 2 + (z + 1.4) ** 2) / 2.4) *
        1.8;
      return Math.max(main, shoulder, ridge) + 0.035 * Math.sin(x * 9 + z * 4);
    };
    const project = (x: number, z: number): Point => {
      const rx = x * Math.cos(angle) - z * Math.sin(angle),
        rz = x * Math.sin(angle) + z * Math.cos(angle);
      return {
        x: 400 + rx * 68,
        y: 365 + rz * 28 - surface(x, z) * 64,
        depth: rz,
      };
    };
    const triangles: { points: string; depth: number; color: string }[] = [];
    const step = 0.25;
    for (let z = -3.75; z < 3.75; z += step)
      for (let x = -4; x < 4; x += step) {
        const a = [x, z],
          b = [x + step, z],
          c = [x + step, z + step],
          d = [x, z + step];
        for (const corners of [
          [a, b, c],
          [a, c, d],
        ]) {
          const points = corners.map(([px, pz]) => project(px, pz));
          const h = surface(x + step / 2, z + step / 2);
          const light = Math.max(
            12,
            Math.min(
              68,
              23 + h * 7 + (surface(x, z) - surface(x + step, z)) * 60,
            ),
          );
          triangles.push({
            points: points.map((p) => `${p.x},${p.y}`).join(' '),
            depth: points.reduce((v, p) => v + p.depth, 0) / 3,
            color: `hsl(${181 + h * 4} ${20 + h * 3}% ${light}%)`,
          });
        }
      }
    triangles.sort((a, b) => a.depth - b.depth);
    const routePoint = (fraction: number) => {
      const x = -2.6 * (1 - fraction),
        z = 2.2 * (1 - fraction);
      return project(x, z);
    };
    return { triangles, routePoint };
  }, [angle]);
  const milestones = route.map((m, i) => ({
    m,
    fraction: reached
      ? (i + 1) / route.length
      : 0.32 + ((i + 1) / (route.length + 1)) * 0.48,
  }));
  const stop = milestones.at(-1)?.fraction ?? 0;
  const path = (from: number, to: number) =>
    Array.from({ length: 41 }, (_, i) => {
      const p = scene.routePoint(from + ((to - from) * i) / 40);
      return `${i ? 'L' : 'M'}${p.x},${p.y - 3}`;
    }).join(' ');
  const summit = scene.routePoint(1);
  return (
    <div className="terrain-wrap">
      <p className="sr-only">
        {copy.route}: {problem.title[locale]}. {copy.note}
      </p>
      <svg className="terrain" viewBox="0 0 1000 480" aria-hidden="true">
        <defs>
          <radialGradient id="terrain-glow">
            <stop stopColor="#226c73" stopOpacity=".25" />
            <stop offset="1" stopColor="#0c202c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="395"
          cy="330"
          rx="370"
          ry="140"
          fill="url(#terrain-glow)"
        />
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={i}
            cx="395"
            cy="370"
            rx={175 + i * 48}
            ry={45 + i * 18}
            fill="none"
            stroke="#6babb8"
            strokeOpacity=".09"
          />
        ))}
        {scene.triangles.map((triangle, i) => (
          <polygon
            key={i}
            points={triangle.points}
            fill={triangle.color}
            stroke={triangle.color}
            strokeWidth=".5"
          />
        ))}
        {!reached && (
          <path
            d={path(stop, 1)}
            fill="none"
            stroke="#d2e2e5"
            strokeWidth="2"
            strokeDasharray="5 7"
            opacity=".8"
          />
        )}
        {stop > 0 && (
          <>
            <path
              d={path(0, stop)}
              fill="none"
              stroke="#5df6c1"
              strokeWidth="12"
              opacity=".13"
            />
            <path
              d={path(0, stop)}
              fill="none"
              stroke="#80ffd0"
              strokeWidth="3"
            />
          </>
        )}
        {!reached && (
          <>
            <circle
              cx={summit.x}
              cy={summit.y - 3}
              r="7"
              fill="#123440"
              stroke="#e7f3f4"
              strokeWidth="2"
            />
            <path
              d={`M${summit.x + 10},${summit.y - 3} L650,78 L685,78`}
              fill="none"
              stroke="#a5c5ce"
              strokeOpacity=".5"
            />
          </>
        )}
        {milestones.map(({ m, fraction }, i) => {
          const p = scene.routePoint(fraction);
          const labelY = reached ? 90 : 330 - i * 115;
          return (
            <g key={m.year}>
              <path
                d={`M${p.x + 10},${p.y - 3} L650,${labelY} L685,${labelY}`}
                fill="none"
                stroke="#7affd0"
                strokeOpacity=".4"
              />
              <circle
                cx={p.x}
                cy={p.y - 3}
                r="15"
                fill="#80ffd0"
                opacity=".13"
              />
              <circle
                cx={p.x}
                cy={p.y - 3}
                r="6"
                fill="#93ffd6"
                stroke="#133b43"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>
      {!reached && (
        <div className="route-label goal" style={{ top: '11%' }}>
          <span>
            <i />
            {copy.unproven}
          </span>
          <strong>{problem.frontier[locale]}</strong>
        </div>
      )}
      {milestones.map(({ m }, i) => (
        <div
          className="route-label"
          key={m.year}
          style={{
            top: `${(((reached ? 90 : 330 - i * 115) - 24) / 480) * 100}%`,
          }}
        >
          <span>
            <i />
            {m.year} · {i === milestones.length - 1 ? copy.now : copy.proven}
          </span>
          <strong>{m.headline[locale]}</strong>
        </div>
      ))}
      {!route.length && <div className="no-route">{copy.none}</div>}
      <div className="terrain-controls">
        <button
          onClick={() => setAngle((v) => Math.max(-0.65, v - 0.15))}
          aria-label={t.rotateLeft}
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setAngle((v) => Math.min(0.1, v + 0.15))}
          aria-label={t.rotateRight}
        >
          <RotateCw size={16} />
        </button>
      </div>
    </div>
  );
}
