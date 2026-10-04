import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { font, radius, useColors } from '@/theme';

import { tap } from './button';
import { T } from './text';

type Tone = 'inner' | 'outer';

export function Chip({
  label,
  selected,
  onPress,
  tone = 'inner',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: Tone;
}) {
  const c = useColors();
  const on = tone === 'inner' ? c.inner : c.outer;
  const onFg = tone === 'inner' ? c.onInner : c.onOuter;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? on : c.surface,
          borderColor: selected ? on : c.line,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <T variant="small" style={{ color: selected ? onFg : c.ink, fontFamily: font.bodyMedium }}>
        {label}
      </T>
    </Pressable>
  );
}

/** Single-select chips. Tapping the selected chip clears it. */
export function ChipPicker({
  label,
  options,
  value,
  onChange,
  tone = 'inner',
  scroll = false,
}: {
  label?: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string | null) => void;
  tone?: Tone;
  scroll?: boolean;
}) {
  const chips = options.map((o) => (
    <Chip
      key={o}
      label={o}
      tone={tone}
      selected={value === o}
      onPress={() => onChange(value === o ? null : o)}
    />
  ));
  return (
    <View style={{ gap: 10 }}>
      {label && (
        <T variant="small" color="inkSoft">
          {label}
        </T>
      )}
      {scroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}>
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.wrap}>{chips}</View>
      )}
    </View>
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (k: K) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.segment, { backgroundColor: c.surfaceRaised }]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              onChange(o.key);
            }}
            style={[styles.segmentItem, selected && { backgroundColor: c.surface }]}>
            <T
              variant="small"
              color={selected ? 'ink' : 'inkSoft'}
              style={{ fontFamily: selected ? font.bodySemi : font.bodyMedium }}>
              {o.label}
              {o.count != null ? `  ${o.count}` : ''}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scrollRow: { gap: 8, paddingRight: 20 },
  segment: { flexDirection: 'row', borderRadius: radius.pill, padding: 4 },
  segmentItem: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
