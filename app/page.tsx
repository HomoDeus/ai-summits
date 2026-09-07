'use client';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { validateExploration } from '@/lib/explore-tool';
import {
  ArrowUpRight,
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
} from '@/lib/catalog';
import { progressCopy, routeAt } from '@/lib/progress';
import { languageNames, messages } from '@/lib/i18n';
import { locales, type Locale } from '@/lib/types';
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
  const copy = progressCopy[locale];
  const route = current ? routeAt(current, year) : [];
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
          <Mountain size={28} />
          <span>
            AI SUMMITS<small>{t.tagline}</small>
          </span>
        </a>
        <nav>
          <a href="#method">{t.about}</a>
          <a href={REPO} target="_blank" rel="noreferrer">
            <Code2 size={17} />
            <span>GitHub</span>
          </a>
          <Select
            value={locale}
            onValueChange={(v) => v && setLocale(v as Locale)}
          >
            <SelectTrigger aria-label={t.language} className="language-select">
              <Globe2 size={16} />
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
        </nav>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">THE OPEN FRONTIER ATLAS</p>
          <h1>{copy.brief}</h1>
        </div>
        <p>
          {problems.length} {copy.records}
          <br />
          {disciplines.length} {t.disciplines} · {REVIEW_DATE}
        </p>
      </section>
      <div className="workspace">
        <aside className="browser" id="index">
          <div className="browser-top">
            <h2>{copy.explore}</h2>
            <label className="search">
              <Search size={18} />
              <input
                aria-label={t.searchLabel}
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <Select
              value={discipline}
              onValueChange={(v) => v && setDiscipline(v)}
            >
              <SelectTrigger aria-label={t.all}>
                <SelectValue>
                  {discipline === 'all'
                    ? t.all
                    : disciplines.find((d) => d.id === discipline)?.name[
                        locale
                      ]}
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
            <div className="status-filters" aria-label={copy.filter}>
              {(['all', 'partial', 'achieved', 'open'] as const).map((s) => (
                <button
                  key={s}
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                >
                  {s === 'all' ? copy.all : t[s]}
                </button>
              ))}
            </div>
            <small>
              {visible.length} {t.results}
            </small>
          </div>
          <div className="challenge-list">
            {visible.map((p) => {
              const m = milestoneAt(p, year);
              return (
                <button
                  key={p.id}
                  className={`challenge ${current?.id === p.id ? 'selected' : ''}`}
                  aria-pressed={current?.id === p.id}
                  onClick={() => choose(p.id)}
                >
                  <span className="challenge-domain">
                    {
                      disciplines.find((d) => d.id === p.discipline)?.name[
                        locale
                      ]
                    }
                  </span>
                  <strong>{p.title[locale]}</strong>
                  <span className="challenge-result">
                    <i className={statusAt(p, year)} />
                    {m ? `${m.year} · ${m.headline[locale]}` : copy.none}
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
        </aside>
        <section className="inspector" aria-label={copy.selected}>
          {current ? (
            <>
              <div className="problem-heading">
                <div className="eyebrow">
                  {
                    disciplines.find((d) => d.id === current.discipline)?.name[
                      locale
                    ]
                  }
                  <span className={`status-pill ${statusAt(current, year)}`}>
                    {t[statusAt(current, year)]}
                  </span>
                </div>
                <h2>{current.title[locale]}</h2>
                <p>{current.question[locale]}</p>
              </div>
              <div className="progress-brief" aria-live="polite">
                <div className="now">
                  <span className="eyebrow">
                    <span className="dot" />
                    {copy.now}
                    {milestone && <b>{milestone.year}</b>}
                  </span>
                  <h3>{milestone?.headline[locale] ?? copy.none}</h3>
                  <p>{milestone?.summary[locale] ?? t.noMilestone}</p>
                  {milestone && (
                    <span className="evidence-label">
                      {milestone.system} · {t[milestone.evidence]}
                    </span>
                  )}
                </div>
                <div className="next">
                  <span className="eyebrow">
                    {milestone?.status === 'achieved'
                      ? copy.reached
                      : copy.next}
                    <ArrowUpRight size={17} />
                  </span>
                  <h3>{current.frontier[locale]}</h3>
                  <p>{current.boundary[locale]}</p>
                </div>
              </div>
              <div className="map-panel">
                <div className="map-heading">
                  <span>{copy.route}</span>
                  <span>
                    {year} / {LAST_YEAR}
                  </span>
                </div>
                <Terrain problem={current} locale={locale} year={year} />
                <p className="map-note">{copy.note}</p>
                <div className="time-controls">
                  <button
                    aria-label={playing ? t.pause : t.replay}
                    onClick={() => {
                      if (year === LAST_YEAR) setYear(FIRST_YEAR);
                      setPlaying(!playing);
                    }}
                  >
                    {playing ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <span>{copy.years}</span>
                  <strong>{year}</strong>
                  <Slider
                    min={FIRST_YEAR}
                    max={LAST_YEAR}
                    step={1}
                    value={[year]}
                    aria-label={t.year}
                    onValueChange={(v) => {
                      setPlaying(false);
                      setYear(Array.isArray(v) ? v[0] : v);
                    }}
                  />
                  <button
                    className="latest-year"
                    onClick={() => {
                      setYear(LAST_YEAR);
                      setPlaying(false);
                    }}
                  >
                    {LAST_YEAR}
                  </button>
                </div>
              </div>
              <section className="evidence-trail">
                <div className="section-heading">
                  <h3>{copy.history}</h3>
                  <span>{copy.context}</span>
                </div>
                {route.length ? (
                  route.map((m, i) => (
                    <article
                      className={`evidence-row ${i === route.length - 1 ? 'current' : ''}`}
                      key={m.year}
                    >
                      <div className="evidence-year">
                        {m.year}
                        <span>
                          {i === route.length - 1 ? copy.latest : copy.previous}
                        </span>
                      </div>
                      <div>
                        <h4>{m.headline[locale]}</h4>
                        <p>{m.summary[locale]}</p>
                        <div className="source-links">
                          <span>
                            {m.system} · {t[m.evidence]}
                          </span>
                          {m.sources.map((source) => (
                            <a
                              href={source.url}
                              key={source.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title}
                              <ArrowUpRight size={14} />
                            </a>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-history">{t.noMilestone}</p>
                )}
                <div className="context-links">
                  <span>{t.question}</span>
                  {current.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.title}
                      <ArrowUpRight size={14} />
                    </a>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="empty">
              <Mountain size={48} />
              <h2>{t.noResults}</h2>
              <button onClick={clear}>{t.clear}</button>
            </div>
          )}
        </section>
      </div>
      <footer id="method">
        <div>
          <h2>{t.principles}</h2>
          <p>{t.method}</p>
          <p>
            {t.scope} {t.historical}
          </p>
        </div>
        <a href={REPO} target="_blank" rel="noreferrer">
          {t.contributeButton}
          <ArrowUpRight size={18} />
        </a>
      </footer>
    </main>
  );
}
