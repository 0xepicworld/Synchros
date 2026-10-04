/**
 * Synchros design tokens.
 *
 * The identity is built on one idea: a synchronicity is the moment your
 * inner world (an intention) meets the outer world (a sign).
 *   - Inner  = ultramarine. Everything that is an intention uses it.
 *   - Outer  = sunbeam.     Everything that is a sign uses it.
 *   - Thread = where they meet. A sign linked to an intention.
 * Colour is information here, never decoration.
 */

export type Palette = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  ink: string;
  inkSoft: string;
  line: string;
  inner: string;
  innerSoft: string;
  onInner: string;
  outer: string;
  outerSoft: string;
  onOuter: string;
  thread: string;
  danger: string;
  dangerSoft: string;
};

export const light: Palette = {
  bg: '#F1F0F6', // pearl
  surface: '#FFFFFF',
  surfaceRaised: '#E7E5F1',
  ink: '#1A1840',
  inkSoft: '#6E6B8F',
  line: '#D9D7E8',
  inner: '#3B3AC4', // ultramarine
  innerSoft: '#E1E0FA',
  onInner: '#FFFFFF',
  outer: '#E3A21E', // sunbeam (darkened for contrast on light)
  outerSoft: '#FBEFD0',
  onOuter: '#1A1840',
  thread: '#B4469B',
  danger: '#C2364B',
  dangerSoft: '#F8DDE2',
};

export const dark: Palette = {
  bg: '#121130', // ultramarine night, not neutral black
  surface: '#1C1B44',
  surfaceRaised: '#262556',
  ink: '#F1F0F6',
  inkSoft: '#A3A1C7',
  line: '#2F2E62',
  inner: '#8D8CFF',
  innerSoft: '#2A2970',
  onInner: '#121130',
  outer: '#F5C34E',
  outerSoft: '#3B3320',
  onOuter: '#121130',
  thread: '#E58AD2',
  danger: '#FF7A8C',
  dangerSoft: '#4A2236',
};

export const font = {
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  displayMedium: 'BricolageGrotesque_500Medium',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemi: 'Figtree_600SemiBold',
  bodyItalic: 'Figtree_400Regular_Italic',
} as const;

/** Modular type scale (ratio ~1.25), sizes in pt. */
export const type = {
  hero: { fontFamily: font.displayHeavy, fontSize: 40, lineHeight: 42, letterSpacing: -1.2 },
  title: { fontFamily: font.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  heading: { fontFamily: font.display, fontSize: 22, lineHeight: 27, letterSpacing: -0.3 },
  subheading: { fontFamily: font.displayMedium, fontSize: 18, lineHeight: 23, letterSpacing: -0.1 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: font.bodySemi, fontSize: 16, lineHeight: 24 },
  reading: { fontFamily: font.body, fontSize: 17, lineHeight: 27 },
  small: { fontFamily: font.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.bodyMedium, fontSize: 12.5, lineHeight: 16 },
  number: { fontFamily: font.displayHeavy, fontSize: 34, lineHeight: 36, letterSpacing: -1 },
} as const;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** Radius follows hierarchy: sheets are softest, controls are pills, rows are square. */
export const radius = { field: 14, card: 22, sheet: 28, pill: 999 } as const;

export const gutter = 20;
