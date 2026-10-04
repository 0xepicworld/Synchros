import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';

import { SIGN_KINDS } from '@/content/vocab';
import { signsByDay } from '@/data/selectors';
import { useAppState } from '@/data/store';
import { formatDay } from '@/lib/dates';
import { gutter, useColors } from '@/theme';
import { IconButton } from '@/ui/button';
import { ChipPicker } from '@/ui/chips';
import { EmptyState, SignRow } from '@/ui/rows';
import { Screen } from '@/ui/screen';
import { T } from '@/ui/text';

export default function Signs() {
  const s = useAppState();
  const c = useColors();
  const [kind, setKind] = useState<string | null>(null);
  const [threadedOnly, setThreadedOnly] = useState(false);

  const titles = useMemo(() => new Map(s.intentions.map((i) => [i.id, i.title])), [s.intentions]);
  const kindsInUse = useMemo(() => {
    const used = new Set(s.signs.map((x) => x.kind).filter(Boolean) as string[]);
    return [...SIGN_KINDS.filter((k) => used.has(k)), ...[...used].filter((k) => !(SIGN_KINDS as readonly string[]).includes(k))];
  }, [s.signs]);

  const sections = useMemo(() => {
    const filtered = s.signs.filter(
      (x) => (!kind || x.kind === kind) && (!threadedOnly || !!x.intentionId),
    );
    return signsByDay(filtered);
  }, [s.signs, kind, threadedOnly]);

  const filters = ['Threaded', ...kindsInUse];

  return (
    <Screen
      scroll={false}
      title="Signs"
      actions={
        <IconButton icon="plus" tone="outer" label="Log a sign" onPress={() => router.push('/sign/form')} />
      }>
      {s.signs.length === 0 ? (
        <View style={{ paddingHorizontal: gutter }}>
          <EmptyState
            icon="eye"
            tone="outer"
            title="Your signs will gather here"
            body="Repeated numbers, chance meetings, songs at the right moment, vivid dreams. Log each one as it happens."
            action="Log a sign"
            onAction={() => router.push('/sign/form')}
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(x) => x.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 48 }}
          ListHeaderComponent={
            filters.length > 1 ? (
              <View style={{ marginVertical: 8, marginHorizontal: -gutter, paddingLeft: gutter }}>
                <ChipPicker
                  scroll
                  tone="outer"
                  options={filters}
                  value={threadedOnly ? 'Threaded' : kind}
                  onChange={(v) => {
                    if (v === 'Threaded') {
                      setThreadedOnly(true);
                      setKind(null);
                    } else {
                      setThreadedOnly(false);
                      setKind(v);
                    }
                  }}
                />
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <View style={{ paddingTop: 20, paddingBottom: 4, backgroundColor: c.bg }}>
              <T variant="subheading">{formatDay(section.date)}</T>
            </View>
          )}
          renderItem={({ item }) => (
            <SignRow
              item={item}
              intentionTitle={item.intentionId ? titles.get(item.intentionId) : null}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="filter"
              tone="outer"
              title="No signs match"
              body="Clear the filter to see everything you’ve logged."
            />
          }
        />
      )}
    </Screen>
  );
}
