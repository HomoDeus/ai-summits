'use client';
import { useRef, useState } from 'react';
import { Minus, Plus, LocateFixed, PersonStanding, Bot } from 'lucide-react';
import {
  disciplines,
  problems,
  milestoneAt,
  statusAt,
  statusColors,
} from '@/lib/catalog';
import { messages } from '@/lib/i18n';
import { progressCopy } from '@/lib/progress';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  province,
  peakHeight,
  humanAt,
  camp,
  atlasCopy,
} from '@/lib/map-model';
import type { Locale } from '@/lib/types';

const WIDTH = MAP_WIDTH,
  HEIGHT = MAP_HEIGHT;
const regions = disciplines.map((domain, i) => ({ domain, ...province(i) }));
function MountainShape({
  height,
  ghost = false,
}: {
  height: number;
  ghost?: boolean;
}) {
  return (
    <g opacity={ghost ? 0.38 : 1}>
      <path
        d={`M-90 12L-48 ${-height * 0.3}L-27 ${-height * 0.22}L4 ${-height}L38 ${-height * 0.4}L57 ${-height * 0.55}L92 16L18 36Z`}
        fill={ghost ? '#4d676c' : '#476664'}
      />
      <path
        d={`M-90 12L4 ${-height}L-12 6L18 36Z`}
        fill={ghost ? '#67827e' : '#819785'}
      />
      <path
        d={`M4 ${-height}L92 16L18 36L-12 6Z`}
        fill={ghost ? '#3f5a60' : '#365452'}
      />
      <path
        d={`M4 ${-height}L-27 ${-height * 0.22}L-12 6Z`}
        fill={ghost ? '#8a9b90' : '#b3c1a3'}
      />
      {height > 140 && !ghost && (
        <path
          d={`M4 ${-height}L-9 ${-height * 0.64}L3 ${-height * 0.72}L12 ${-height * 0.65}L20 ${-height * 0.72}Z`}
          fill="#e0e8d7"
        />
      )}
    </g>
  );
}
function Climber({
  kind,
  height,
  status,
  label,
}: {
  kind: 'human' | 'ai';
  height: number;
  status?: 'partial' | 'achieved';
  label: string;
}) {
  const pos = camp(status),
    x = -51 + pos * 55 + (kind === 'human' ? -12 : 13),
    y = 19 - pos * (height + 19),
    color = kind === 'human' ? '#ffc885' : '#82e5ef';
  const Icon = kind === 'human' ? PersonStanding : Bot;
  return (
    <g transform={`translate(${x} ${y})`} data-climber={kind}>
      <title>{label}</title>
      <ellipse cy="3" rx="12" ry="5" fill="#061b26" opacity=".6" />
      <Icon
        x={-12}
        y={-27}
        width={24}
        height={27}
        color={color}
        strokeWidth={2.8}
      />
      {!status && (
        <text x="9" y="-24" fill={color} fontSize="17" fontWeight="700">
          ?
        </text>
      )}
    </g>
  );
}
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
    copy = progressCopy[locale],
    key = atlasCopy[locale];
  const selectedProblem = problems.find((p) => p.id === selected);
  const latest = selectedProblem
    ? milestoneAt(selectedProblem, year)
    : undefined;
  const human = selectedProblem ? humanAt(selectedProblem, year) : undefined;
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
        <g className="province-layer">
          {regions.map(({ domain, points }, i) => (
            <polygon
              key={domain.id}
              data-province={domain.id}
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill={
                [
                  '#203f48',
                  '#29474c',
                  '#243d49',
                  '#344a49',
                  '#24464a',
                  '#2e424b',
                ][i % 6]
              }
              stroke="#87a7a1"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          ))}
        </g>
        {regions.map(({ domain, x, y, width }, regionIndex) => {
          const peaks = problems.filter((p) => p.discipline === domain.id);
          return (
            <g key={domain.id} transform={`translate(${x} ${y})`}>
              <defs>
                <clipPath id={`province-${domain.id}`}>
                  <polygon
                    points={regions[regionIndex].points
                      .map((p) => `${p.x - x},${p.y - y}`)
                      .join(' ')}
                  />
                </clipPath>
              </defs>
              <g
                aria-hidden="true"
                data-unnamed-region={domain.id}
                clipPath={`url(#province-${domain.id})`}
              >
                {[
                  [55, 90],
                  [width - 65, 95],
                  [width * 0.46, 100],
                  [42, 330],
                  [width - 45, 330],
                  [width * 0.35, 360],
                  [width * 0.66, 360],
                ].map(([gx, gy], i) => (
                  <g
                    key={i}
                    transform={`translate(${gx} ${gy}) scale(${0.27 + (i % 3) * 0.1})`}
                  >
                    <MountainShape
                      height={80 + ((i * 31 + regionIndex * 13) % 90)}
                      ghost
                    />
                  </g>
                ))}
              </g>
              <text
                x={width / 2}
                y="34"
                textAnchor="middle"
                fill="#b6ccc8"
                fontSize="23"
                letterSpacing="1.1"
              >
                {domain.name[locale]}
              </text>
              {peaks.map((p, i) => {
                const px =
                  peaks.length === 1
                    ? width / 2
                    : peaks.length === 2
                      ? width * 0.27 + i * width * 0.46
                      : [100, 300, 200][i];
                const py = peaks.length < 3 ? 236 : [180, 180, 280][i];
                const active = p.id === selected,
                  match = matches.includes(p.id),
                  status = statusAt(p, year),
                  m = milestoneAt(p, year),
                  h = humanAt(p, year),
                  height = peakHeight(p.rating),
                  color = statusColors[status];
                return (
                  <g
                    key={p.id}
                    transform={`translate(${px} ${py})`}
                    opacity={match || active ? 1 : 0.25}
                    data-rated-height={height}
                  >
                    {active && (
                      <ellipse
                        cy="12"
                        rx="105"
                        ry="37"
                        fill="#91e9c4"
                        fillOpacity=".12"
                        stroke="#b4f0cf"
                        strokeWidth="2"
                      />
                    )}
                    <MountainShape height={height} />
                    <path
                      d={`M-51 19L-28 ${-height * 0.22}L-15 ${-height * 0.51}L4 ${-height}`}
                      fill="none"
                      stroke="#f4e8c0"
                      strokeWidth="3"
                      strokeDasharray="5 5"
                    />
                    <Climber
                      kind="human"
                      height={height}
                      status={h?.status}
                      label={`${key.human}: ${h ? h.headline[locale] : key.unknown}`}
                    />
                    <Climber
                      kind="ai"
                      height={height}
                      status={m?.status}
                      label={`${key.ai}: ${m ? m.headline[locale] : key.unknown}`}
                    />
                    {(
                      [
                        { kind: 'human', result: h, color: '#ffc885' },
                        { kind: 'ai', result: m, color: '#82e5ef' },
                      ] as const
                    )
                      .filter((actor) => actor.result?.status === 'achieved')
                      .map((actor) => (
                        <g key={actor.kind} data-conquered={actor.kind}>
                          <title>
                            {`${actor.kind === 'human' ? key.human : key.ai}: ${t.achieved}`}
                          </title>
                          <path
                            d={`M4 ${-height}L${actor.kind === 'human' ? -25 : 16} ${-height - 28}V${-height - 65}`}
                            stroke={actor.color}
                            strokeWidth="3"
                            fill="none"
                          />
                          <path
                            d={`M${actor.kind === 'human' ? -25 : 16} ${-height - 65}h33v25h-33Z`}
                            fill={actor.color}
                          />
                          <text
                            x={actor.kind === 'human' ? -9 : 32}
                            y={-height - 46}
                            textAnchor="middle"
                            fontSize="23"
                            fill="#15313a"
                            fontWeight="800"
                          >
                            ✓
                          </text>
                        </g>
                      ))}
                    <foreignObject x="-101" y="36" width="202" height="90">
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
                      d={`M-95 25L4 ${-height - 12}L96 25Z`}
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
      <div className="atlas-legend">
        <span>
          <PersonStanding size={20} color="#ffc885" />
          {key.human}
        </span>
        <span>
          <Bot size={20} color="#82e5ef" />
          {key.ai}
        </span>
        <span>⚑ ✓ {t.achieved}</span>
        <span>{key.height}</span>
        <span className="unnamed-key">△ △ {key.unnamed}</span>
        <details>
          <summary>{key.legend}</summary>
          <p>{key.unknownText}</p>
          <p>{key.camp}</p>
          <p>{key.ratingNote}</p>
        </details>
      </div>
      {selectedProblem && (
        <div className="world-selection" aria-live="polite">
          <div>
            <a href="#details">
              <strong>{selectedProblem.title[locale]} ↗</strong>
            </a>
            <div className="peak-rating">
              <span>
                {key.difficulty} <b>{selectedProblem.rating.difficulty}/5</b>
              </span>
              <span>
                {key.importance} <b>{selectedProblem.rating.importance}/5</b>
              </span>
              <small>{key.rating}</small>
            </div>
          </div>
          <div className="climber-record human-record">
            <b>
              <PersonStanding size={18} />
              {key.human}
            </b>
            <p>
              {human
                ? `${human.year} · ${human.headline[locale]}`
                : key.unknown}
            </p>
            {human && (
              <details>
                <summary>{key.detail}</summary>
                <p>{human.summary[locale]}</p>
                {human.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.title} ↗
                  </a>
                ))}
              </details>
            )}
          </div>
          <div className="climber-record ai-record">
            <b>
              <Bot size={18} />
              {key.ai}
            </b>
            <p>
              {latest
                ? `${latest.year} · ${latest.headline[locale]}`
                : key.unknown}
            </p>
            {latest && (
              <details>
                <summary>{key.detail}</summary>
                <p>{latest.summary[locale]}</p>
                {latest.sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.title} ↗
                  </a>
                ))}
              </details>
            )}
          </div>
          <p className="world-frontier">
            <b>{latest?.status === 'achieved' ? copy.reached : copy.next}</b>
            {selectedProblem.frontier[locale]}
          </p>
        </div>
      )}
    </div>
  );
}
