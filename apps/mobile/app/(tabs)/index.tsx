import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-film-bg">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-film-chalk">Film Room</Text>
        <Text className="mt-2 text-lg text-film-chalk/80">
          Weekly scenarios, standings, and rivalries for your league.
        </Text>
        <View className="mt-8 rounded-xl border border-film-orange/40 bg-film-field/30 p-4">
          <Text className="text-sm font-medium text-film-gold">V7 · League-first</Text>
          <Text className="mt-2 text-film-chalk/90">
            Connect the API and Supabase env vars to unlock auth and leagues — this screen is styled
            with NativeWind.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
