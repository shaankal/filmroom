import { Text, View } from "react-native";

import { rankMedalColor } from "@/lib/format";

import { AvatarInitials } from "./AvatarInitials";

export function StandingRow({
  rank,
  username,
  subtitle,
  points,
  weekDelta,
  isYou = false,
  showAvatar = true,
}: {
  rank: number | null;
  username: string;
  subtitle?: string;
  points: number;
  weekDelta?: string;
  isYou?: boolean;
  showAvatar?: boolean;
}) {
  const rankColor = isYou ? "#FF6B35" : rankMedalColor(rank);

  return (
    <View
      className="flex-row items-center gap-2 rounded-xl px-2.5 py-2"
      style={{
        backgroundColor: isYou ? "rgba(255,107,53,0.08)" : "#1E1E1E",
        borderWidth: isYou ? 1 : 0,
        borderColor: "rgba(255,107,53,0.25)",
      }}>
      <Text
        className="w-4 text-center text-xs font-extrabold"
        style={{ color: rankColor }}>
        {rank ?? "—"}
      </Text>
      {showAvatar ? (
        <AvatarInitials username={username} size={28} accent={isYou} />
      ) : null}
      <View className="min-w-0 flex-1">
        <Text
          className="text-xs font-bold"
          style={{ color: isYou ? "#FF6B35" : "#FFFFFF" }}
          numberOfLines={1}>
          {username}
        </Text>
        {subtitle ? (
          <Text
            className="text-[8px]"
            style={{ color: isYou ? "rgba(255,107,53,0.6)" : "#555555" }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="items-end">
        <Text
          className="text-xs font-bold"
          style={{ color: isYou ? "#FF6B35" : "#FFFFFF" }}>
          {points.toLocaleString()}
        </Text>
        {weekDelta ? (
          <Text className="text-[8px] text-[#4CAF50]">{weekDelta}</Text>
        ) : null}
      </View>
    </View>
  );
}
