import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { INSIGHTS } from '@/content/insights';
import { completedStageCount, currentInsight, isStageComplete, isStageUnlocked } from '@/data/selectors';
import { useAppState } from '@/data/store';
import { useColors } from '@/theme';
import { Screen } from '@/ui/screen';
import { T } from '@/ui/text';

export default function Journey() {
  const s = useAppState();
  const c = useColors();
  const current = currentInsight(s);
  const done = completedStageCount(s);

  return (
    <Screen title="The journey" subtitle={done === 9 ? 'All nine stages complete' : `${done} of 9 stages complete`}>
      <T variant="body" color="inkSoft" style={{ marginTop: 4, marginBottom: 20 }}>
        Nine stages, taken in order. Each has a short teaching, one practice and three reflections.
        Move on when it feels true, not when the clock says so.
      </T>

      <View>
        {INSIGHTS.map((insight, idx) => {
          const complete = isStageComplete(s, insight.n);
          const unlocked = isStageUnlocked(s, insight.n);
          const isCurrent = current === insight.n;
          const last = idx === INSIGHTS.length - 1;
          const state = complete ? 'complete' : isCurrent ? 'current' : 'locked';
          return (
            <Pressable
              key={insight.n}
              accessibilityRole="button"
              accessibilityLabel={`Stage ${insight.n}, ${insight.title}, ${state}`}
              onPress={() => {
                if (!unlocked) {
                  Alert.alert(
                    'Not open yet',
                    `Complete stage ${insight.n - 1} to open “${insight.title}”.`,
                  );
                  return;
                }
                router.push({ pathname: '/insight/[n]', params: { n: String(insight.n) } });
              }}
              style={({ pressed }) => [styles.step, pressed && unlocked && { opacity: 0.7 }]}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    complete && { backgroundColor: c.inner, borderColor: c.inner },
                    isCurrent && { borderColor: c.thread, backgroundColor: c.surface },
                    !unlocked && { borderColor: c.line, backgroundColor: c.bg },
                  ]}>
                  {complete ? (
                    <Feather name="check" size={18} color={c.onInner} />
                  ) : unlocked ? (
                    <T variant="bodyStrong" color={isCurrent ? 'thread' : 'inner'}>
                      {insight.n}
                    </T>
                  ) : (
                    <T variant="bodyStrong" color="inkSoft">
                      {insight.n}
                    </T>
                  )}
                </View>
                {!last && (
                  <View
                    style={[styles.line, { backgroundColor: complete ? c.inner : c.line }]}
                  />
                )}
              </View>
              <View style={[styles.text, last && { paddingBottom: 0 }]}>
                <T variant="subheading" color={unlocked ? 'ink' : 'inkSoft'}>
                  {insight.title}
                </T>
                <T variant="small" color="inkSoft">
                  {insight.essence}
                </T>
                {isCurrent && (
                  <T variant="small" color="thread" style={{ marginTop: 4 }}>
                    You are here
                  </T>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <T variant="caption" color="inkSoft" style={{ marginTop: 28 }}>
        Inspired by ideas popularised in James Redfield’s novel The Celestine Prophecy. Synchros is not
        affiliated with or endorsed by the author.
      </T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 16 },
  rail: { alignItems: 'center', width: 40 },
  node: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2.5, flex: 1, minHeight: 24 },
  text: { flex: 1, paddingTop: 8, paddingBottom: 28, gap: 2 },
});
