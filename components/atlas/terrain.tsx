'use client';
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, RotateCw, LocateFixed } from 'lucide-react';
import { problems as catalog, statusAt, statusColors } from '@/lib/catalog';
import { messages } from '@/lib/i18n';
import type { Locale, Problem } from '@/lib/types';

type Point = { x: number; y: number; depth: number };
type Peak = {
  problem: Problem;
  x: number;
  z: number;
  height: number;
  number: number;
};
// Coordinates and heights are intentionally illustrative, never scientific scores.
function arrange(items: Problem[]): Peak[] {
  const columns = Math.ceil(Math.sqrt(items.length * 1.4));
  const rows = Math.ceil(items.length / columns);
  return items.map((problem, i) => ({
    problem,
    x: ((i % columns) - (columns - 1) / 2) * 3.5,
    z: (Math.floor(i / columns) - (rows - 1) / 2) * 3.6,
    height:
      1.8 + ((catalog.findIndex((p) => p.id === problem.id) * 7) % 9) / 10,
    number: catalog.findIndex((p) => p.id === problem.id) + 1,
  }));
}
export function Terrain({
  items,
  locale,
  year,
  selected,
  onSelect,
}: {
  items: Problem[];
  locale: Locale;
  year: number;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [angle, setAngle] = useState(-0.22),
    [zoom, setZoom] = useState(1);
  const [markers, setMarkers] = useState<(Point & { peak: Peak })[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const t = messages[locale];
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const peaks = arrange(items);
    let frame = 0;
    const render = () => {
      const width = element.clientWidth,
        height = element.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = width * ratio;
      element.height = height * ratio;
      const ctx = element.getContext('2d');
      if (!ctx) {
        setUnavailable(true);
        return;
      }
      ctx.scale(ratio, ratio);
      const spanX = Math.max(7, ...peaks.map((p) => Math.abs(p.x) + 2.5));
      const spanZ = Math.max(5, ...peaks.map((p) => Math.abs(p.z) + 2.5));
      const scale =
        Math.min(width / (spanX * 2.7), height / (spanZ * 1.4 + 6)) * zoom;
      const project = (x: number, y: number, z: number): Point => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle),
          rz = x * Math.sin(angle) + z * Math.cos(angle);
        return {
          x: width / 2 + rx * scale,
          y: height * 0.57 + rz * scale * 0.46 - y * scale * 0.88,
          depth: rz,
        };
      };
      const surface = (x: number, z: number) => {
        let h = 0.04,
          nearest = peaks[0],
          distance = Infinity;
        for (const peak of peaks) {
          const d = (x - peak.x) ** 2 + (z - peak.z) ** 2;
          h += peak.height * Math.exp(-d / 1.5);
          if (d < distance) {
            distance = d;
            nearest = peak;
          }
        }
        return { h, nearest };
      };
      const cells: {
        points: Point[];
        h: number;
        peak?: Peak;
        depth: number;
        shade: number;
      }[] = [];
      const step = 0.42;
      for (let z = -spanZ; z < spanZ; z += step)
        for (let x = -spanX; x < spanX; x += step) {
          const corners = [
            [x, z],
            [x + step, z],
            [x + step, z + step],
            [x, z + step],
          ].map(([a, b]) => project(a, surface(a, b).h, b));
          const s = surface(x + step / 2, z + step / 2);
          const gradient = surface(x + step, z).h - surface(x, z).h;
          cells.push({
            points: corners,
            h: s.h,
            peak: s.nearest,
            depth: project(x, 0, z).depth,
            shade: gradient * 10,
          });
        }
      cells.sort((a, b) => a.depth - b.depth);
      for (const cell of cells) {
        const status = cell.peak ? statusAt(cell.peak.problem, year) : 'open';
        const hue =
          status === 'achieved' ? 153 : status === 'partial' ? 36 : 210;
        const light = Math.max(8, Math.min(54, 13 + cell.h * 10 + cell.shade));
        ctx.beginPath();
        cell.points.forEach((p, i) =>
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
        );
        ctx.closePath();
        ctx.fillStyle = `hsl(${hue} ${status === 'open' ? 21 : 30}% ${light}%)`;
        ctx.fill();
        ctx.strokeStyle =
          status === 'open'
            ? '#96b6d32a'
            : status === 'partial'
              ? '#d4af6438'
              : '#a8e9b638';
        ctx.lineWidth = 0.55;
        ctx.stroke();
      }
      const positions = peaks.map((peak) => ({
        ...project(peak.x, surface(peak.x, peak.z).h, peak.z),
        peak,
      }));
      for (const marker of positions) {
        const color = statusColors[statusAt(marker.peak.problem, year)];
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(marker.x, marker.y);
        ctx.lineTo(marker.x, marker.y - 22);
        ctx.stroke();
        if (statusAt(marker.peak.problem, year) !== 'open') {
          ctx.beginPath();
          ctx.moveTo(marker.x, marker.y - 22);
          ctx.lineTo(marker.x + 12, marker.y - 18);
          ctx.lineTo(marker.x, marker.y - 14);
          ctx.fillStyle = color;
          ctx.fill();
        }
        if (marker.peak.problem.id === selected) {
          ctx.beginPath();
          ctx.ellipse(marker.x, marker.y + 3, 17, 6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.stroke();
        }
      }
      setMarkers(positions);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    schedule();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [items, angle, zoom, year, selected]);
  return (
    <div className="terrain-wrap">
      <div
        className="terrain-stage"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          drag.current = { x: e.clientX, angle };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setAngle(drag.current.angle + (e.clientX - drag.current.x) * 0.005);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <canvas ref={canvas} aria-hidden="true" />
        <p className="sr-only">{t.terrainDescription}</p>
        {unavailable && <p className="terrain-error">{t.mapUnavailable}</p>}
        {markers.map(({ x, y, peak }) => (
          <button
            key={peak.problem.id}
            className={`peak-marker ${selected === peak.problem.id ? 'active' : ''}`}
            style={{
              left: x,
              top: y - 28,
              color: statusColors[statusAt(peak.problem, year)],
            }}
            aria-pressed={selected === peak.problem.id}
            aria-label={`${t.peak} ${peak.number}: ${peak.problem.title[locale]}`}
            title={peak.problem.title[locale]}
            onClick={() => onSelect(peak.problem.id)}
          >
            <span>{String(peak.number).padStart(2, '0')}</span>
            <b>{peak.problem.title[locale]}</b>
          </button>
        ))}
      </div>
      <div className="terrain-controls">
        <span>{t.instructions}</span>
        <div>
          <button
            aria-label={t.rotateLeft}
            onClick={() => setAngle((v) => v - 0.2)}
          >
            <RotateCcw size={16} />
          </button>
          <button
            aria-label={t.rotateRight}
            onClick={() => setAngle((v) => v + 0.2)}
          >
            <RotateCw size={16} />
          </button>
          <button
            aria-label={t.zoomOut}
            onClick={() => setZoom((v) => Math.max(0.6, v - 0.15))}
          >
            <Minus size={16} />
          </button>
          <button
            aria-label={t.zoomIn}
            onClick={() => setZoom((v) => Math.min(1.6, v + 0.15))}
          >
            <Plus size={16} />
          </button>
          <button
            aria-label={t.reset}
            onClick={() => {
              setAngle(-0.22);
              setZoom(1);
            }}
          >
            <LocateFixed size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
