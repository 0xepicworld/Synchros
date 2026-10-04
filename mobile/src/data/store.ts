import { useSyncExternalStore } from 'react';
import { Alert } from 'react-native';

import { insightByNumber } from '@/content/insights';
import { nowIso } from '@/lib/dates';
import { newId } from '@/lib/id';
import { deleteAllImages, deleteImage } from '@/lib/vision-files';

import { storage } from './storage';
import {
  EMPTY_SNAPSHOT,
  Intention,
  KV,
  Reflection,
  Sign,
  Snapshot,
  Stage,
  TableName,
  Tables,
  VisionCard,
} from './types';

/**
 * App state lives in memory and writes through to on-device storage.
 * A personal journal holds hundreds to low thousands of rows, so loading
 * everything once at launch keeps every screen instant and consistent.
 */

export type AppState = Snapshot & { ready: boolean; error: string | null };

let state: AppState = { ...EMPTY_SNAPSHOT, ready: false, error: null };
const listeners = new Set<() => void>();

function setState(next: Partial<AppState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const getState = () => state;

function persistFailed(e: unknown) {
  console.warn('[synchros] save failed', e);
  Alert.alert(
    'Couldn’t save that change',
    'Your device storage refused the write. Free up some space, then try again.',
  );
}

function persist(p: Promise<unknown>) {
  p.catch(persistFailed);
}

export async function loadStore() {
  try {
    const snap = await storage.init();
    setState({ ...snap, ready: true, error: null });
  } catch (e) {
    console.warn('[synchros] load failed', e);
    setState({ ready: true, error: 'Your journal could not be opened. Restart the app to try again.' });
  }
}

/* ---------- generic table helpers ---------- */

function putRow<T extends TableName>(table: T, row: Tables[T]) {
  const list = state[table] as Tables[T][];
  const i = list.findIndex((r) => r.id === row.id);
  const next = i >= 0 ? list.map((r) => (r.id === row.id ? row : r)) : [...list, row];
  setState({ [table]: next } as Partial<AppState>);
  persist(storage.upsert(table, row));
}

function dropRow(table: TableName, id: string) {
  const list = state[table] as { id: string }[];
  setState({ [table]: list.filter((r) => r.id !== id) } as Partial<AppState>);
  persist(storage.remove(table, id));
}

/* ---------- key/value settings ---------- */

export function setKV(key: keyof KV, value: string | null) {
  const kv = { ...state.kv };
  if (value == null) delete kv[key];
  else (kv as Record<string, string>)[key] = value;
  setState({ kv });
  persist(storage.setKV(key, value));
}

/* ---------- intentions ---------- */

export type IntentionInput = Pick<Intention, 'title' | 'script' | 'category' | 'emotion' | 'keywords'>;

export function createIntention(input: IntentionInput): Intention {
  const t = nowIso();
  const row: Intention = {
    id: newId(),
    ...input,
    status: 'active',
    outcome: null,
    createdAt: t,
    completedAt: null,
    updatedAt: t,
  };
  putRow('intentions', row);
  return row;
}

export function updateIntention(id: string, patch: Partial<Intention>) {
  const cur = state.intentions.find((i) => i.id === id);
  if (!cur) return;
  putRow('intentions', { ...cur, ...patch, id, updatedAt: nowIso() });
}

export function manifestIntention(id: string, outcome: string | null) {
  updateIntention(id, { status: 'manifested', outcome, completedAt: nowIso() });
}

export function releaseIntention(id: string) {
  updateIntention(id, { status: 'released', completedAt: nowIso() });
}

export function reopenIntention(id: string) {
  updateIntention(id, { status: 'active', completedAt: null });
}

/** Deletes the intention; its signs are kept and simply unlinked. */
export function deleteIntention(id: string) {
  const t = nowIso();
  for (const s of state.signs) {
    if (s.intentionId === id) putRow('signs', { ...s, intentionId: null, updatedAt: t });
  }
  dropRow('intentions', id);
}

/* ---------- signs ---------- */

export type SignInput = Pick<Sign, 'title' | 'description' | 'kind' | 'intentionId' | 'intensity'> & {
  occurredAt?: string;
};

export function createSign(input: SignInput): Sign {
  const t = nowIso();
  const row: Sign = {
    id: newId(),
    title: input.title,
    description: input.description,
    kind: input.kind,
    intentionId: input.intentionId,
    intensity: input.intensity,
    occurredAt: input.occurredAt ?? t,
    createdAt: t,
    updatedAt: t,
  };
  putRow('signs', row);
  return row;
}

export function updateSign(id: string, patch: Partial<Sign>) {
  const cur = state.signs.find((s) => s.id === id);
  if (!cur) return;
  putRow('signs', { ...cur, ...patch, id, updatedAt: nowIso() });
}

export function deleteSign(id: string) {
  dropRow('signs', id);
}

/* ---------- vision board ---------- */

export function createCard(title: string, imageName: string | null): VisionCard {
  const z = state.cards.reduce((m, c) => Math.max(m, c.z), 0) + 1;
  // Stagger new cards so they never stack exactly on top of each other.
  const offset = (state.cards.length % 5) * 0.06;
  const row: VisionCard = {
    id: newId(),
    title,
    imageName,
    x: 0.38 + offset,
    y: 0.32 + offset,
    scale: 1,
    rotation: ((state.cards.length % 3) - 1) * 0.05,
    z,
    createdAt: nowIso(),
  };
  putRow('cards', row);
  return row;
}

export function moveCard(id: string, patch: Pick<VisionCard, 'x' | 'y' | 'scale' | 'rotation'>) {
  const cur = state.cards.find((c) => c.id === id);
  if (!cur) return;
  putRow('cards', { ...cur, ...patch });
}

export function bringCardForward(id: string) {
  const cur = state.cards.find((c) => c.id === id);
  if (!cur) return;
  const top = state.cards.reduce((m, c) => Math.max(m, c.z), 0);
  if (cur.z === top) return;
  putRow('cards', { ...cur, z: top + 1 });
}

export function deleteCard(id: string) {
  const cur = state.cards.find((c) => c.id === id);
  if (cur) deleteImage(cur.imageName);
  dropRow('cards', id);
}

/* ---------- journey ---------- */

export function getStage(insight: number): Stage {
  return (
    state.stages.find((s) => s.insight === insight) ?? {
      id: String(insight),
      insight,
      startedAt: null,
      practiceDoneAt: null,
      completedAt: null,
    }
  );
}

export function startStage(insight: number) {
  const s = getStage(insight);
  if (s.startedAt) return;
  putRow('stages', { ...s, startedAt: nowIso() });
}

export function setPracticeDone(insight: number, done: boolean) {
  const s = getStage(insight);
  putRow('stages', { ...s, startedAt: s.startedAt ?? nowIso(), practiceDoneAt: done ? nowIso() : null });
}

export function saveReflection(insight: number, prompt: number, text: string) {
  const id = `${insight}-${prompt}`;
  const existing = state.reflections.find((r) => r.id === id);
  if (existing && existing.text === text) return;
  const row: Reflection = { id, insight, prompt, text, updatedAt: nowIso() };
  putRow('reflections', row);
}

export function stageRequirements(insight: number, s: AppState = state) {
  const def = insightByNumber(insight);
  const stage = s.stages.find((x) => x.insight === insight);
  const answered = (def?.prompts ?? []).filter((_, i) =>
    s.reflections.some((r) => r.id === `${insight}-${i}` && r.text.trim().length > 0),
  ).length;
  const needsPattern = def?.feature === 'pattern' && !s.kv.pattern;
  const needsQuestion = def?.feature === 'question' && !s.kv.liveQuestion?.trim();
  return {
    answered,
    total: def?.prompts.length ?? 0,
    practiceDone: !!stage?.practiceDoneAt,
    needsPattern,
    needsQuestion,
    ready:
      !!stage?.practiceDoneAt &&
      answered === (def?.prompts.length ?? 0) &&
      !needsPattern &&
      !needsQuestion,
  };
}

export function completeStage(insight: number): boolean {
  if (!stageRequirements(insight).ready) return false;
  const s = getStage(insight);
  putRow('stages', { ...s, completedAt: nowIso() });
  return true;
}

export function reopenStage(insight: number) {
  const s = getStage(insight);
  putRow('stages', { ...s, completedAt: null });
}

/* ---------- whole-journal operations ---------- */

export function exportSnapshot(): Snapshot {
  const { intentions, signs, cards, reflections, stages, kv } = state;
  return { intentions, signs, cards, reflections, stages, kv };
}

export async function replaceAll(snapshot: Snapshot) {
  await storage.replaceAll(snapshot);
  setState({ ...snapshot });
}

export async function wipeAll() {
  await storage.wipe();
  deleteAllImages();
  setState({ ...EMPTY_SNAPSHOT, kv: {} });
}
