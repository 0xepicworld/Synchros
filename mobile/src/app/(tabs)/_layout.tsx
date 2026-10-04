import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { BottomTabBarProps, Tabs } from 'expo-router/js-tabs';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '@/data/store';
import { font, useColors } from '@/theme';
import { tap } from '@/ui/button';
import { T } from '@/ui/text';

type Icon = ComponentProps<typeof Feather>['name'];

const TABS: Record<string, { label: string; icon: Icon }> = {
  index: { label: 'Today', icon: 'sun' },
  intentions: { label: 'Intentions', icon: 'square' },
  signs: { label: 'Signs', icon: 'circle' },
  journey: { label: 'Journey', icon: 'compass' },
};

export default function TabsLayout() {
  const { kv } = useAppState();
  if (!kv.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="intentions" />
      <Tabs.Screen name="signs" />
      <Tabs.Screen name="journey" />
    </Tabs>
  );
}

/**
 * Four destinations plus one action. Logging a sign is the thing people do
 * most, at the moment it happens, so it gets the centre of the bar.
 */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const item = (route: (typeof state.routes)[number], index: number) => {
    const meta = TABS[route.name];
    if (!meta) return null;
    const focused = state.index === index;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={meta.label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            tap();
            navigation.navigate(route.name);
          }
        }}
        style={styles.item}>
        <Feather name={meta.icon} size={21} color={focused ? c.inner : c.inkSoft} />
        <T
          variant="caption"
          style={{ color: focused ? c.ink : c.inkSoft, fontFamily: focused ? font.bodySemi : font.bodyMedium }}>
          {meta.label}
        </T>
      </Pressable>
    );
  };

  const routes = state.routes;
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: c.surface, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 10) },
      ]}>
      {routes.slice(0, 2).map((r, i) => item(r, i))}
      <View style={styles.item}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log a sign"
          onPress={() => {
            tap();
            router.push('/sign/form');
          }}
          style={({ pressed }) => [
            styles.log,
            { backgroundColor: c.outer, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}>
          <Feather name="plus" size={26} color={c.onOuter} />
        </Pressable>
      </View>
      {routes.slice(2).map((r, i) => item(r, i + 2))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  log: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
});
