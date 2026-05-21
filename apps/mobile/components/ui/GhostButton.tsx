import { Pressable, Text } from "react-native";

export function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="mx-3.5 items-center rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] py-3 active:opacity-80"
      onPress={onPress}>
      <Text className="text-sm font-semibold text-film-chalk/80">{label}</Text>
    </Pressable>
  );
}
