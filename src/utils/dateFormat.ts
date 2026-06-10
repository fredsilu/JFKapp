// src/utils/dateFormat.ts

export type DocumentLanguage = 'fr' | 'en';

function toDate(value: any): Date | null {
  if (!value) return null;

  if (value?.toDate) return value.toDate();

  if (value instanceof Date) return value;

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDocumentDate(
  value: any,
  language: DocumentLanguage = 'fr'
): string {
  const date = toDate(value);
  if (!date) return '—';

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function isPastDate(value: any): boolean {
  const date = toDate(value);

  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return target < today;
}

export function toInputDateValue(value: any): string {
  const date = toDate(value);

  if (!date) return "";

  return date.toISOString().slice(0, 10);
}

export function formatShortDocumentDate(
  value: any,
  language: DocumentLanguage = 'fr'
): string {
  const date = toDate(value);
  if (!date) return '—';

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}