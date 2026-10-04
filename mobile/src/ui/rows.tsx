import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Intention, Sign } from '@/data/types';
import { formatDay, formatDayInline, formatTime } from '@/lib/dates';
import { useColors } from '@/theme';

import { Button } from './button';
import { Divider } from './screen';
import { T } from './text';

/** Intentions are marked with an ultramarine square: the inner world. */
export function IntentionMarker({ status }: { status: Intention['status'] }) {
  const c = useColors();
  const filled = status === 'manifested';
  return (
    <View
      style={[
        styles.square,
        {
          borderColor: status === 'released' ? c.inkSoft : c.inner,
          backgroundColor: filled ? c.inner : 'transparent',
        },
      ]}
    />
  );
}

/** Signs are marked with a sunbeam dot: the outer world. Threaded signs get a ring in thread colour. */
export function SignMarker({ threaded }: { threaded: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.dotWrap, threaded && { borderColor: c.thread }]}>
      <View style={[styles.dot, { backgroundColor: c.outer }]} />
    </View>
  );
}

export function IntentionRow({ item, signs }: { item: Intention; signs: number }) {
  const meta = [
    item.category,
    signs === 1 ? '1 sign' : `${signs} signs`,
    item.status === 'active' ? `set ${formatDayInline(item.createdAt)}` : null,
    item.status === 'manifested' && item.completedAt
      ? `manifested ${formatDayInline(item.completedAt)}`
      : null,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    <RowShell
      onPress={() => router.push({ pathname: '/intention/[id]', params: { id: item.id } })}
      accessibilityLabel={`Intention: ${item.title}. ${meta}`}
      marker={<IntentionMarker status={item.status} />}>
      <T variant="bodyStrong" numberOfLines={2}>
        {item.title}
      </T>
      <T variant="small" color="inkSoft" numberOfLines={1}>
        {meta}
      </T>
    </RowShell>
  );
}

export function SignRow({
  item,
  intentionTitle,
  showDay = false,
}: {
  item: Sign;
  intentionTitle?: string | null;
  showDay?: boolean;
}) {
  const when = showDay
    ? `${formatDay(item.occurredAt)}, ${formatTime(item.occurredAt)}`
    : formatTime(item.occurredAt);
  const meta = [item.kind, when].filter(Boolean).join(', ');
  return (
    <RowShell
      onPress={() => router.push({ pathname: '/sign/[id]', params: { id: item.id } })}
      accessibilityLabel={`Sign: ${item.title}. ${meta}${intentionTitle ? `. Threaded to ${intentionTitle}` : ''}`}
      marker={<SignMarker threaded={!!item.intentionId} />}>
      <T variant="bodyStrong" numberOfLines={2}>
        {item.title}
      </T>
      <T variant="small" color="inkSoft" numberOfLines={1}>
        {meta}
      </T>
      {intentionTitle ? (
        <T variant="small" color="thread" numberOfLines={1}>
          ↳ {intentionTitle}
        </T>
      ) : null}
    </RowShell>
  );
}

function RowShell({
  children,
  marker,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  marker: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const c = useColors();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surfaceRaised }]}>
        <View style={styles.markerCol}>{marker}</View>
        <View style={{ flex: 1, gap: 2 }}>{children}</View>
        <Feather name="chevron-right" size={18} color={c.inkSoft} />
      </Pressable>
      <Divider />
    </>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
  tone = 'inner',
}: {
  icon: ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
  tone?: 'inner' | 'outer';
}) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: tone === 'inner' ? c.innerSoft : c.outerSoft }]}>
        <Feather name={icon} size={24} color={tone === 'inner' ? c.inner : c.outer} />
      </View>
      <T variant="subheading" center>
        {title}
      </T>
      <T variant="body" color="inkSoft" center style={{ maxWidth: 300 }}>
        {body}
      </T>
      {action && onAction ? (
        <Button label={action} tone={tone} onPress={onAction} style={{ marginTop: 8 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  markerCol: { width: 18, alignItems: 'center', alignSelf: 'flex-start', paddingTop: 5 },
  square: { width: 13, height: 13, borderRadius: 3, borderWidth: 2.5 },
  dotWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 12 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
