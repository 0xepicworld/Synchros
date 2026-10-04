import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, View } from 'react-native';

import { emotionGlyph } from '@/content/vocab';
import { signsFor } from '@/data/selectors';
import { deleteIntention, releaseIntention, reopenIntention, useAppState } from '@/data/store';
import { daysBetween, formatDayInline } from '@/lib/dates';
import { font, radius, useColors } from '@/theme';
import { Button, IconButton } from '@/ui/button';
import { EmptyState, IntentionMarker, SignRow } from '@/ui/rows';
import { FormBody, Section } from '@/ui/screen';
import { T } from '@/ui/text';

export default function IntentionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const c = useColors();
  const item = s.intentions.find((i) => i.id === id);
  const signs = useMemo(() => (item ? signsFor(s, item.id) : []), [s, item]);

  if (!item) {
    return (
      <FormBody>
        <EmptyState
          icon="square"
          title="This intention is gone"
          body="It may have been deleted."
          action="Back"
          onAction={() => router.back()}
        />
      </FormBody>
    );
  }

  const confirmDelete = () =>
    Alert.alert(
      'Delete this intention?',
      signs.length
        ? `Its ${signs.length} ${signs.length === 1 ? 'sign stays' : 'signs stay'} in your log, unthreaded.`
        : 'This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            router.back();
            deleteIntention(item.id);
          },
        },
      ],
    );

  const more = () => {
    const actions =
      item.status === 'active'
        ? ['Edit', 'Release', 'Delete', 'Cancel']
        : ['Edit', 'Make active again', 'Delete', 'Cancel'];
    const run = (i: number) => {
      if (i === 0) router.push({ pathname: '/intention/form', params: { id: item.id } });
      if (i === 1) (item.status === 'active' ? releaseIntention : reopenIntention)(item.id);
      if (i === 2) confirmDelete();
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: actions, cancelButtonIndex: 3, destructiveButtonIndex: 2 },
        run,
      );
    } else {
      Alert.alert(item.title, undefined, [
        { text: actions[0], onPress: () => run(0) },
        { text: actions[1], onPress: () => run(1) },
        { text: actions[2], style: 'destructive', onPress: () => run(2) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const statusLine =
    item.status === 'manifested' && item.completedAt
      ? `Manifested ${formatDayInline(item.completedAt)}, ${daysBetween(item.createdAt, item.completedAt)} days after you set it`
      : item.status === 'released'
        ? `Released ${item.completedAt ? formatDayInline(item.completedAt) : ''}`
        : `Set ${formatDayInline(item.createdAt)}`;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <IconButton icon="more-horizontal" tone="plain" label="More actions" onPress={more} />,
        }}
      />
      <FormBody>
        <View style={{ gap: 10 }}>
          <View style={styles.statusRow}>
            <IntentionMarker status={item.status} />
            <T variant="small" color="inkSoft">
              {statusLine}
            </T>
          </View>
          <T variant="title" accessibilityRole="header">
            {item.title} {emotionGlyph(item.emotion)}
          </T>
          {[item.category, item.emotion].some(Boolean) && (
            <T variant="small" color="inkSoft">
              {[item.category, item.emotion && `feeling ${item.emotion.toLowerCase()}`].filter(Boolean).join(', ')}
            </T>
          )}
        </View>

        {item.script ? (
          <T variant="reading" style={{ fontFamily: font.bodyItalic }}>
            {item.script}
          </T>
        ) : null}

        {item.keywords ? (
          <View style={styles.keywords}>
            {item.keywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
              .map((k) => (
                <View key={k} style={[styles.keyword, { backgroundColor: c.innerSoft }]}>
                  <T variant="caption" color="inner">
                    {k}
                  </T>
                </View>
              ))}
          </View>
        ) : null}

        {item.status === 'manifested' && item.outcome ? (
          <View style={[styles.outcome, { backgroundColor: c.surface, borderColor: c.inner }]}>
            <T variant="caption" color="inner">
              How it showed up
            </T>
            <T variant="reading">{item.outcome}</T>
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <Button
            tone="outer"
            icon="plus"
            label="Log a sign for this"
            onPress={() => router.push({ pathname: '/sign/form', params: { intentionId: item.id } })}
          />
          {item.status === 'active' && (
            <Button
              tone="inner"
              icon="star"
              label="It manifested"
              onPress={() => router.push({ pathname: '/intention/manifest', params: { id: item.id } })}
            />
          )}
        </View>

        <Section title={signs.length ? `Threads (${signs.length})` : 'Threads'} style={{ marginTop: 6 }}>
          {signs.length === 0 ? (
            <T variant="body" color="inkSoft">
              No signs threaded yet. When something feels connected to this intention, log it here.
            </T>
          ) : (
            <View>
              {signs.map((x) => (
                <SignRow key={x.id} item={x} showDay />
              ))}
            </View>
          )}
        </Section>
      </FormBody>
    </>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  keyword: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  outcome: { borderRadius: radius.card, padding: 18, gap: 6, borderLeftWidth: 3 },
});
