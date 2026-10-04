import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { manifestIntention, useAppState } from '@/data/store';
import { tap } from '@/ui/button';
import { Field } from '@/ui/field';
import { FormBody } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';
import { T } from '@/ui/text';

export default function Manifest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useAppState().intentions.find((i) => i.id === id);
  const [outcome, setOutcome] = useState('');

  const save = () => {
    if (!item) return router.back();
    manifestIntention(item.id, outcome.trim() || null);
    tap('success');
    router.back();
  };

  return (
    <>
      <SheetHeader title="It manifested" onCancel={() => router.back()} onSave={save} saveLabel="Mark manifested" />
      <FormBody>
        <View style={{ gap: 6 }}>
          <T variant="small" color="inkSoft">
            Intention
          </T>
          <T variant="heading">{item?.title ?? ''}</T>
        </View>
        <Field
          label="How did it show up?"
          hint="Optional, but future you will love reading this."
          placeholder="The call came the morning after I saw 444 three times…"
          value={outcome}
          onChangeText={setOutcome}
          multiline
          minHeight={180}
          autoFocus
        />
      </FormBody>
    </>
  );
}
