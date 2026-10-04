import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { INTENSITY_LABELS } from '@/content/vocab';
import { deleteSign, useAppState } from '@/data/store';
import { formatDay, formatTime } from '@/lib/dates';
import { radius, useColors } from '@/theme';
import { Button } from '@/ui/button';
import { EmptyState, IntentionMarker, SignMarker } from '@/ui/rows';
import { FormBody } from '@/ui/screen';
import { T } from '@/ui/text';

export default function SignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const c = useColors();
  const sign = s.signs.find((x) => x.id === id);
  const intention = sign?.intentionId ? s.intentions.find((i) => i.id === sign.intentionId) : null;

  if (!sign) {
    return (
      <FormBody>
        <EmptyState
          icon="circle"
          tone="outer"
          title="This sign is gone"
          body="It may have been deleted."
          action="Back"
          onAction={() => router.back()}
        />
      </FormBody>
    );
  }

  return (
    <FormBody>
      <View style={{ gap: 10 }}>
        <View style={styles.meta}>
          <SignMarker threaded={!!intention} />
          <T variant="small" color="inkSoft">
            {[sign.kind, `${formatDay(sign.occurredAt)}, ${formatTime(sign.occurredAt)}`].filter(Boolean).join(', ')}
          </T>
        </View>
        <T variant="title" accessibilityRole="header">
          {sign.title}
        </T>
        <View style={styles.meta}>
          <View style={styles.rays}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View
                key={n}
                style={[styles.ray, { height: 6 + n * 3, backgroundColor: n <= sign.intensity ? c.outer : c.line }]}
              />
            ))}
          </View>
          <T variant="small" color="inkSoft">
            {INTENSITY_LABELS[sign.intensity]}
          </T>
        </View>
      </View>

      {sign.description ? <T variant="reading">{sign.description}</T> : null}

      {intention ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Threaded to intention ${intention.title}`}
          onPress={() => router.push({ pathname: '/intention/[id]', params: { id: intention.id } })}
          style={({ pressed }) => [
            styles.thread,
            { borderColor: c.thread, backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 },
          ]}>
          <T variant="caption" color="thread">
            Threaded to
          </T>
          <View style={styles.meta}>
            <IntentionMarker status={intention.status} />
            <T variant="bodyStrong" style={{ flex: 1 }}>
              {intention.title}
            </T>
          </View>
        </Pressable>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button
          tone="quiet"
          icon="edit-2"
          label={intention ? 'Edit' : 'Edit or thread to an intention'}
          onPress={() => router.push({ pathname: '/sign/form', params: { id: sign.id } })}
        />
        <Button
          tone="danger"
          icon="trash-2"
          label="Delete sign"
          onPress={() =>
            Alert.alert('Delete this sign?', 'This can’t be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  router.back();
                  deleteSign(sign.id);
                },
              },
            ])
          }
        />
      </View>
    </FormBody>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rays: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  ray: { width: 6, borderRadius: 2 },
  thread: { borderLeftWidth: 3, borderRadius: radius.field, padding: 14, gap: 6 },
});
