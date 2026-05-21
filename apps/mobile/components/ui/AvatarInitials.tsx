import { Text, View } from "react-native";

import { initials } from "@/lib/format";

export function AvatarInitials({
  username,
  size = 32,
  accent = false,
}: {
  username: string;
  size?: number;
  accent?: boolean;
}) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: accent ? "#FF6B35" : "#2A2A2A",
      }}>
      <Text
        className="font-bold"
        style={{
          fontSize: size * 0.34,
          color: accent ? "#0D0D0D" : "#F0EDE6",
        }}>
        {initials(username)}
      </Text>
    </View>
  );
}
