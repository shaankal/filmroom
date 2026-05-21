import { View } from "react-native";

export function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.min(1, Math.max(0, progress));
  return (
    <View className="mx-3.5 h-[3px] overflow-hidden rounded-sm bg-[#2A2A2A]">
      <View
        className="h-full rounded-sm bg-film-orange"
        style={{ width: `${pct * 100}%` }}
      />
    </View>
  );
}
