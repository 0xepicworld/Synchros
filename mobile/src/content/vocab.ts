export const SIGN_KINDS = [
  'Numbers',
  'People',
  'Conversation',
  'Dream',
  'Media',
  'Nature',
  'Animal',
  'Timing',
  'Feeling',
] as const;

export const INTENTION_CATEGORIES = [
  'Career',
  'Love',
  'Health',
  'Wealth',
  'Creativity',
  'Home',
  'Growth',
  'Purpose',
] as const;

export const EMOTIONS: { label: string; glyph: string }[] = [
  { label: 'Calm', glyph: '🕊️' },
  { label: 'Excitement', glyph: '✨' },
  { label: 'Gratitude', glyph: '🙏' },
  { label: 'Hope', glyph: '🌈' },
  { label: 'Joy', glyph: '😄' },
  { label: 'Love', glyph: '💖' },
  { label: 'Trust', glyph: '🌊' },
];

export function emotionGlyph(label: string | null): string {
  if (!label) return '';
  return EMOTIONS.find((e) => e.label === label)?.glyph ?? '';
}

export const INTENSITY_LABELS = ['', 'A flicker', 'Curious', 'Clear', 'Striking', 'Unmistakable'];
