import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StandingRow } from "@/components/ui/StandingRow";
import { useAuthStore } from "@/stores/auth";
import { useWeeklyChallengeResultsQuery } from "@/queries/challenges";

function Divider() {
  return <View className="my-2 h-px bg-[#252525]" />;
}

export default function WeeklyChallengeResultsScreen() {
  const { leagueId, challengeId } = useLocalSearchParams<{
    leagueId: string;
    challengeId: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const effectiveChallengeId =
    typeof challengeId === "string" ? challengeId : null;
  const results = useWeeklyChallengeResultsQuery(effectiveChallengeId);

  useEffect(() => {
    navigation.setOptions({ title: "Results" });
  }, [navigation]);

  if (results.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-film-bg">
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

  if (results.isError || !results.data) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-6 pt-4">
        <Text className="text-film-chalk">
          {results.error instanceof Error
            ? results.error.message
            : "Could not load results"}
        </Text>
      </SafeAreaView>
    );
  }

  const { challenge, yourResult, standings } = results.data;
  const movedUp =
    yourResult.rankChange > 0
      ? `↑ MOVED UP TO #${yourResult.rank ?? "—"}`
      : yourResult.rankChange < 0
        ? `↓ DROPPED TO #${yourResult.rank ?? "—"}`
        : `RANK #${yourResult.rank ?? "—"}`;

  return (
    <SafeAreaView
      className="flex-1 bg-film-bg"
      edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 pb-8" showsVerticalScrollIndicator={false}>
        <View className="items-center px-3.5 pb-2 pt-3">
          <Text className="text-[9px] font-semibold tracking-[2px] text-film-orange">
            WEEK {challenge.weekNumber} RESULTS
          </Text>
          <Text className="mt-1 text-[52px] font-black leading-none text-white">
            {yourResult.totalPts}
          </Text>
          <Text className="mb-3 text-[10px] tracking-widest text-[#555555]">
            POINTS THIS WEEK
          </Text>
          <View
            className="rounded-full border px-3.5 py-1.5"
            style={{
              borderColor: "rgba(255,107,53,0.3)",
              backgroundColor: "rgba(255,107,53,0.1)",
            }}>
            <Text className="text-xs font-black tracking-widest text-film-orange">
              🏈 CAPTAIN
            </Text>
          </View>
          <Text className="mt-2 text-[10px] tracking-wide text-[#4CAF50]">
            {movedUp}
          </Text>
        </View>

        <Card className="mb-3">
          <SectionLabel>Score breakdown</SectionLabel>
          <View className="flex-row justify-between">
            <View>
              <Text className="text-[11px] font-semibold text-[#DDDDDD]">
                Weekly Challenge
              </Text>
              <Text className="text-[9px] text-[#555555]">This submission</Text>
            </View>
            <Text className="text-sm font-extrabold text-white">
              {yourResult.weeklyChallengePts} pts
            </Text>
          </View>
          <Divider />
          <View className="flex-row justify-between">
            <View>
              <Text className="text-[11px] font-semibold text-[#DDDDDD]">
                Sunday Live
              </Text>
              <Text className="text-[9px] text-[#555555]">Window picks</Text>
            </View>
            <Text className="text-sm font-extrabold text-white">
              {yourResult.sundayPts} pts
            </Text>
          </View>
          <Divider />
          <View className="flex-row justify-between">
            <View>
              <Text className="text-[11px] font-semibold text-[#DDDDDD]">
                H2H Win Bonus
              </Text>
              <Text className="text-[9px] text-[#555555]">Week wins</Text>
            </View>
            <Text className="text-sm font-extrabold text-[#4CAF50]">
              +{yourResult.h2hBonusPts} pts
            </Text>
          </View>
          <Divider />
          <View className="flex-row justify-between">
            <Text className="text-xs font-extrabold text-white">Total</Text>
            <Text className="text-base font-black text-film-orange">
              {yourResult.totalPts} pts
            </Text>
          </View>
        </Card>

        <Card>
          <View className="mb-2 flex-row justify-between">
            <View>
              <Text className="text-[8px] text-[#555555]">SEASON TOTAL</Text>
              <Text className="text-lg font-black text-white">
                {yourResult.totalPts} pts
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-[#9C27B0]">
              Keep climbing
            </Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-sm bg-[#252525]">
            <View
              className="h-full rounded-sm bg-film-orange"
              style={{ width: "73%" }}
            />
          </View>
        </Card>

        <View className="mt-6 px-3.5">
          <SectionLabel>Full standings</SectionLabel>
          <View className="gap-1">
            {standings.map((row) => (
              <StandingRow
                key={row.userId}
                rank={row.rank}
                username={
                  row.userId === session?.userId ? "You" : row.username
                }
                points={row.totalPts}
                isYou={row.userId === session?.userId}
              />
            ))}
          </View>
        </View>

        <View className="mt-6">
          <PrimaryButton
            label="Back to home"
            onPress={() => router.replace("/(tabs)" as never)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
