'use client';
import { useRef, useState } from 'react';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import {
  disciplines,
  problems,
  milestoneAt,
  statusAt,
  statusColors,
} from '@/lib/catalog';
import { messages } from '@/lib/i18n';
import { progressCopy } from '@/lib/progress';
import type { Locale } from '@/lib/types';

// Fixed positions preserve the atlas across filters, selections and time.
const WIDTH = 2520,
  HEIGHT = 1580;
const regions = disciplines.map((domain, i) => ({
  domain,
  x: 40 + (i % 6) * 415,
  y: 65 + Math.floor(i / 6) * 370,
}));
export function Terrain({
  locale,
  year,
  selected,
  matches,
  onSelect,
}: {
  locale: Locale;
  year: number;
  selected: string;
  matches: string[];
  onSelect: (id: string) => void;
}) {
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const drag = useRef<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    scale: number;
    moved: boolean;
  } | null>(null);
  const t = messages[locale],
    copy = progressCopy[locale];
  const selectedProblem = problems.find((p) => p.id === selected);
  const latest = selectedProblem
    ? milestoneAt(selectedProblem, year)
    : undefined;
  function zoom(delta: number) {
    setCamera((c) => ({
      ...c,
      zoom: Math.max(1, Math.min(3.5, c.zoom + delta)),
    }));
  }
  return (
    <div className="world-map">
      <svg
        className="world-svg"
        viewBox={`${WIDTH / 2 - WIDTH / camera.zoom / 2 + camera.x} ${HEIGHT / 2 - HEIGHT / camera.zoom / 2 + camera.y} ${WIDTH / camera.zoom} ${HEIGHT / camera.zoom}`}
        aria-label={t.terrain}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('[data-peak]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            cx: camera.x,
            cy: camera.y,
            scale:
              Math.min(rect.width / WIDTH, rect.height / HEIGHT) * camera.zoom,
            moved: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          d.moved = true;
          setCamera((c) => ({
            ...c,
            x: Math.max(
              -WIDTH / 2,
              Math.min(WIDTH / 2, d.cx - (e.clientX - d.x) / d.scale),
            ),
            y: Math.max(
              -HEIGHT / 2,
              Math.min(HEIGHT / 2, d.cy - (e.clientY - d.y) / d.scale),
            ),
          }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <pattern
            id="world-grid"
            width="70"
            height="70"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M70 0H0V70"
              fill="none"
              stroke="#7aabb9"
              strokeOpacity=".07"
            />
          </pattern>
          <radialGradient id="world-light">
            <stop stopColor="#244e57" stopOpacity=".55" />
            <stop offset="1" stopColor="#102633" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          x="-2520"
          y="-1380"
          width="7560"
          height="4140"
          fill="url(#world-grid)"
        />
        <ellipse
          cx="1260"
          cy="660"
          rx="1350"
          ry="760"
          fill="url(#world-light)"
        />
        {regions.map(({ domain, x, y }) => {
          const peaks = problems.filter((p) => p.discipline === domain.id);
          return (
            <g key={domain.id} transform={`translate(${x} ${y})`}>
              <path
                d="M10 105L80 53L230 37L365 100L381 206L289 257L111 243L0 179Z"
                fill="#183642"
                stroke="#507883"
                strokeOpacity=".3"
              />
              <path
                d="M23 115L88 72L225 56L346 107L358 196L284 233L115 225L21 174Z"
                fill="none"
                stroke="#7ba4a9"
                strokeOpacity=".12"
              />
              <text
                x="185"
                y="-8"
                textAnchor="middle"
                fill="#93b4bf"
                fontSize="21"
                letterSpacing="1.2"
              >
                {domain.name[locale]}
              </text>
              {peaks.map((p, i) => {
                const px =
                  peaks.length === 1
                    ? 185
                    : peaks.length === 2
                      ? 93 + i * 185
                      : [75, 285, 180][i];
                const py = peaks.length < 3 ? 164 : [130, 130, 235][i];
                const active = p.id === selected;
                const match = matches.includes(p.id);
                const status = statusAt(p, year);
                const color = statusColors[status];
                const m = milestoneAt(p, year);
                return (
                  <g
                    key={p.id}
                    transform={`translate(${px} ${py})`}
                    opacity={match || active ? 1 : 0.28}
                  >
                    {active && (
                      <ellipse
                        cy="9"
                        rx="100"
                        ry="31"
                        fill="#87edbd"
                        opacity=".12"
                        stroke="#99ffd2"
                        strokeWidth="2"
                      />
                    )}
                    <path
                      d="M-91 8L-39-35L-17-19L5-107L35-49L54-64L92 13L19 35Z"
                      fill="#274951"
                    />
                    <path
                      d="M-91 8L5-107L-8-3L19 35Z"
                      fill={
                        status === 'achieved'
                          ? '#427f68'
                          : status === 'partial'
                            ? '#786644'
                            : '#46616e'
                      }
                    />
                    <path
                      d="M5-107L35-49L92 13L19 35L-8-3Z"
                      fill={
                        status === 'achieved'
                          ? '#285948'
                          : status === 'partial'
                            ? '#4d493b'
                            : '#2c4553'
                      }
                    />
                    <path
                      d="M5-107L-17-19L-8-3Z"
                      fill={
                        status === 'achieved'
                          ? '#7aba94'
                          : status === 'partial'
                            ? '#b69c6c'
                            : '#758d98'
                      }
                    />
                    <path
                      d="M-45 17L-21-11L-12-44L5-107"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeDasharray={status === 'open' ? '5 6' : undefined}
                      fill="none"
                    />
                    {status === 'partial' && (
                      <path
                        d="M-12-44L5-107"
                        stroke="#203744"
                        strokeWidth="4"
                        strokeDasharray="5 5"
                        fill="none"
                      />
                    )}
                    <circle
                      cx={
                        status === 'achieved'
                          ? 5
                          : status === 'partial'
                            ? -12
                            : -45
                      }
                      cy={
                        status === 'achieved'
                          ? -107
                          : status === 'partial'
                            ? -44
                            : 17
                      }
                      r="5"
                      fill={color}
                    />
                    {status === 'achieved' && (
                      <path
                        d="M5-107V-139L34-131L5-122"
                        stroke={color}
                        strokeWidth="3"
                        fill={color}
                      />
                    )}
                    <foreignObject x="-100" y="28" width="200" height="94">
                      <button
                        data-peak={p.id}
                        className={`world-peak ${active ? 'active' : ''}`}
                        aria-pressed={active}
                        onClick={() => onSelect(p.id)}
                        style={{ borderColor: active ? color : undefined }}
                      >
                        <strong>{p.title[locale]}</strong>
                        <span style={{ color }}>
                          {m ? `${m.year} · ${t[status]}` : t.open}
                        </span>
                      </button>
                    </foreignObject>
                    <path
                      data-peak={p.id}
                      d="M-95 20L5-115L96 20Z"
                      fill="transparent"
                      className="mountain-hit"
                      onClick={() => onSelect(p.id)}
                      aria-hidden="true"
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="world-tools">
        <button onClick={() => zoom(0.4)} aria-label={t.zoomIn}>
          <Plus size={18} />
        </button>
        <button onClick={() => zoom(-0.4)} aria-label={t.zoomOut}>
          <Minus size={18} />
        </button>
        <button
          onClick={() => setCamera({ x: 0, y: 0, zoom: 1 })}
          aria-label={t.reset}
        >
          <LocateFixed size={18} />
        </button>
        <span>{Math.round(camera.zoom * 100)}%</span>
      </div>
      {selectedProblem && (
        <div className="world-selection" aria-live="polite">
          <a href="#details">
            <strong>{selectedProblem.title[locale]}</strong>
            <span>↗</span>
          </a>
          <p>
            <b>{copy.now}</b>
            {latest ? `${latest.year} · ${latest.headline[locale]}` : copy.none}
          </p>
          <p>
            <b>{latest?.status === 'achieved' ? copy.reached : copy.next}</b>
            {selectedProblem.frontier[locale]}
          </p>
        </div>
      )}
    </div>
  );
}
