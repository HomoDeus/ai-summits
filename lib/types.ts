export const locales = ['en', 'zh-CN', 'es'] as const;
export type Locale = (typeof locales)[number];
export type Text = Record<Locale, string>;
export type Status = 'open' | 'partial' | 'achieved';
export type Evidence =
  | 'proof'
  | 'competition'
  | 'benchmark'
  | 'experiment'
  | 'simulation'
  | 'discovery';
export interface Source {
  title: string;
  url: string;
}
export interface Milestone {
  year: number;
  status: Exclude<Status, 'open'>;
  evidence: Evidence;
  system: string;
  summary: Text;
  sources: Source[];
}
export interface Problem {
  id: string;
  discipline: string;
  title: Text;
  question: Text;
  boundary: Text;
  sources: Source[];
  milestones: Milestone[];
  reviewed: string;
}
export interface Discipline {
  id: string;
  name: Text;
}
