import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Figtree_400Regular,
  Figtree_400Regular_Italic,
  Figtree_500Medium,
  Figtree_600SemiBold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { loadStore, useAppState } from '@/data/store';
import { font, useColors, useScheme } from '@/theme';
import { T } from '@/ui/text';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_400Regular_Italic,
    Figtree_500Medium,
    Figtree_600SemiBold,
  });
  const { ready } = useAppState();

  useEffect(() => {
    loadStore();
  }, []);

  // Fonts failing to load must never block the app; it falls back to system fonts.
  const appReady = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedStack />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const scheme = useScheme();
  const c = useColors();
  const { error } = useAppState();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.inner,
      background: c.bg,
      card: c.bg,
      text: c.ink,
      border: c.line,
    },
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', padding: 32, gap: 8 }}>
        <T variant="heading">Something went wrong</T>
        <T color="inkSoft">{error}</T>
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.inner,
          headerTitleStyle: { fontFamily: font.display, color: c.ink },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="intention/[id]" options={{ title: '' }} />
        <Stack.Screen name="sign/[id]" options={{ title: '' }} />
        <Stack.Screen name="insight/[n]" options={{ title: '' }} />
        <Stack.Screen name="patterns" options={{ title: 'Patterns' }} />
        <Stack.Screen name="board" options={{ title: 'Vision board' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="intention/form" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="intention/manifest" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="sign/form" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="card/new" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
