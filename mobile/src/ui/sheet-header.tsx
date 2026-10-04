import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { font, gutter, useColors } from '@/theme';

import { T } from './text';

/** Header for modal sheets: Cancel on the left, title, primary action on the right. */
export function SheetHeader({
  title,
  onCancel,
  onSave,
  saveLabel = 'Save',
  canSave = true,
  tone = 'inner',
}: {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  canSave?: boolean;
  tone?: 'inner' | 'outer';
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  // iOS page sheets sit below the status bar already; Android modals are full screen.
  const top = Platform.OS === 'ios' ? 14 : insets.top + 10;
  const actionColor = tone === 'inner' ? c.inner : c.outer;
  return (
    <View style={[styles.bar, { paddingTop: top, backgroundColor: c.bg, borderBottomColor: c.line }]}>
      <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={10} style={styles.side}>
        <T variant="body" color="inkSoft">
          Cancel
        </T>
      </Pressable>
      <T variant="subheading" accessibilityRole="header" numberOfLines={1} style={{ flex: 1 }} center>
        {title}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave }}
        disabled={!canSave}
        onPress={onSave}
        hitSlop={10}
        style={[styles.side, { alignItems: 'flex-end' }]}>
        <T
          variant="body"
          style={{
            color: canSave ? (tone === 'outer' ? c.ink : actionColor) : c.inkSoft,
            fontFamily: font.bodySemi,
            opacity: canSave ? 1 : 0.6,
          }}>
          {saveLabel}
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  side: { minWidth: 64, minHeight: 32, justifyContent: 'center' },
});
