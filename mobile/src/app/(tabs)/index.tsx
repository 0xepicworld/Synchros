import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { insightByNumber } from '@/content/insights';
import { currentInsight, currentStreak, signsNewest, weekSummary } from '@/data/selectors';
import { setPracticeDone, useAppState } from '@/data/store';
import { formatLongDate, greeting } from '@/lib/dates';
import { gutter, radius, useColors } from '@/theme';
import { Button, IconButton } from '@/ui/button';
import { Rings } from '@/ui/motif';
import { EmptyState, SignRow } from '@/ui/rows';
import { Screen, Section } from '@/ui/screen';
import { T } from '@/ui/text';

export default function Today() {
  const s = useAppState();
  const c = useColors();
  const { width } = useWindowDimensions();

  const week = useMemo(() => weekSummary(s), [s]);
  const streak = useMemo(() => currentStreak(s), [s]);
  const recent = useMemo(() => [...s.signs].sort(signsNewest).slice(0, 4), [s.signs]);
  const titles = useMemo(() => new Map(s.intentions.map((i) => [i.id, i.title])), [s.intentions]);
  const stageN = currentInsight(s);
  const stage = stageN ? insightByNumber(stageN) : null;
  const practiceDone = !!s.stages.find((x) => x.insight === stageN)?.practiceDoneAt;

  const name = s.kv.name ? `, ${s.kv.name}` : '';

  return (
    <Screen
      subtitle={formatLongDate(new Date())}
      title={`${greeting()}${name}`}
      actions={<IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />}>
      <View style={styles.hero}>
        <Rings
          inner={week.active}
          outer={week.signs}
          threads={week.threads}
          size={Math.min(width - gutter * 2, 380)}
        />
        <T variant="small" color="inkSoft" center>
          {week.signs === 0
            ? 'No signs logged this week yet.'
            : week.threads === 0
              ? 'Thread a sign to an intention and the circles draw closer.'
              : `${Math.round((week.threads / week.signs) * 100)}% of this week’s signs are threaded to an intention.`}
        </T>
        {streak > 1 && (
          <T variant="small" color="inner" center>
            {streak} days in a row
          </T>
        )}
      </View>

      {s.kv.liveQuestion ? (
        <View style={[styles.question, { borderColor: c.thread }]}>
          <T variant="caption" color="thread">
            Your live question
          </T>
          <T variant="subheading">{s.kv.liveQuestion}</T>
        </View>
      ) : null}

      {stage && stageN ? (
        <Section title="Today’s practice">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Stage ${stageN}: ${stage.title}. ${stage.practice}`}
            onPress={() => router.push({ pathname: '/insight/[n]', params: { n: String(stageN) } })}
            style={({ pressed }) => [
              styles.practice,
              { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 },
            ]}>
            <View style={styles.practiceHead}>
              <View style={[styles.stageBadge, { backgroundColor: c.innerSoft }]}>
                <T variant="bodyStrong" color="inner">
                  {stageN}
                </T>
              </View>
              <T variant="small" color="inkSoft" style={{ flex: 1 }}>
                {stage.title}
              </T>
              <Feather name="chevron-right" size={18} color={c.inkSoft} />
            </View>
            <T variant="reading">{stage.practice}</T>
            <Button
              size="sm"
              tone={practiceDone ? 'quiet' : 'inner'}
              icon={practiceDone ? 'check' : undefined}
              label={practiceDone ? stage.practiceDone : 'Mark as done'}
              onPress={() => setPracticeDone(stageN, !practiceDone)}
              style={{ alignSelf: 'flex-start' }}
            />
          </Pressable>
        </Section>
      ) : null}

      <Section
        title="Recent signs"
        action={
          recent.length ? (
            <Button size="sm" tone="outline" label="See all" onPress={() => router.navigate('/signs')} />
          ) : undefined
        }>
        {recent.length === 0 ? (
          <EmptyState
            icon="eye"
            tone="outer"
            title="Nothing logged yet"
            body="The next time something feels too well timed to be chance, tap the gold button and write it down."
            action="Log your first sign"
            onAction={() => router.push('/sign/form')}
          />
        ) : (
          <View>
            {recent.map((x) => (
              <SignRow
                key={x.id}
                item={x}
                showDay
                intentionTitle={x.intentionId ? titles.get(x.intentionId) : null}
              />
            ))}
          </View>
        )}
      </Section>

      <Section>
        <View style={styles.tiles}>
          <Tile icon="image" label="Vision board" onPress={() => router.push('/board')} />
          <Tile icon="bar-chart-2" label="Patterns" onPress={() => router.push('/patterns')} />
        </View>
      </Section>
    </Screen>
  );
}

function Tile({
  icon,
  label,
  onPress,
}: {
  icon: 'image' | 'bar-chart-2';
  label: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Feather name={icon} size={22} color={c.inner} />
      <T variant="bodyStrong">{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 6, marginTop: 8 },
  question: { marginTop: 24, borderLeftWidth: 3, paddingLeft: 14, gap: 4 },
  practice: { borderRadius: radius.card, padding: 18, gap: 12 },
  practiceHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, borderRadius: radius.card, padding: 18, gap: 14 },
});
