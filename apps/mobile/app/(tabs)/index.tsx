import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHealthQuery } from '@/queries/health';

export default function HomeScreen() {
  const health = useHealthQuery();

  return (
    <SafeAreaView className="flex-1 bg-film-bg">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-film-chalk">Film Room</Text>
        <Text className="mt-2 text-lg text-film-chalk/80">
          Weekly scenarios, standings, and rivalries for your league.
        </Text>

        <View className="mt-8 rounded-xl border border-film-orange/40 bg-film-field/30 p-4">
          <Text className="text-sm font-medium text-film-gold">API · GET /health</Text>
          {health.isPending ? (
            <ActivityIndicator className="mt-3" color="#FF6B35" />
          ) : health.isError ? (
            <Text className="mt-2 text-sm text-red-400">
              {health.error instanceof Error ? health.error.message : 'Request failed'}
            </Text>
          ) : (
            <Text className="mt-2 font-mono text-sm text-film-chalk/90">
              {health.data?.status} · {health.data?.ts}
            </Text>
          )}
          <Text className="mt-3 text-xs text-film-chalk/60">
            Point EXPO_PUBLIC_API_URL at your API (use your machine LAN IP with Expo Go, not localhost).
          </Text>
        </View>

        <View className="mt-6 rounded-xl border border-white/10 p-4">
          <Text className="text-sm font-medium text-film-chalk/90">V7 · League-first</Text>
          <Text className="mt-2 text-film-chalk/75">
            Auth session store + API client are wired (Zustand + SecureStore). Login routes come next.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
