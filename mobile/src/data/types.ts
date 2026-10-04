export type IntentionStatus = 'active' | 'manifested' | 'released';

export type Intention = {
  id: string;
  title: string;
  script: string;
  category: string | null;
  emotion: string | null;
  keywords: string | null;
  status: IntentionStatus;
  outcome: string | null;
  createdAt: string; // ISO
  completedAt: string | null;
  updatedAt: string;
};

export type Sign = {
  id: string;
  title: string;
  description: string;
  kind: string | null;
  intentionId: string | null;
  intensity: number; // 1–5, how strongly it landed
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type VisionCard = {
  id: string;
  title: string;
  imageName: string | null; // file name inside the app's vision folder, never an absolute path
  x: number; // 0–1, relative to board width
  y: number; // 0–1, relative to board height
  scale: number;
  rotation: number; // radians
  z: number;
  createdAt: string;
};

export type Reflection = {
  id: string; // `${insight}-${prompt}`
  insight: number;
  prompt: number;
  text: string;
  updatedAt: string;
};

export type Stage = {
  id: string; // String(insight)
  insight: number;
  startedAt: string | null;
  practiceDoneAt: string | null;
  completedAt: string | null;
};

export type ThemePref = 'system' | 'light' | 'dark';

export type KV = {
  onboarded?: string;
  name?: string;
  reminderEnabled?: string;
  reminderHour?: string;
  reminderMinute?: string;
  pattern?: string;
  liveQuestion?: string;
  themePref?: ThemePref;
};

export type Tables = {
  intentions: Intention;
  signs: Sign;
  cards: VisionCard;
  reflections: Reflection;
  stages: Stage;
};

export type TableName = keyof Tables;

export type Snapshot = {
  intentions: Intention[];
  signs: Sign[];
  cards: VisionCard[];
  reflections: Reflection[];
  stages: Stage[];
  kv: KV;
};

export interface Storage {
  init(): Promise<Snapshot>;
  upsert<T extends TableName>(table: T, row: Tables[T]): Promise<void>;
  remove(table: TableName, id: string): Promise<void>;
  setKV(key: keyof KV, value: string | null): Promise<void>;
  replaceAll(snapshot: Snapshot): Promise<void>;
  wipe(): Promise<void>;
}

/** Column order for each table. The single source of truth for both storage backends. */
export const COLUMNS: { [T in TableName]: (keyof Tables[T])[] } = {
  intentions: [
    'id', 'title', 'script', 'category', 'emotion', 'keywords', 'status', 'outcome',
    'createdAt', 'completedAt', 'updatedAt',
  ],
  signs: [
    'id', 'title', 'description', 'kind', 'intentionId', 'intensity', 'occurredAt',
    'createdAt', 'updatedAt',
  ],
  cards: ['id', 'title', 'imageName', 'x', 'y', 'scale', 'rotation', 'z', 'createdAt'],
  reflections: ['id', 'insight', 'prompt', 'text', 'updatedAt'],
  stages: ['id', 'insight', 'startedAt', 'practiceDoneAt', 'completedAt'],
};

export const EMPTY_SNAPSHOT: Snapshot = {
  intentions: [],
  signs: [],
  cards: [],
  reflections: [],
  stages: [],
  kv: {},
};
