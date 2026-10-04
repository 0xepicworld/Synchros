import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { font, radius, useColors } from '@/theme';

import { T } from './text';

type Tone = 'inner' | 'outer' | 'quiet' | 'danger' | 'outline';

type Props = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  icon?: ComponentProps<typeof Feather>['name'];
  disabled?: boolean;
  loading?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: ViewStyle;
  haptic?: boolean;
  accessibilityHint?: string;
  trailing?: ReactNode;
};

export function tap(kind: 'light' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function Button({
  label,
  onPress,
  tone = 'inner',
  icon,
  disabled,
  loading,
  size = 'md',
  style,
  haptic = true,
  accessibilityHint,
  trailing,
}: Props) {
  const c = useColors();
  const palette = {
    inner: { bg: c.inner, fg: c.onInner, border: c.inner },
    outer: { bg: c.outer, fg: c.onOuter, border: c.outer },
    quiet: { bg: c.surfaceRaised, fg: c.ink, border: c.surfaceRaised },
    danger: { bg: c.dangerSoft, fg: c.danger, border: c.dangerSoft },
    outline: { bg: 'transparent', fg: c.ink, border: c.line },
  }[tone];
  const height = size === 'lg' ? 58 : size === 'sm' ? 38 : 50;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={() => {
        if (haptic) tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: size === 'sm' ? 14 : 22,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Feather name={icon} size={size === 'sm' ? 15 : 18} color={palette.fg} />}
          <T
            variant={size === 'sm' ? 'small' : 'bodyStrong'}
            style={{ color: palette.fg, fontFamily: font.bodySemi }}>
            {label}
          </T>
          {trailing}
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'quiet',
}: {
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  label: string;
  tone?: 'quiet' | 'inner' | 'outer' | 'plain';
}) {
  const c = useColors();
  const bg = { quiet: c.surfaceRaised, inner: c.inner, outer: c.outer, plain: 'transparent' }[tone];
  const fg = { quiet: c.ink, inner: c.onInner, outer: c.onOuter, plain: c.ink }[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.icon, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}>
      <Feather name={icon} size={19} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
