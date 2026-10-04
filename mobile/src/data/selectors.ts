import { INSIGHTS } from '@/content/insights';
import { addDays, dayKey, daysBetween, isWithinLastDays, startOfDay } from '@/lib/dates';

import type { AppState } from './store';
import type { Intention, Sign } from './types';

/* ---------- journey ---------- */

export function isStageComplete(s: AppState, n: number) {
  return !!s.stages.find((x) => x.insight === n)?.completedAt;
}

export function isStageUnlocked(s: AppState, n: number) {
  return n === 1 || isStageComplete(s, n - 1);
}

/** The stage the person is currently on, or null when all nine are complete. */
export function currentInsight(s: AppState): number | null {
  for (const i of INSIGHTS) if (!isStageComplete(s, i.n)) return i.n;
  return null;
}

export function completedStageCount(s: AppState) {
  return INSIGHTS.filter((i) => isStageComplete(s, i.n)).length;
}

/* ---------- lists ---------- */

export const byNewest = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);

export const signsNewest = (a: Sign, b: Sign) => b.occurredAt.localeCompare(a.occurredAt);

export function intentionsByStatus(s: AppState, status: Intention['status']) {
  const list = s.intentions.filter((i) => i.status === status);
  return status === 'active'
    ? list.sort(byNewest)
    : list.sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt));
}

export function signsFor(s: AppState, intentionId: string) {
  return s.signs.filter((x) => x.intentionId === intentionId).sort(signsNewest);
}

export function signCounts(s: AppState): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of s.signs) if (x.intentionId) m.set(x.intentionId, (m.get(x.intentionId) ?? 0) + 1);
  return m;
}

/** Groups signs into sections by local day, newest first. */
export function signsByDay(signs: Sign[]) {
  const sorted = [...signs].sort(signsNewest);
  const sections: { key: string; date: string; data: Sign[] }[] = [];
  for (const sign of sorted) {
    const key = dayKey(sign.occurredAt);
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.data.push(sign);
    else sections.push({ key, date: sign.occurredAt, data: [sign] });
  }
  return sections;
}

/* ---------- patterns / stats ---------- */

/** Every local day on which the person practised: logged a sign, set an intention or reflected. */
function practiceDays(s: AppState): Set<string> {
  const days = new Set<string>();
  s.signs.forEach((x) => days.add(dayKey(x.createdAt)));
  s.intentions.forEach((x) => days.add(dayKey(x.createdAt)));
  s.reflections.forEach((x) => x.text.trim() && days.add(dayKey(x.updatedAt)));
  return days;
}

/** Consecutive practice days ending today (or yesterday, so the streak survives until tonight). */
export function currentStreak(s: AppState, now = new Date()): number {
  const days = practiceDays(s);
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function weekSummary(s: AppState, now = new Date()) {
  const week = s.signs.filter((x) => isWithinLastDays(x.occurredAt, 7, now));
  return {
    signs: week.length,
    threads: week.filter((x) => x.intentionId).length,
    active: s.intentions.filter((i) => i.status === 'active').length,
  };
}

function topOf(values: (string | null)[]) {
  const m = new Map<string, number>();
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  let best: { label: string; count: number } | null = null;
  for (const [label, count] of m) if (!best || count > best.count) best = { label, count };
  return best;
}

export function patterns(s: AppState, now = new Date()) {
  // Signs per week for the last 8 weeks, oldest first.
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(startOfDay(now), -7 * (7 - i)); // last day of that week
    return { end, count: 0 };
  });
  for (const x of s.signs) {
    const ago = daysBetween(x.occurredAt, now);
    if (ago < 0 || ago >= 56) continue;
    const idx = 7 - Math.floor(ago / 7);
    weeks[idx].count++;
  }

  const kinds = new Map<string, number>();
  for (const x of s.signs) {
    const k = x.kind ?? 'Unsorted';
    kinds.set(k, (kinds.get(k) ?? 0) + 1);
  }
  const kindList = [...kinds.entries()].sort((a, b) => b[1] - a[1]);

  const manifested = s.intentions.filter((i) => i.status === 'manifested');
  const durations = manifested
    .filter((i) => i.completedAt)
    .map((i) => Math.max(0, daysBetween(i.createdAt, i.completedAt!)));
  const avgDays = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;

  const hours = new Array(24).fill(0) as number[];
  s.signs.forEach((x) => hours[new Date(x.occurredAt).getHours()]++);
  const peakHour = s.signs.length ? hours.indexOf(Math.max(...hours)) : null;

  return {
    totalSigns: s.signs.length,
    linkedShare: s.signs.length ? s.signs.filter((x) => x.intentionId).length / s.signs.length : 0,
    weeks,
    kinds: kindList,
    topEmotion: topOf(s.intentions.map((i) => i.emotion)),
    intentions: s.intentions.length,
    manifested: manifested.length,
    released: s.intentions.filter((i) => i.status === 'released').length,
    avgDaysToManifest: avgDays,
    peakHour,
    streak: currentStreak(s, now),
    activeDays: practiceDays(s).size,
  };
}
