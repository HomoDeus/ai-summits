'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { validateExploration } from '@/lib/explore-tool';
import {
  ArrowUpRight,
  Flag,
  Code2,
  Globe2,
  Mountain,
  Pause,
  Play,
  Search,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Terrain } from '@/components/atlas/terrain';
import {
  disciplines,
  filterProblems,
  FIRST_YEAR,
  LAST_YEAR,
  milestoneAt,
  parseView,
  problems,
  REVIEW_DATE,
  statusAt,
  statusColors,
} from '@/lib/catalog';
import { languageNames, messages } from '@/lib/i18n';
import { locales, type Locale, type Status } from '@/lib/types';
const REPO = 'https://github.com/HomoDeus/ai-summits';
export default function Home() {
  const [locale, setLocale] = useState<Locale>('en'),
    [year, setYear] = useState(LAST_YEAR);
  const [selected, setSelected] = useState('protein-structure'),
    [discipline, setDiscipline] = useState('all'),
    [status, setStatus] = useState('all'),
    [query, setQuery] = useState('');
  const [playing, setPlaying] = useState(false),
    [ready, setReady] = useState(false);
  const t = messages[locale];
  const visible = useMemo(
    () => filterProblems(problems, locale, query, discipline, status, year),
    [locale, query, discipline, status, year],
  );
  const current = visible.find((p) => p.id === selected) ?? visible[0];
  const effectiveSelected = current?.id ?? selected;
  useEffect(() => {
    type Tool = {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: 'explore_summit',
            description:
              'Show a specific catalog problem at a chosen year and language; clears local search filters.',
            inputSchema: {
              type: 'object',
              properties: {
                peak: { type: 'string', enum: problems.map((p) => p.id) },
                year: {
                  type: 'integer',
                  minimum: FIRST_YEAR,
                  maximum: LAST_YEAR,
                },
                locale: { type: 'string', enum: [...locales] },
              },
              required: ['peak', 'year', 'locale'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              const v = validateExploration(input);
              flushSync(() => {
                setLocale(v.locale);
                setYear(v.year);
                setSelected(v.peak);
                setPlaying(false);
                setQuery('');
                setDiscipline('all');
                setStatus('all');
              });
              return {
                ...v,
                status: statusAt(
                  problems.find((p) => p.id === v.peak)!,
                  v.year,
                ),
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {
        /* Optional browser capability; normal controls remain available. */
      });
    } catch {
      /* Unsupported registry must not break the atlas. */
    }
    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const view = parseView(window.location.search);
      setLocale(view.locale);
      setYear(view.year);
      setSelected(view.selected);
      setReady(true);
    });
    const onPop = () => {
      const v = parseView(window.location.search);
      setLocale(v.locale);
      setYear(v.year);
      setSelected(v.selected);
      setPlaying(false);
    };
    window.addEventListener('popstate', onPop);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', onPop);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.title = `AI Summits · ${t.tagline}`;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', locale);
    url.searchParams.set('year', String(year));
    url.searchParams.set('peak', effectiveSelected);
    window.history.replaceState(null, '', url);
  }, [locale, year, effectiveSelected, ready, t.tagline]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setYear((v) => {
          if (v >= LAST_YEAR) {
            setPlaying(false);
            return v;
          }
          return v + 1;
        }),
      1400,
    );
    return () => clearInterval(timer);
  }, [playing]);
  const milestone = current ? milestoneAt(current, year) : undefined;
  const counts = { open: 0, partial: 0, achieved: 0 };
  visible.forEach((p) => counts[statusAt(p, year)]++);
  const choose = (id: string) => {
    setSelected(id);
  };
  const clear = () => {
    setQuery('');
    setDiscipline('all');
    setStatus('all');
  };
  return (
    <main id="top">
      <a href="#index" className="skip-link">
        {t.jump}
      </a>
      <header className="site-header">
        <a className="brand" href="#top">
          <Mountain size={31} strokeWidth={1.3} />
          <span>
            AI SUMMITS<small>{t.tagline}</small>
          </span>
        </a>
        <nav>
          <a href="#index">{t.catalog}</a>
          <a href="#method">{t.about}</a>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            aria-label={t.sourceCode}
          >
            <Code2 size={19} />
          </a>
        </nav>
        <div className="language">
          <Globe2 size={16} />
          <Select
            value={locale}
            onValueChange={(v) => {
              if (locales.includes(v as Locale)) setLocale(v as Locale);
            }}
          >
            <SelectTrigger aria-label={t.language}>
              <SelectValue>{languageNames[locale]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {locales.map((l) => (
                <SelectItem key={l} value={l}>
                  {languageNames[l]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>
      <section className="intro">
        <div>
          <div className="eyebrow">
            {t.edition} <span>/</span> {t.disciplines.toUpperCase()}{' '}
            {disciplines.length}
          </div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="intro-stat">
          <strong>{problems.length.toString().padStart(2, '0')}</strong>
          <span>
            {t.problems}
            <br />
            {t.dateNote} · {REVIEW_DATE}
          </span>
        </div>
      </section>
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input
            aria-label={t.searchLabel}
            placeholder={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Select
          value={discipline}
          onValueChange={(v) => {
            if (v) setDiscipline(v);
          }}
        >
          <SelectTrigger aria-label={t.disciplines}>
            <SelectValue>
              {discipline === 'all'
                ? t.all
                : disciplines.find((d) => d.id === discipline)?.name[locale]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            {disciplines.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name[locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          onValueChange={(v) => {
            if (v) setStatus(v);
          }}
        >
          <SelectTrigger aria-label={t.anyStatus}>
            <SelectValue>
              {status === 'all' ? t.anyStatus : t[status as Status]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.anyStatus}</SelectItem>
            {(['open', 'partial', 'achieved'] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {t[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="result-count" aria-live="polite">
          {visible.length} {t.results}
        </span>
      </div>
      <div className="atlas-layout">
        <section className="map-panel" aria-label={t.terrain}>
          <div className="map-topline">
            <span className="eyebrow">01 / {t.terrain}</span>
            <span className="coordinates">
              {String(year)} · {locale.toUpperCase()}
            </span>
          </div>
          <Terrain
            items={visible}
            locale={locale}
            year={year}
            selected={current?.id ?? ''}
            onSelect={choose}
          />
          {!visible.length && (
            <div className="no-map">
              <p>{t.noResults}</p>
              <button onClick={clear}>{t.clear}</button>
            </div>
          )}
          <div className="legend">
            {(['achieved', 'partial', 'open'] as const).map((s) => (
              <span key={s}>
                <i style={{ background: statusColors[s] }} />
                {t[s]} <b>{counts[s]}</b>
              </span>
            ))}
          </div>
          <p className="shape-note">{t.shapeNote}</p>
          <div className="timeline">
            <button
              className="replay"
              onClick={() => {
                if (!playing && year === LAST_YEAR) setYear(FIRST_YEAR);
                setPlaying((v) => !v);
              }}
              aria-label={playing ? t.pause : t.replay}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
              <span>{playing ? t.pause : t.replay}</span>
            </button>
            <div className="time-range">
              <div>
                <span>{FIRST_YEAR}</span>
                <strong>{year}</strong>
                <span>{LAST_YEAR}</span>
              </div>
              <Slider
                aria-label={t.year}
                value={[year]}
                min={FIRST_YEAR}
                max={LAST_YEAR}
                step={1}
                onValueChange={(value) => {
                  setPlaying(false);
                  setYear(Array.isArray(value) ? value[0] : value);
                }}
              />
            </div>
            <div className="time-stat">
              <strong>{counts.partial + counts.achieved}</strong>
              <span>{t.recorded}</span>
            </div>
          </div>
        </section>
        <aside className="details" aria-label={t.selected} aria-live="polite">
          {current ? (
            <>
              <span className="eyebrow">
                {t.peak}{' '}
                {String(problems.indexOf(current) + 1).padStart(2, '0')}{' '}
                <span>/</span>{' '}
                {
                  disciplines.find((d) => d.id === current.discipline)?.name[
                    locale
                  ]
                }
              </span>
              <h2>{current.title[locale]}</h2>
              <span
                className="status"
                style={{ color: statusColors[statusAt(current, year)] }}
              >
                <Flag size={13} />
                {t[statusAt(current, year)]}
              </span>
              <h3>{t.question}</h3>
              <p>{current.question[locale]}</p>
              <div className="detail-rule" />
              <h3>
                {t.evidence} {milestone && <span>· {milestone.year}</span>}
              </h3>
              {milestone ? (
                <>
                  <p>{milestone.summary[locale]}</p>
                  <div className="evidence-meta">
                    <span>{milestone.system}</span>
                    <span>{t[milestone.evidence]}</span>
                  </div>
                </>
              ) : (
                <p className="muted">{t.noMilestone}</p>
              )}
              <h3>{t.boundary}</h3>
              <p className="boundary">{current.boundary[locale]}</p>
              <h3>{t.sources}</h3>
              <div className="sources">
                {Array.from(
                  new Map(
                    [...current.sources, ...(milestone?.sources ?? [])].map(
                      (s) => [s.url, s],
                    ),
                  ).values(),
                ).map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
              <small>
                {t.reviewed} · {current.reviewed}
              </small>
            </>
          ) : (
            <p>{t.noResults}</p>
          )}
        </aside>
      </div>
      <p className="historical">{t.historical}</p>
      <section id="index" className="index-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / {t.catalog}</span>
            <h2>{t.fullIndex}</h2>
          </div>
          <span>
            {visible.length} / {problems.length}
          </span>
        </div>
        <div className="problem-grid">
          {visible.map((p) => {
            const s = statusAt(p, year);
            return (
              <button
                className={`problem-card ${p.id === current?.id ? 'selected' : ''}`}
                key={p.id}
                onClick={() => {
                  choose(p.id);
                  document.querySelector('.atlas-layout')?.scrollIntoView({
                    behavior: window.matchMedia(
                      '(prefers-reduced-motion: reduce)',
                    ).matches
                      ? 'instant'
                      : 'smooth',
                    block: 'start',
                  });
                }}
                aria-label={`${t.inspect}: ${p.title[locale]}`}
                aria-pressed={p.id === current?.id}
              >
                <div>
                  <span className="card-number">
                    {String(problems.indexOf(p) + 1).padStart(2, '0')}
                  </span>
                  <span className="card-domain">
                    {
                      disciplines.find((d) => d.id === p.discipline)?.name[
                        locale
                      ]
                    }
                  </span>
                  <ArrowUpRight size={16} />
                </div>
                <h3>{p.title[locale]}</h3>
                <p>{p.question[locale]}</p>
                <span
                  className="card-status"
                  style={{ color: statusColors[s] }}
                >
                  <i />
                  {t[s]}{' '}
                  {milestoneAt(p, year)?.year && (
                    <b>· {milestoneAt(p, year)?.year}</b>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {!visible.length && (
          <div className="empty">
            <p>{t.noResults}</p>
            <button onClick={clear}>{t.clear}</button>
          </div>
        )}
      </section>
      <section id="method" className="method">
        <div>
          <span className="eyebrow">03 / {t.about}</span>
          <h2>{t.principles}</h2>
          <p>{t.method}</p>
          <p className="muted">{t.scope}</p>
        </div>
        <div className="contribute">
          <Mountain size={34} strokeWidth={1} />
          <h3>{t.contribute}</h3>
          <p>{t.contributionText}</p>
          <a
            href={`${REPO}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
          >
            {t.contributeButton}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>
      <footer>
        <span>
          AI SUMMITS <span className="muted">/ 2026</span>
        </span>
        <a href={`${REPO}/blob/main/LICENSE`}>MIT License</a>
        <span>{languageNames[locale]}</span>
      </footer>
    </main>
  );
}
