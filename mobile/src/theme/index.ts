import { useColorScheme } from 'react-native';

import { useAppState } from '@/data/store';

import { dark, light, Palette } from './tokens';

export * from './tokens';

export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const pref = useAppState().kv.themePref ?? 'system';
  if (pref === 'light' || pref === 'dark') return pref;
  return system === 'dark' ? 'dark' : 'light';
}

export function useColors(): Palette {
  return useScheme() === 'dark' ? dark : light;
}
