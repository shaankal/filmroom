import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="league/[leagueId]"
          options={{
            title: 'League',
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#F0EDE6',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="challenge/[leagueId]"
          options={{
            title: 'Weekly Challenge',
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#F0EDE6',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="challenge/[leagueId]/results"
          options={{
            title: 'Results',
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#F0EDE6',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="h2h/[id]"
          options={{
            title: 'H2H',
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#F0EDE6',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="sunday/[windowId]"
          options={{
            title: 'Sunday Live',
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#F0EDE6',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="legal"
          options={{
            title: 'Legal',
            headerStyle: { backgroundColor: '#0D0D0D' },
            headerTintColor: '#F0EDE6',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
