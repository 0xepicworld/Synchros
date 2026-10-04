import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Switch, View } from 'react-native';

import { PRIVACY_URL, SUPPORT_EMAIL } from '@/content/app-info';

import { getState, setKV, useAppState, wipeAll } from '@/data/store';
import type { ThemePref } from '@/data/types';
import { pickBackup, restoreBackup, shareBackup } from '@/lib/backup';
import { cancelReminders, remindersSupported, scheduleDailyReminder } from '@/lib/reminders';
import { radius, useColors } from '@/theme';
import { Button } from '@/ui/button';
import { Segmented } from '@/ui/chips';
import { Field } from '@/ui/field';
import { Mark } from '@/ui/motif';
import { FormBody, Section } from '@/ui/screen';
import { T } from '@/ui/text';
import { TimeStepper } from '@/ui/time-stepper';


export default function Settings() {
  const s = useAppState();
  const c = useColors();
  const [name, setName] = useState(s.kv.name ?? '');
  const [busy, setBusy] = useState<string | null>(null);

  const reminderOn = s.kv.reminderEnabled === '1';
  const hour = Number(s.kv.reminderHour ?? 21);
  const minute = Number(s.kv.reminderMinute ?? 0);

  const toggleReminder = async (on: boolean) => {
    if (!on) {
      await cancelReminders();
      setKV('reminderEnabled', null);
      return;
    }
    const ok = await scheduleDailyReminder(hour, minute).catch(() => false);
    if (ok) setKV('reminderEnabled', '1');
    else
      Alert.alert(
        'Notifications are off',
        'Allow notifications for Synchros in your phone’s Settings, then turn the reminder on again.',
      );
  };

  const changeTime = async (h: number, m: number) => {
    setKV('reminderHour', String(h));
    setKV('reminderMinute', String(m));
    if (reminderOn) await scheduleDailyReminder(h, m).catch(() => false);
  };

  const exportData = async () => {
    setBusy('export');
    try {
      const r = await shareBackup();
      if (r === 'unavailable') Alert.alert('Sharing isn’t available on this device.');
    } catch {
      Alert.alert('Backup failed', 'Your journal couldn’t be written to a file. Free up some space and try again.');
    } finally {
      setBusy(null);
    }
  };

  const importData = async () => {
    try {
      const snap = await pickBackup();
      if (!snap) return;
      Alert.alert(
        'Replace your journal?',
        `This backup has ${snap.intentions.length} intentions and ${snap.signs.length} signs. Everything currently on this phone will be replaced.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              setBusy('import');
              try {
                await restoreBackup(snap);
                const kv = getState().kv;
                if (kv.reminderEnabled === '1') {
                  await scheduleDailyReminder(Number(kv.reminderHour ?? 21), Number(kv.reminderMinute ?? 0)).catch(() => false);
                } else {
                  await cancelReminders();
                }
                setName(kv.name ?? '');
                Alert.alert('Journal restored');
              } catch {
                Alert.alert('Restore failed', 'Nothing was changed. Try again with the same file.');
              } finally {
                setBusy(null);
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert('Couldn’t read that file', e instanceof Error ? e.message : undefined);
    }
  };

  const deleteEverything = () =>
    Alert.alert(
      'Delete everything?',
      'All intentions, signs, reflections, journey progress and vision board cards will be permanently erased from this phone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await cancelReminders();
            await wipeAll();
            router.replace('/onboarding');
          },
        },
      ],
    );

  return (
    <FormBody>
      <Field
        label="Your name"
        value={name}
        onChangeText={setName}
        onBlur={() => setKV('name', name.trim() || null)}
        placeholder="Optional"
        autoCapitalize="words"
        maxLength={40}
      />

      <View style={{ gap: 10 }}>
        <T variant="small" color="inkSoft">
          Appearance
        </T>
        <Segmented<ThemePref>
          value={s.kv.themePref ?? 'system'}
          onChange={(v) => setKV('themePref', v === 'system' ? null : v)}
          options={[
            { key: 'system', label: 'Automatic' },
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
          ]}
        />
      </View>

      {remindersSupported && (
        <View style={{ gap: 12 }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong">Daily reminder</T>
              <T variant="small" color="inkSoft">
                A gentle nudge to log what you noticed.
              </T>
            </View>
            <Switch
              value={reminderOn}
              onValueChange={toggleReminder}
              trackColor={{ true: c.inner, false: c.line }}
              accessibilityLabel="Daily reminder"
            />
          </View>
          {reminderOn && <TimeStepper hour={hour} minute={minute} onChange={changeTime} />}
        </View>
      )}

      <Section title="Your data" style={{ marginTop: 4 }}>
        <T variant="body" color="inkSoft">
          Your journal lives only on this phone. Save a backup file to move it to a new phone or keep it safe.
          Vision board photos stay on the device and aren’t included.
        </T>
        <Button tone="quiet" icon="download" label="Save a backup" loading={busy === 'export'} onPress={exportData} />
        <Button tone="quiet" icon="upload" label="Restore from a backup" loading={busy === 'import'} onPress={importData} />
      </Section>

      <Section title="About" style={{ marginTop: 4 }}>
        <View style={[styles.about, { backgroundColor: c.surface }]}>
          <Mark size={44} />
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong">Synchros</T>
            <T variant="small" color="inkSoft">
              Version {Constants.expoConfig?.version ?? '1.0.0'}, made by EPICWORLD
            </T>
          </View>
        </View>
        <Button tone="outline" label="Privacy policy" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />
        <Button
          tone="outline"
          label="Contact support"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Synchros%20support`).catch(() => Alert.alert(SUPPORT_EMAIL))}
        />
        <T variant="caption" color="inkSoft">
          The journey is inspired by ideas popularised in James Redfield’s novel The Celestine Prophecy. Synchros is
          not affiliated with or endorsed by the author.
        </T>
      </Section>

      <Button tone="danger" icon="trash-2" label="Delete all data" onPress={deleteEverything} style={{ marginTop: 12 }} />
    </FormBody>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  about: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.card },
});
