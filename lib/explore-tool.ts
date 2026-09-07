import { FIRST_YEAR, LAST_YEAR, problems } from './catalog.ts';
import { locales, type Locale } from './types.ts';
export function validateExploration(input: unknown): {
  peak: string;
  year: number;
  locale: Locale;
} {
  if (!input || typeof input !== 'object')
    throw new Error('Expected an exploration object.');
  const value = input as Record<string, unknown>;
  if (
    Object.keys(value).some((key) => !['peak', 'year', 'locale'].includes(key))
  )
    throw new Error('Unknown exploration property.');
  if (
    typeof value.peak !== 'string' ||
    !problems.some((p) => p.id === value.peak)
  )
    throw new Error('Unknown peak.');
  if (
    typeof value.year !== 'number' ||
    !Number.isInteger(value.year) ||
    value.year < FIRST_YEAR ||
    value.year > LAST_YEAR
  )
    throw new Error('Year is outside the catalog range.');
  if (!locales.includes(value.locale as Locale))
    throw new Error('Unsupported locale.');
  return { peak: value.peak, year: value.year, locale: value.locale as Locale };
}
