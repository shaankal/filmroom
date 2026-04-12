import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeaguesPlaceholderScreen() {
  return (
    <SafeAreaView className="flex-1 bg-film-bg">
      <View className="flex-1 justify-center px-6">
        <Text className="text-xl font-semibold text-film-chalk">Leagues</Text>
        <Text className="mt-2 text-film-chalk/75">
          Commissioner tools and league hub will live here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
