import FontAwesome from "@expo/vector-icons/FontAwesome";
import { View, Text, Pressable } from "react-native";

export function BrandHeader({
  subtitle,
  showBell = false,
}: {
  subtitle?: string;
  showBell?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between px-3.5 pb-1 pt-1">
      <View>
        <Text
          className="text-lg font-black tracking-[4px] text-film-orange"
          style={{ letterSpacing: 4 }}>
          FILM ROOM
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[9px] uppercase tracking-widest text-[#555555]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showBell ? (
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1E1E1E]">
          <FontAwesome name="bell-o" size={16} color="#888" />
        </Pressable>
      ) : null}
    </View>
  );
}
