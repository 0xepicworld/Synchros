import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setKV } from '@/data/store';
import { remindersSupported, scheduleDailyReminder } from '@/lib/reminders';
import { gutter, useColors } from '@/theme';
import { Button, tap } from '@/ui/button';
import { Field } from '@/ui/field';
import { Mark, Rings } from '@/ui/motif';
import { IntentionMarker, SignMarker } from '@/ui/rows';
import { T } from '@/ui/text';
import { TimeStepper } from '@/ui/time-stepper';

export default function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [remind, setRemind] = useState(remindersSupported);
  const [hour, setHour] = useState(21);
  const [minute, setMinute] = useState(0);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    if (name.trim()) setKV('name', name.trim());
    setKV('reminderHour', String(hour));
    setKV('reminderMinute', String(minute));
    if (remind) {
      const ok = await scheduleDailyReminder(hour, minute).catch(() => false);
      setKV('reminderEnabled', ok ? '1' : null);
    }
    setKV('onboarded', '1');
    tap('success');
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.progress} accessibilityLabel={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.pip, { backgroundColor: i <= step ? c.inner : c.line }]}
            />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.page}>
            <Mark size={72} />
            <T variant="hero">Synchros</T>
            <T variant="reading" color="inkSoft">
              A quiet place to notice when your inner world and the outer world line up.
            </T>
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Rings inner={3} outer={7} threads={4} size={300} />
            </View>
            <T variant="body" color="inkSoft">
              Set an intention. Log the signs that show up. Over time, you’ll see the threads.
            </T>
          </View>
        )}

        {step === 1 && (
          <View style={styles.page}>
            <T variant="title">How it works</T>
            <Explainer
              marker={<IntentionMarker status="active" />}
              title="Intentions"
              body="What you want to bring into your life, written in your own words."
            />
            <Explainer
              marker={<SignMarker threaded={false} />}
              title="Signs"
              body="Coincidences, repeated numbers, well-timed conversations, dreams. Log them the moment they happen."
            />
            <Explainer
              marker={<SignMarker threaded />}
              title="Threads"
              body="Connect a sign to the intention it speaks to. Threads are where the meaning shows up."
            />
            <Explainer
              marker={<T variant="bodyStrong" color="inner">9</T>}
              title="The journey"
              body="Nine guided stages, one at a time, that deepen how you notice and respond."
            />
            <T variant="small" color="inkSoft">
              Everything stays on this phone. No account, no tracking.
            </T>
          </View>
        )}

        {step === 2 && (
          <View style={styles.page}>
            <T variant="title">Make it yours</T>
            <Field
              label="What should we call you?"
              hint="Optional. Only shown on your Today screen."
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={40}
            />
            {remindersSupported && (
              <View style={{ gap: 12 }}>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T variant="bodyStrong">Evening reminder</T>
                    <T variant="small" color="inkSoft">
                      One gentle nudge a day to log what you noticed.
                    </T>
                  </View>
                  <Switch
                    value={remind}
                    onValueChange={setRemind}
                    trackColor={{ true: c.inner, false: c.line }}
                    accessibilityLabel="Daily reminder"
                  />
                </View>
                {remind && (
                  <TimeStepper
                    hour={hour}
                    minute={minute}
                    onChange={(h, m) => {
                      setHour(h);
                      setMinute(m);
                    }}
                  />
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.actions}>
          {step < 2 ? (
            <Button label="Continue" size="lg" onPress={() => setStep(step + 1)} />
          ) : (
            <Button label="Begin" size="lg" loading={busy} onPress={finish} />
          )}
          {step > 0 && (
            <Button label="Back" tone="outline" onPress={() => setStep(step - 1)} />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Explainer({ marker, title, body }: { marker: ReactNode; title: string; body: string }) {
  return (
    <View style={styles.explainer}>
      <View style={styles.markerCol}>{marker}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="subheading">{title}</T>
        <T variant="body" color="inkSoft">
          {body}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flexGrow: 1, paddingHorizontal: gutter, gap: 24 },
  progress: { flexDirection: 'row', gap: 6 },
  pip: { flex: 1, height: 4, borderRadius: 2 },
  page: { flex: 1, gap: 18 },
  explainer: { flexDirection: 'row', gap: 16 },
  markerCol: { width: 20, alignItems: 'center', paddingTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actions: { gap: 10 },
});
