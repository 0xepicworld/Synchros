import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { intentionsByStatus, signCounts } from '@/data/selectors';
import { useAppState } from '@/data/store';
import type { IntentionStatus } from '@/data/types';
import { IconButton } from '@/ui/button';
import { Segmented } from '@/ui/chips';
import { EmptyState, IntentionRow } from '@/ui/rows';
import { Screen } from '@/ui/screen';

const EMPTY: Record<IntentionStatus, { title: string; body: string }> = {
  active: {
    title: 'Set your first intention',
    body: 'Write what you want to bring into your life, as if it is already on its way.',
  },
  manifested: {
    title: 'Nothing manifested yet',
    body: 'When an intention comes true, open it and mark it as manifested. It will live here.',
  },
  released: {
    title: 'Nothing released',
    body: 'Intentions you let go of land here, so you can look back on how your wants have changed.',
  },
};

export default function Intentions() {
  const s = useAppState();
  const [tab, setTab] = useState<IntentionStatus>('active');
  const list = useMemo(() => intentionsByStatus(s, tab), [s, tab]);
  const counts = useMemo(() => signCounts(s), [s]);
  const total = (st: IntentionStatus) => s.intentions.filter((i) => i.status === st).length;

  return (
    <Screen
      title="Intentions"
      actions={
        <>
          <IconButton icon="image" label="Vision board" onPress={() => router.push('/board')} />
          <IconButton
            icon="plus"
            tone="inner"
            label="New intention"
            onPress={() => router.push('/intention/form')}
          />
        </>
      }>
      <View style={{ marginTop: 8, marginBottom: 8 }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { key: 'active', label: 'Active', count: total('active') },
            { key: 'manifested', label: 'Manifested', count: total('manifested') },
            { key: 'released', label: 'Released', count: total('released') },
          ]}
        />
      </View>
      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'manifested' ? 'star' : tab === 'released' ? 'feather' : 'square'}
          title={EMPTY[tab].title}
          body={EMPTY[tab].body}
          action={tab === 'active' ? 'New intention' : undefined}
          onAction={tab === 'active' ? () => router.push('/intention/form') : undefined}
        />
      ) : (
        list.map((i) => <IntentionRow key={i.id} item={i} signs={counts.get(i.id) ?? 0} />)
      )}
    </Screen>
  );
}
