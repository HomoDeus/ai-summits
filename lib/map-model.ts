import type { Problem, Locale } from './types.ts';
export const MAP_WIDTH = 2640,
  MAP_HEIGHT = 1900;
export type Vertex = { x: number; y: number };
// Adjacent regions reuse the same vertices and bent edges, with no gaps.
function vertex(c: number, r: number): Vertex {
  return {
    x: 100 + c * 400 + Math.sin(c * 17 + r * 7) * 25,
    y: 100 + r * 420 + Math.sin(c * 9 + r * 11) * 28,
  };
}
function edge(a: Vertex, b: Vertex): Vertex[] {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const bend = Math.sin((a.x + b.x) * 0.013 + (a.y + b.y) * 0.019) * 0.045;
  return [
    a,
    {
      x: (a.x + b.x) / 2 - Math.abs(dy) * bend,
      y: (a.y + b.y) / 2 + Math.abs(dx) * bend,
    },
  ];
}
export function province(index: number) {
  const c = index % 6,
    r = Math.floor(index / 6),
    span = index === 22 ? 2 : 1;
  const corners = [
    ...Array.from({ length: span }, (_, i) => vertex(c + i, r)),
    vertex(c + span, r),
    ...Array.from({ length: span }, (_, i) => vertex(c + span - i, r + 1)),
    vertex(c, r + 1),
  ];
  const points = corners.flatMap((a, i) =>
    edge(a, corners[(i + 1) % corners.length]),
  );
  return { points, x: 100 + c * 400, y: 100 + r * 420, width: span * 400 };
}
export function peakHeight(rating: Problem['rating']) {
  return 55 + ((rating.difficulty + rating.importance) / 2 - 1) * 26;
}
export function humanAt(problem: Problem, year: number) {
  return problem.humanMilestones
    .filter((m) => m.year <= year)
    .sort((a, b) => b.year - a.year)[0];
}
export function camp(status?: 'partial' | 'achieved') {
  return status === 'achieved' ? 1 : status === 'partial' ? 0.53 : 0;
}
export const atlasCopy = {
  en: {
    human: 'Human research',
    ai: 'AI-assisted',
    unknown: 'Not yet cataloged',
    unnamed: 'Unnamed mountains',
    unknownText:
      'Unframed questions or problems not yet included. Background mountains are symbolic: their number, height and size do not measure the unknown.',
    height: 'Height = difficulty + importance',
    difficulty: 'Difficulty',
    importance: 'Importance',
    rating: 'Editorial estimate · 1–5',
    ratingNote:
      'Difficulty: 1 routine, 2 advanced, 3 specialist, 4 research frontier, 5 foundational unresolved challenge. Importance: 1 narrow, 2 local, 3 field-wide, 4 cross-field, 5 broad scientific or societal impact. Height uses their equal-weight average. These are provisional editorial judgments, not consensus measurements.',
    camp: '? = no dated record here, not no human progress. Climbers mark evidence categories, not percentages; human research may use tools, and AI results may involve people.',
    province: 'Discipline provinces',
    legend: 'Map key',
    detail: 'Evidence & scoring',
  },
  'zh-CN': {
    human: '人类研究',
    ai: 'AI 辅助研究',
    unknown: '尚未收录',
    unnamed: '无名山群',
    unknownText:
      '尚未定义或尚未收录的问题。背景山群仅为象征：数量、高度和面积都不衡量未知问题的规模。',
    height: '山高 = 难度 + 重要性',
    difficulty: '难度',
    importance: '重要性',
    rating: '编辑估计 · 1–5 级',
    ratingNote:
      '难度：1 常规、2 进阶、3 专业、4 研究前沿、5 基础性未解难题。重要性：1 狭窄、2 局部、3 学科内、4 跨学科、5 广泛科学或社会影响。山高取二者等权平均。这是可修订的编辑判断，不是公认测量值。',
    camp: '? 表示尚无已收录的对应年份记录，不是人类没有进展。小人表示证据类别，不是完成率；人类研究可以使用工具，AI 成果也可能有人类参与。',
    province: '学科分区',
    legend: '地图图例',
    detail: '证据与评分',
  },
  es: {
    human: 'Investigación humana',
    ai: 'Con ayuda de IA',
    unknown: 'Aún sin registrar',
    unnamed: 'Montañas sin nombre',
    unknownText:
      'Preguntas aún sin formular o problemas no incluidos. El paisaje es simbólico: su número, altura y área no cuantifican lo desconocido.',
    height: 'Altura = dificultad + importancia',
    difficulty: 'Dificultad',
    importance: 'Importancia',
    rating: 'Estimación editorial · 1–5',
    ratingNote:
      'Dificultad: 1 rutinaria, 2 avanzada, 3 especializada, 4 frontera de investigación, 5 reto fundamental abierto. Importancia: 1 limitada, 2 local, 3 disciplinar, 4 interdisciplinar, 5 amplio impacto científico o social. La altura usa la media de ambas. Son juicios editoriales provisionales, no medidas consensuadas.',
    camp: '? indica ausencia de registros fechados, no ausencia de progreso humano. Los escaladores indican categorías de evidencia, no porcentajes; las personas pueden usar herramientas y la IA puede contar con ayuda humana.',
    province: 'Provincias disciplinares',
    legend: 'Leyenda',
    detail: 'Evidencia y valoración',
  },
} satisfies Record<Locale, Record<string, string>>;
