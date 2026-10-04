import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { gutter, useColors } from '@/theme';

import { T } from './text';

/** Tab-level screen: large title, optional right-side actions, scrolling body. */
export function Screen({
  title,
  subtitle,
  actions,
  children,
  scroll = true,
  ...scrollProps
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
} & ScrollViewProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: 2 }}>
        {subtitle ? (
          <T variant="small" color="inkSoft">
            {subtitle}
          </T>
        ) : null}
        <T variant="title" accessibilityRole="header">
          {title}
        </T>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  ) : null;

  if (!scroll) {
    return (
      <View style={[styles.fill, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
        <View style={{ paddingHorizontal: gutter }}>{header}</View>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: c.bg }]}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: 48,
        paddingHorizontal: gutter,
      }}
      keyboardShouldPersistTaps="handled"
      {...scrollProps}>
      {header}
      {children}
    </ScrollView>
  );
}

/** Modal / pushed form screen body with keyboard handling. */
export function FormBody({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{
          padding: gutter,
          paddingBottom: insets.bottom + 40,
          gap: 22,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Section({
  title,
  action,
  children,
  style,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[{ marginTop: 28, gap: 12 }, style]}>
      {title ? (
        <View style={styles.sectionHead}>
          <T variant="heading" accessibilityRole="header">
            {title}
          </T>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.line }} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 8, minHeight: 44 },
  actions: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
