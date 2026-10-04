import { Feather } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { insightByNumber, PATTERNS } from '@/content/insights';
import { isStageUnlocked } from '@/data/selectors';
import {
  completeStage,
  reopenStage,
  saveReflection,
  setKV,
  setPracticeDone,
  stageRequirements,
  startStage,
  useAppState,
} from '@/data/store';
import { formatDayInline } from '@/lib/dates';
import { radius, useColors } from '@/theme';
import { Button, tap } from '@/ui/button';
import { Field } from '@/ui/field';
import { EmptyState } from '@/ui/rows';
import { FormBody } from '@/ui/screen';
import { T } from '@/ui/text';

export default function InsightScreen() {
  const { n: nParam } = useLocalSearchParams<{ n: string }>();
  const n = Number(nParam);
  const insight = insightByNumber(n);
  const s = useAppState();
  const c = useColors();
  const stage = s.stages.find((x) => x.insight === n);
  const unlocked = isStageUnlocked(s, n);

  useEffect(() => {
    if (insight && unlocked) startStage(n);
  }, [n, insight, unlocked]);

  if (!insight || !unlocked) {
    return (
      <FormBody>
        <EmptyState
          icon="lock"
          title="This stage isn’t open yet"
          body="Stages open one at a time, in order."
          action="Back to the journey"
          onAction={() => router.back()}
        />
      </FormBody>
    );
  }

  const req = stageRequirements(n, s);
  const complete = !!stage?.completedAt;
  const next = insightByNumber(n + 1);

  return (
    <>
      <Stack.Screen options={{ title: `Stage ${n} of 9` }} />
      <FormBody>
        <View style={{ gap: 10 }}>
          <T variant="title" accessibilityRole="header">
            {insight.title}
          </T>
          {insight.teaching.map((p, i) => (
            <T key={i} variant="reading">
              {p}
            </T>
          ))}
        </View>

        {insight.feature === 'pattern' && (
          <View style={{ gap: 10 }}>
            <T variant="heading">Which pattern sounds most like you?</T>
            {PATTERNS.map((p) => {
              const selected = s.kv.pattern === p.key;
              return (
                <Pressable
                  key={p.key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    tap();
                    setKV('pattern', p.key);
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected ? c.innerSoft : c.surface,
                      borderColor: selected ? c.inner : c.line,
                    },
                  ]}>
                  <T variant="bodyStrong" color={selected ? 'inner' : 'ink'}>
                    {p.name}
                  </T>
                  <T variant="small" color="inkSoft">
                    {p.description}
                  </T>
                </Pressable>
              );
            })}
          </View>
        )}

        {insight.feature === 'question' && (
          <LiveQuestion initial={s.kv.liveQuestion ?? ''} />
        )}

        <View style={[styles.practice, { backgroundColor: c.surface }]}>
          <T variant="caption" color="inner">
            Practice
          </T>
          <T variant="reading">{insight.practice}</T>
          <Button
            size="sm"
            tone={req.practiceDone ? 'quiet' : 'inner'}
            icon={req.practiceDone ? 'check' : undefined}
            label={req.practiceDone ? insight.practiceDone : 'Mark as done'}
            onPress={() => setPracticeDone(n, !req.practiceDone)}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>

        <View style={{ gap: 18 }}>
          <T variant="heading">Reflect</T>
          {insight.prompts.map((prompt, i) => (
            <ReflectionField
              key={`${n}-${i}`}
              insight={n}
              index={i}
              prompt={prompt}
              initial={s.reflections.find((r) => r.id === `${n}-${i}`)?.text ?? ''}
            />
          ))}
          <T variant="caption" color="inkSoft">
            Reflections save as you type.
          </T>
        </View>

        {complete ? (
          <View style={{ gap: 12 }}>
            <View style={styles.doneRow}>
              <Feather name="check-circle" size={20} color={c.inner} />
              <T variant="bodyStrong" color="inner">
                Completed {formatDayInline(stage!.completedAt!)}
              </T>
            </View>
            {next ? (
              <Button
                size="lg"
                label={`Continue to stage ${next.n}`}
                onPress={() =>
                  router.replace({ pathname: '/insight/[n]', params: { n: String(next.n) } })
                }
              />
            ) : (
              <T variant="body" color="inkSoft">
                You’ve walked all nine stages. Keep logging signs; the journey is now a way of seeing.
              </T>
            )}
            <Button tone="outline" label="Reopen this stage" onPress={() => reopenStage(n)} />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Requirement done={req.practiceDone} label="Practice done" />
              <Requirement
                done={req.answered === req.total}
                label={`Reflections answered (${req.answered} of ${req.total})`}
              />
              {insight.feature === 'pattern' && (
                <Requirement done={!req.needsPattern} label="Pattern chosen" />
              )}
              {insight.feature === 'question' && (
                <Requirement done={!req.needsQuestion} label="Live question written" />
              )}
            </View>
            <Button
              size="lg"
              label="Complete this stage"
              disabled={!req.ready}
              onPress={() => {
                if (completeStage(n)) tap('success');
              }}
            />
          </View>
        )}
      </FormBody>
    </>
  );
}

function Requirement({ done, label }: { done: boolean; label: string }) {
  const c = useColors();
  return (
    <View style={styles.req} accessibilityLabel={`${label}: ${done ? 'done' : 'not yet'}`}>
      <Feather name={done ? 'check-circle' : 'circle'} size={18} color={done ? c.inner : c.inkSoft} />
      <T variant="small" color={done ? 'ink' : 'inkSoft'}>
        {label}
      </T>
    </View>
  );
}

/** Text field that autosaves (debounced) and also flushes when it loses focus or unmounts. */
function useAutosave(initial: string, save: (v: string) => void, delay = 700) {
  const [value, setValueState] = useState(initial);
  const latest = useRef(initial);
  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (value === initial) return;
    const t = setTimeout(() => saveRef.current(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Flush whatever was typed last when the screen closes.
  useEffect(() => () => saveRef.current(latest.current), []);

  const setValue = (v: string) => {
    latest.current = v;
    setValueState(v);
  };

  return { value, setValue, flush: () => saveRef.current(latest.current) };
}

function ReflectionField({
  insight,
  index,
  prompt,
  initial,
}: {
  insight: number;
  index: number;
  prompt: string;
  initial: string;
}) {
  const { value, setValue, flush } = useAutosave(initial, (v) => saveReflection(insight, index, v));
  return (
    <Field
      label={prompt}
      value={value}
      onChangeText={setValue}
      onBlur={flush}
      multiline
      minHeight={110}
      placeholder="Write freely…"
    />
  );
}

function LiveQuestion({ initial }: { initial: string }) {
  const { value, setValue, flush } = useAutosave(initial, (v) => setKV('liveQuestion', v.trim() || null));
  return (
    <Field
      label="Your live question"
      hint="Shown on your Today screen until you change it."
      value={value}
      onChangeText={setValue}
      onBlur={flush}
      multiline
      minHeight={80}
      placeholder="e.g. Where is my work meant to take me next?"
      maxLength={160}
    />
  );
}

const styles = StyleSheet.create({
  option: { borderWidth: 1.5, borderRadius: radius.field, padding: 14, gap: 4 },
  practice: { borderRadius: radius.card, padding: 18, gap: 10 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  req: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
