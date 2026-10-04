const DAY = 86_400_000;

export const nowIso = () => new Date().toISOString();

/** Local calendar day key, e.g. "2026-10-04". */
export function dayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Whole calendar days between two dates (b - a), DST-safe. */
export function daysBetween(a: Date | string, b: Date | string): number {
  const da = startOfDay(new Date(a));
  const db = startOfDay(new Date(b));
  return Math.round((db.getTime() - da.getTime()) / DAY);
}

export function isWithinLastDays(iso: string, days: number, now = new Date()): boolean {
  const diff = daysBetween(iso, now);
  return diff >= 0 && diff < days;
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const shortFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const longFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
const yearFmt = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatLongDate = (d: Date | string) => longFmt.format(new Date(d));

export function formatDay(iso: string, now = new Date()): string {
  const diff = daysBetween(iso, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() ? shortFmt.format(d) : yearFmt.format(d);
}

/** For use mid-sentence: "set today", "set Sep 29". */
export function formatDayInline(iso: string, now = new Date()): string {
  const d = formatDay(iso, now);
  return d === 'Today' || d === 'Yesterday' ? d.toLowerCase() : d;
}

export function formatClock(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return timeFmt.format(d);
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
