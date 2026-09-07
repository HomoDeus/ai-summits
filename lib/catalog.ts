import rawProblems from '../data/problems.json' with { type: 'json' };
import rawDisciplines from '../data/disciplines.json' with { type: 'json' };
import type { Discipline, Locale, Problem, Status } from './types.ts';
export const problems = rawProblems as Problem[];
export const disciplines = rawDisciplines as Discipline[];
export const FIRST_YEAR = 2015;
export const LAST_YEAR = 2026;
export const REVIEW_DATE = '2026-09-07';
export function milestoneAt(problem: Problem, year: number) {
  return problem.milestones
    .filter((m) => m.year <= year)
    .sort((a, b) => b.year - a.year)[0];
}
export function statusAt(problem: Problem, year: number): Status {
  return milestoneAt(problem, year)?.status ?? 'open';
}
export function filterProblems(
  items: Problem[],
  locale: Locale,
  query: string,
  discipline: string,
  status: string,
  year: number,
) {
  const needle = query.trim().toLocaleLowerCase(locale);
  return items.filter(
    (p) =>
      (discipline === 'all' || p.discipline === discipline) &&
      (status === 'all' || statusAt(p, year) === status) &&
      (!needle ||
        [
          p.title[locale],
          p.title.en,
          p.question[locale],
          ...p.milestones.map((m) => m.system),
        ].some((s) => s.toLocaleLowerCase(locale).includes(needle))),
  );
}
export function parseView(search: string) {
  const params = new URLSearchParams(search);
  const lang = params.get('lang');
  const locale: Locale = lang === 'zh-CN' || lang === 'es' ? lang : 'en';
  const value = Number(params.get('year') ?? LAST_YEAR);
  const year =
    Number.isInteger(value) && value >= FIRST_YEAR && value <= LAST_YEAR
      ? value
      : LAST_YEAR;
  const id = params.get('peak');
  return {
    locale,
    year,
    selected: problems.find((p) => p.id === id)?.id ?? 'protein-structure',
  };
}
export const statusColors = {
  open: '#91a6bc',
  partial: '#efb66c',
  achieved: '#89e6b1',
};
