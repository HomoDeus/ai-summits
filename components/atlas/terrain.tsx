'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Minus,
  Plus,
  LocateFixed,
  PersonStanding,
  Bot,
  Focus,
  Move,
  Rotate3D,
  Mountain,
} from 'lucide-react';
import { problems, milestoneAt, statusAt } from '@/lib/catalog';
import { messages } from '@/lib/i18n';
import { progressCopy } from '@/lib/progress';
import { humanAt, atlasCopy } from '@/lib/map-model';
import { worldProvinces } from '@/lib/terrain-world';
import { terrainCopy } from '@/lib/terrain-copy';
import type { Locale } from '@/lib/types';
import type { createWorld } from './world-engine';
type Engine = ReturnType<typeof createWorld>;
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
  const host = useRef<HTMLDivElement>(null),
    labels = useRef<HTMLDivElement>(null),
    engine = useRef<Engine | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading'),
    [pan, setPan] = useState(false);
  const latestProps = useRef({ locale, year, selected, matches, onSelect });
  useEffect(() => {
    latestProps.current = { locale, year, selected, matches, onSelect };
    engine.current?.refresh(latestProps.current);
  }, [locale, year, selected, matches, onSelect]);
  useEffect(() => {
    let disposed = false;
    void import('./world-engine')
      .then(({ createWorld }) => {
        if (disposed || !host.current || !labels.current) return;
        try {
          engine.current = createWorld(
            host.current,
            labels.current,
            (id) => latestProps.current.onSelect(id),
            () => setState('failed'),
          );
          engine.current.refresh(latestProps.current);
          setState('ready');
        } catch {
          setState('failed');
        }
      })
      .catch(() => {
        if (!disposed) setState('failed');
      });
    return () => {
      disposed = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);
  const t = messages[locale],
    copy = progressCopy[locale],
    key = atlasCopy[locale],
    sceneCopy = terrainCopy[locale];
  const selectedProblem = problems.find((p) => p.id === selected),
    latest = selectedProblem ? milestoneAt(selectedProblem, year) : undefined,
    human = selectedProblem ? humanAt(selectedProblem, year) : undefined;
  return (
    <div className="world-map world-3d">
      <div className="webgl-viewport" ref={host}>
        <div
          className="world-labels"
          ref={labels}
          style={{ visibility: state === 'ready' ? 'visible' : 'hidden' }}
        >
          {problems.map((p) => (
            <button
              key={p.id}
              data-world-peak={p.id}
              className={`terrain-label ${p.id === selected ? 'selected' : ''}`}
              aria-pressed={p.id === selected}
              title={p.title[locale]}
              onClick={() => onSelect(p.id)}
              onDoubleClick={() => engine.current?.fly(p.id)}
            >
              <i className={statusAt(p, year)} />
              <span>{p.title[locale]}</span>
            </button>
          ))}
          {worldProvinces.map((r) => (
            <span
              key={r.domain.id}
              data-world-region={r.domain.id}
              className="province-label"
            >
              {r.domain.name[locale]}
            </span>
          ))}
          <span data-unknown-label className="unknown-region-label">
            {sceneCopy.unknown}
          </span>
        </div>
        {state !== 'ready' && (
          <div className="terrain-message">
            <Mountain size={38} />
            <p>
              {state === 'loading' ? sceneCopy.loading : sceneCopy.unavailable}
            </p>
            {state === 'failed' && <a href="#index">{t.catalog} ↗</a>}
          </div>
        )}
        <div className="world-tools">
          <button
            disabled={state !== 'ready'}
            onClick={() => engine.current?.zoom(0.75)}
            aria-label={t.zoomIn}
          >
            <Plus size={18} />
          </button>
          <button
            disabled={state !== 'ready'}
            onClick={() => engine.current?.zoom(1.33)}
            aria-label={t.zoomOut}
          >
            <Minus size={18} />
          </button>
          <button
            disabled={state !== 'ready'}
            onClick={() => engine.current?.home()}
            aria-label={sceneCopy.reset}
            title={sceneCopy.reset}
          >
            <LocateFixed size={18} />
          </button>
          <button
            disabled={state !== 'ready'}
            onClick={() => engine.current?.fly(selected)}
            aria-label={sceneCopy.focus}
            title={sceneCopy.focus}
          >
            <Focus size={18} />
          </button>
          <button
            disabled={state !== 'ready'}
            onClick={() => {
              engine.current?.panMode(!pan);
              setPan(!pan);
            }}
            aria-pressed={pan}
            aria-label={sceneCopy.pan}
            title={sceneCopy.pan}
          >
            <Move size={18} />
          </button>
          <button
            disabled={state !== 'ready'}
            onClick={() => engine.current?.tilt()}
            aria-label={sceneCopy.tilt}
            title={sceneCopy.tilt}
          >
            <Rotate3D size={18} />
          </button>
        </div>
        <div className="world-navigation-hint">
          <span className="desktop-hint">{sceneCopy.hint}</span>
          <span className="touch-hint">{sceneCopy.touch}</span>
        </div>
      </div>
      <p className="unknown-terrain-note">{sceneCopy.note}</p>
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
