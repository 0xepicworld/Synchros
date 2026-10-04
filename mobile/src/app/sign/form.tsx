import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { INTENSITY_LABELS, SIGN_KINDS } from '@/content/vocab';
import { createSign, updateSign, useAppState } from '@/data/store';
import { addDays } from '@/lib/dates';
import { useColors } from '@/theme';
import { tap } from '@/ui/button';
import { Chip, ChipPicker } from '@/ui/chips';
import { Field } from '@/ui/field';
import { FormBody } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';
import { T } from '@/ui/text';

const WHEN = ['Just now', 'An hour ago', 'This morning', 'Yesterday'] as const;
type When = (typeof WHEN)[number];

function resolveWhen(w: When): string {
  const now = new Date();
  if (w === 'An hour ago') return new Date(now.getTime() - 3_600_000).toISOString();
  if (w === 'This morning') {
    const d = new Date(now);
    d.setHours(9, 0, 0, 0);
    return (d > now ? now : d).toISOString();
  }
  if (w === 'Yesterday') return addDays(now, -1).toISOString();
  return now.toISOString();
}

export default function SignForm() {
  const { id, intentionId } = useLocalSearchParams<{ id?: string; intentionId?: string }>();
  const s = useAppState();
  const c = useColors();
  const existing = id ? s.signs.find((x) => x.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [kind, setKind] = useState<string | null>(existing?.kind ?? null);
  const [intensity, setIntensity] = useState(existing?.intensity ?? 3);
  const [link, setLink] = useState<string | null>(existing?.intentionId ?? intentionId ?? null);
  const [when, setWhen] = useState<When>('Just now');

  // Active intentions, plus the currently linked one even if it's no longer active.
  const linkable = useMemo(
    () =>
      s.intentions
        .filter((i) => i.status === 'active' || i.id === link)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [s.intentions, link],
  );

  const canSave = title.trim().length > 0;
  const dirty = !!title || !!description;

  const save = () => {
    if (!canSave) return;
    const input = {
      title: title.trim(),
      description: description.trim(),
      kind,
      intentionId: link,
      intensity,
    };
    if (existing) updateSign(existing.id, input);
    else createSign({ ...input, occurredAt: resolveWhen(when) });
    tap('success');
    router.back();
  };

  const cancel = () => {
    if (existing || !dirty) return router.back();
    Alert.alert('Discard this sign?', 'What you’ve written will be lost.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <SheetHeader
        title={existing ? 'Edit sign' : 'Log a sign'}
        onCancel={cancel}
        onSave={save}
        canSave={canSave}
        tone="outer"
      />
      <FormBody>
        <Field
          label="What happened?"
          placeholder="Saw 11:11 on three clocks in a row"
          value={title}
          onChangeText={setTitle}
          autoFocus={!existing}
          maxLength={140}
          returnKeyType="next"
        />
        <ChipPicker label="Kind of sign" options={SIGN_KINDS} value={kind} onChange={setKind} tone="outer" />

        <View style={{ gap: 10 }}>
          <T variant="small" color="inkSoft">
            How strongly did it land?
          </T>
          <View style={styles.intensity} accessibilityRole="adjustable" accessibilityValue={{ min: 1, max: 5, now: intensity, text: INTENSITY_LABELS[intensity] }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="button"
                accessibilityLabel={`${n} of 5, ${INTENSITY_LABELS[n]}`}
                accessibilityState={{ selected: n === intensity }}
                hitSlop={6}
                onPress={() => {
                  tap();
                  setIntensity(n);
                }}
                style={[
                  styles.ray,
                  {
                    backgroundColor: n <= intensity ? c.outer : c.surfaceRaised,
                    height: 14 + n * 6,
                  },
                ]}
              />
            ))}
            <T variant="small" style={{ marginLeft: 8 }}>
              {INTENSITY_LABELS[intensity]}
            </T>
          </View>
        </View>

        {!existing && (
          <ChipPicker
            label="When"
            options={WHEN}
            value={when}
            onChange={(v) => setWhen((v as When) ?? 'Just now')}
            tone="outer"
          />
        )}

        <View style={{ gap: 10 }}>
          <T variant="small" color="inkSoft">
            Thread it to an intention
          </T>
          {linkable.length === 0 ? (
            <T variant="small" color="inkSoft">
              Set an intention first and you’ll be able to thread signs to it.
            </T>
          ) : (
            <View style={styles.wrap}>
              <Chip label="No thread" selected={link === null} onPress={() => setLink(null)} />
              {linkable.map((i) => (
                <Chip key={i.id} label={i.title} selected={link === i.id} onPress={() => setLink(i.id)} />
              ))}
            </View>
          )}
        </View>

        <Field
          label="Details"
          hint="Optional. What you saw, how it felt, why it seemed connected."
          placeholder="I’d just been thinking about calling her when…"
          value={description}
          onChangeText={setDescription}
          multiline
          minHeight={120}
        />
      </FormBody>
    </>
  );
}

const styles = StyleSheet.create({
  intensity: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  ray: { width: 22, borderRadius: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
