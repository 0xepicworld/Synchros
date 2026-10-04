import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { bringCardForward, deleteCard, moveCard, useAppState } from '@/data/store';
import type { VisionCard } from '@/data/types';
import { imageUri } from '@/lib/vision-files';
import { radius, useColors } from '@/theme';
import { IconButton, tap } from '@/ui/button';
import { EmptyState } from '@/ui/rows';
import { T } from '@/ui/text';

const CARD_W = 150;

export default function Board() {
  const s = useAppState();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const cards = useMemo(() => [...s.cards].sort((a, b) => a.z - b.z), [s.cards]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const remove = useCallback((id: string) => {
    Alert.alert('Remove this card?', 'Its photo is removed from the board too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSelected(null);
          deleteCard(id);
        },
      },
    ]);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton icon="plus" tone="inner" label="Add a card" onPress={() => router.push('/card/new')} />
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {cards.length > 0 && (
          <T variant="small" color="inkSoft" style={styles.hint}>
            Drag to arrange. Pinch to resize, twist to turn. Tap a card for options.
          </T>
        )}
        <View
          style={[styles.canvas, { borderColor: c.line, marginBottom: insets.bottom + 12 }]}
          onLayout={onLayout}
          accessibilityLabel="Vision board">
          {selected && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setSelected(null)}
              accessibilityLabel="Deselect card"
            />
          )}
          {cards.length === 0 ? (
            <EmptyState
              icon="image"
              title="Picture it"
              body="Add photos and words for what you’re calling in. Arrange them however feels right."
              action="Add a card"
              onAction={() => router.push('/card/new')}
            />
          ) : size.w > 0 ? (
            cards.map((card) => (
              <BoardCard
                key={card.id}
                card={card}
                board={size}
                selected={selected === card.id}
                onSelect={setSelected}
                onRemove={remove}
              />
            ))
          ) : null}
        </View>
      </View>
    </>
  );
}

function BoardCard({
  card,
  board,
  selected,
  onSelect,
  onRemove,
}: {
  card: VisionCard;
  board: { w: number; h: number };
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const c = useColors();
  const uri = imageUri(card.imageName);
  const cardH = uri ? CARD_W + 40 : 96;

  // Centre position in px.
  const x = useSharedValue(card.x * board.w);
  const y = useSharedValue(card.y * board.h);
  const scale = useSharedValue(card.scale);
  const rot = useSharedValue(card.rotation);
  const start = useSharedValue({ x: 0, y: 0, scale: 1, rot: 0 });

  // Keep in sync if the stored card changes (restore, rotation of device, etc.).
  useEffect(() => {
    x.set(card.x * board.w);
    y.set(card.y * board.h);
    scale.set(card.scale);
    rot.set(card.rotation);
  }, [card.x, card.y, card.scale, card.rotation, board.w, board.h, x, y, scale, rot]);

  const persist = useCallback(
    (px: number, py: number, sc: number, r: number) => {
      moveCard(card.id, {
        x: Math.min(1, Math.max(0, px / board.w)),
        y: Math.min(1, Math.max(0, py / board.h)),
        scale: sc,
        rotation: r,
      });
    },
    [card.id, board.w, board.h],
  );

  const begin = useCallback(() => bringCardForward(card.id), [card.id]);
  const select = useCallback(() => {
    tap();
    onSelect(card.id);
  }, [card.id, onSelect]);

  const w = board.w;
  const h = board.h;

  const pan = Gesture.Pan()
    .onStart(() => {
      start.set({ x: x.get(), y: y.get(), scale: scale.get(), rot: rot.get() });
      scheduleOnRN(begin);
    })
    .onUpdate((e) => {
      x.set(Math.min(w, Math.max(0, start.get().x + e.translationX)));
      y.set(Math.min(h, Math.max(0, start.get().y + e.translationY)));
    })
    .onEnd(() => {
      scheduleOnRN(persist, x.get(), y.get(), scale.get(), rot.get());
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      start.set({ ...start.get(), scale: scale.get() });
    })
    .onUpdate((e) => {
      scale.set(Math.min(3, Math.max(0.4, start.get().scale * e.scale)));
    })
    .onEnd(() => {
      scheduleOnRN(persist, x.get(), y.get(), scale.get(), rot.get());
    });

  const rotation = Gesture.Rotation()
    .onStart(() => {
      start.set({ ...start.get(), rot: rot.get() });
    })
    .onUpdate((e) => {
      rot.set(start.get().rot + e.rotation);
    })
    .onEnd(() => {
      scheduleOnRN(persist, x.get(), y.get(), scale.get(), rot.get());
    });

  const tapGesture = Gesture.Tap().onEnd((_e, success) => {
    if (success) scheduleOnRN(select);
  });

  const gesture = Gesture.Simultaneous(pan, pinch, rotation, tapGesture);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() - CARD_W / 2 },
      { translateY: y.get() - cardH / 2 },
      { scale: scale.get() },
      { rotate: `${rot.get()}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessible
        accessibilityLabel={`Vision card: ${card.title}`}
        accessibilityActions={[{ name: 'delete', label: 'Remove card' }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && onRemove(card.id)}
        style={[
          styles.card,
          {
            width: CARD_W,
            zIndex: card.z,
            backgroundColor: uri ? c.surface : c.innerSoft,
            borderColor: selected ? c.thread : 'transparent',
          },
          style,
        ]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} />
        ) : null}
        <View style={uri ? styles.caption : styles.textOnly}>
          <T variant={uri ? 'small' : 'subheading'} color={uri ? 'ink' : 'inner'} numberOfLines={3} center={!uri}>
            {card.title}
          </T>
        </View>
        {selected && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove card"
            onPress={() => onRemove(card.id)}
            style={[styles.remove, { backgroundColor: c.danger }]}>
            <Feather name="x" size={16} color="#fff" />
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hint: { paddingHorizontal: 20, paddingBottom: 8 },
  canvas: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: radius.sheet,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 16,
    borderWidth: 2.5,
    overflow: 'visible',
    shadowColor: '#1A1840',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  image: { width: '100%', height: CARD_W, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
  caption: { padding: 10, minHeight: 40 },
  textOnly: { minHeight: 96, padding: 14, justifyContent: 'center' },
  remove: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
