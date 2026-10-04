import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { emotionGlyph } from '@/content/vocab';
import { patterns } from '@/data/selectors';
import { useAppState } from '@/data/store';
import { addDays, formatClock } from '@/lib/dates';
import { radius, useColors } from '@/theme';
import { EmptyState } from '@/ui/rows';
import { FormBody, Section } from '@/ui/screen';
import { T } from '@/ui/text';

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

export default function Patterns() {
  const s = useAppState();
  const c = useColors();
  const p = useMemo(() => patterns(s), [s]);
  const [sel, setSel] = useState(7);

  if (p.totalSigns === 0 && p.intentions === 0) {
    return (
      <FormBody>
        <EmptyState
          icon="bar-chart-2"
          title="Patterns appear with time"
          body="Log a few signs and set an intention. This page will start showing you when, how and where things line up."
        />
      </FormBody>
    );
  }

  const max = Math.max(1, ...p.weeks.map((w) => w.count));
  const selected = p.weeks[sel];
  const weekLabel =
    sel === 7
      ? 'This week'
      : `${shortDate.format(addDays(selected.end, -6))} – ${shortDate.format(selected.end)}`;
  const kindMax = Math.max(1, ...p.kinds.map((k) => k[1]));

  return (
    <FormBody>
      <View style={styles.stats}>
        <Stat value={p.totalSigns} label="signs logged" />
        <Stat value={`${Math.round(p.linkedShare * 100)}%`} label="threaded" />
        <Stat value={p.streak} label={p.streak === 1 ? 'day streak' : 'day streak'} />
      </View>

      <Section title="Signs per week" style={{ marginTop: 4 }}>
        <View
          style={[styles.card, { backgroundColor: c.surface }]}
          accessible
          accessibilityLabel={`Signs per week over the last 8 weeks: ${p.weeks.map((w) => w.count).join(', ')}. This week: ${p.weeks[7].count}.`}>
          <View style={styles.chart}>
            {p.weeks.map((w, i) => (
              <Pressable
                key={i}
                onPress={() => setSel(i)}
                hitSlop={4}
                style={styles.barSlot}
                accessibilityRole="button"
                accessibilityLabel={`${w.count} signs`}>
                <View
                  style={{
                    height: Math.max(4, (w.count / max) * 120),
                    width: '62%',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    backgroundColor: i === sel ? c.outer : c.outerSoft,
                  }}
                />
              </Pressable>
            ))}
          </View>
          <View style={[styles.baseline, { backgroundColor: c.line }]} />
          <View style={styles.selRow}>
            <T variant="small" color="inkSoft">
              {weekLabel}
            </T>
            <T variant="bodyStrong">
              {selected.count} {selected.count === 1 ? 'sign' : 'signs'}
            </T>
          </View>
        </View>
      </Section>

      {p.kinds.length > 0 && (
        <Section title="What kind of signs" style={{ marginTop: 4 }}>
          <View style={[styles.card, { backgroundColor: c.surface, gap: 12 }]}>
            {p.kinds.slice(0, 6).map(([k, n]) => (
              <View key={k} style={{ gap: 4 }}>
                <View style={styles.kindHead}>
                  <T variant="small">{k}</T>
                  <T variant="small" color="inkSoft">
                    {n}
                  </T>
                </View>
                <View style={[styles.track, { backgroundColor: c.surfaceRaised }]}>
                  <View
                    style={{
                      width: `${(n / kindMax) * 100}%`,
                      height: '100%',
                      borderRadius: 4,
                      backgroundColor: c.outer,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Section>
      )}

      <Section title="Intentions" style={{ marginTop: 4 }}>
        <View style={[styles.card, { backgroundColor: c.surface, gap: 10 }]}>
          <Line label="Set" value={String(p.intentions)} />
          <Line label="Manifested" value={String(p.manifested)} />
          <Line label="Released" value={String(p.released)} />
          {p.avgDaysToManifest != null && (
            <Line label="Average time to manifest" value={`${p.avgDaysToManifest} days`} />
          )}
          {p.topEmotion && (
            <Line
              label="Feeling you set them with most"
              value={`${emotionGlyph(p.topEmotion.label)} ${p.topEmotion.label}`}
            />
          )}
          {p.peakHour != null && (
            <Line label="Signs tend to arrive around" value={formatClock(p.peakHour, 0)} />
          )}
          <Line label="Days you’ve practised" value={String(p.activeDays)} />
        </View>
      </Section>
    </FormBody>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  const c = useColors();
  return (
    <View style={[styles.stat, { backgroundColor: c.surface }]}>
      <T variant="number">{value}</T>
      <T variant="caption" color="inkSoft">
        {label}
      </T>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <T variant="body" color="inkSoft" style={{ flex: 1 }}>
        {label}
      </T>
      <T variant="bodyStrong">{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: radius.card, padding: 14, gap: 2 },
  card: { borderRadius: radius.card, padding: 18 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 124 },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  baseline: { height: 1, marginTop: 0 },
  selRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  kindHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
