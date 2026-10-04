import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { EMOTIONS, INTENTION_CATEGORIES } from '@/content/vocab';
import { createIntention, updateIntention, useAppState } from '@/data/store';
import { tap } from '@/ui/button';
import { ChipPicker } from '@/ui/chips';
import { Field } from '@/ui/field';
import { FormBody } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';

export default function IntentionForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const s = useAppState();
  const existing = id ? s.intentions.find((i) => i.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [script, setScript] = useState(existing?.script ?? '');
  const [category, setCategory] = useState<string | null>(existing?.category ?? null);
  const [emotion, setEmotion] = useState<string | null>(existing?.emotion ?? null);
  const [keywords, setKeywords] = useState(existing?.keywords ?? '');

  const dirty =
    title !== (existing?.title ?? '') ||
    script !== (existing?.script ?? '') ||
    category !== (existing?.category ?? null) ||
    emotion !== (existing?.emotion ?? null) ||
    keywords !== (existing?.keywords ?? '');
  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const input = {
      title: title.trim(),
      script: script.trim(),
      category,
      emotion,
      keywords: keywords.trim() || null,
    };
    if (existing) {
      updateIntention(existing.id, input);
      tap('success');
      router.back();
    } else {
      const created = createIntention(input);
      tap('success');
      router.replace({ pathname: '/intention/[id]', params: { id: created.id } });
    }
  };

  const cancel = () => {
    if (!dirty) return router.back();
    Alert.alert('Discard this intention?', 'What you’ve written will be lost.', [
      { text: 'Keep writing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <>
      <SheetHeader
        title={existing ? 'Edit intention' : 'New intention'}
        onCancel={cancel}
        onSave={save}
        canSave={canSave}
      />
      <FormBody>
        <Field
          label="Intention"
          hint="Short and in the present tense works best."
          placeholder="I land a creative role I love"
          value={title}
          onChangeText={setTitle}
          autoFocus={!existing}
          maxLength={120}
          returnKeyType="next"
        />
        <Field
          label="Script"
          hint="Describe it as if it has already happened. How does it feel?"
          placeholder="It’s a Tuesday morning and I’m walking into the studio…"
          value={script}
          onChangeText={setScript}
          multiline
          minHeight={160}
        />
        <ChipPicker label="Area of life" options={INTENTION_CATEGORIES} value={category} onChange={setCategory} />
        <ChipPicker
          label="The feeling behind it"
          options={EMOTIONS.map((e) => `${e.glyph} ${e.label}`)}
          value={emotion ? `${EMOTIONS.find((e) => e.label === emotion)?.glyph ?? ''} ${emotion}` : null}
          onChange={(v) => setEmotion(v ? v.split(' ').slice(1).join(' ') : null)}
        />
        <Field
          label="Keywords"
          hint="Optional. Words you want to watch for, separated by commas."
          placeholder="studio, mentor, yes"
          value={keywords}
          onChangeText={setKeywords}
          autoCapitalize="none"
        />
      </FormBody>
    </>
  );
}
