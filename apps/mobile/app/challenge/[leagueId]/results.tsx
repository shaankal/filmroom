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

import { useWeeklyChallengeResultsQuery } from "@/queries/challenges";

export default function WeeklyChallengeResultsScreen() {
  const { leagueId, challengeId } = useLocalSearchParams<{
    leagueId: string;
    challengeId: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();

  const effectiveLeagueId = typeof leagueId === "string" ? leagueId : null;
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
  const rankChange =
    yourResult.rankChange > 0
      ? `+${yourResult.rankChange}`
      : `${yourResult.rankChange}`;

  return (
    <SafeAreaView
      className="flex-1 bg-film-bg"
      edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-3">
        <View className="rounded-2xl border border-film-orange/35 bg-film-field/25 p-5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-film-gold">
            Week {challenge.weekNumber} results
          </Text>
          <Text className="mt-3 text-4xl font-bold text-film-chalk">
            {yourResult.totalPts} pts
          </Text>
          <Text className="mt-2 text-film-chalk/70">
            Weekly challenge points: {yourResult.weeklyChallengePts}
          </Text>

          <View className="mt-5 flex-row gap-3">
            <View className="flex-1 rounded-xl border border-white/10 bg-black/20 p-3">
              <Text className="text-xs uppercase text-film-chalk/55">Rank</Text>
              <Text className="mt-1 text-2xl font-semibold text-film-chalk">
                #{yourResult.rank ?? "—"}
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-white/10 bg-black/20 p-3">
              <Text className="text-xs uppercase text-film-chalk/55">
                Rank change
              </Text>
              <Text className="mt-1 text-2xl font-semibold text-film-chalk">
                {rankChange}
              </Text>
            </View>
          </View>

          <Text className="mt-4 text-sm text-film-chalk/55">
            Previous rank:{" "}
            {yourResult.previousRank ? `#${yourResult.previousRank}` : "N/A"}
          </Text>
        </View>

        <Text className="mt-8 text-sm font-semibold uppercase tracking-wide text-film-chalk/60">
          Weekly standings
        </Text>
        <View className="mt-2 rounded-xl border border-white/10">
          {standings.map((row, index) => {
            const isYou = row.userId === yourResult.userId;
            return (
              <View
                key={row.userId}
                className={`flex-row items-center justify-between border-b border-white/10 px-3 py-3 ${
                  index === standings.length - 1 ? "border-b-0" : ""
                } ${isYou ? "bg-film-orange/10" : ""}`}>
                <View>
                  <Text
                    className={`font-medium ${
                      isYou ? "text-film-orange" : "text-film-chalk"
                    }`}>
                    {row.rank ?? "—"}. {row.username}
                  </Text>
                  <Text className="mt-1 text-xs text-film-chalk/55">
                    Weekly {row.weeklyChallengePts} · Sunday {row.sundayPts} ·
                    H2H {row.h2hBonusPts}
                  </Text>
                </View>
                <Text className="font-mono text-film-chalk/85">
                  {row.totalPts} pts
                </Text>
              </View>
            );
          })}
        </View>

        <Pressable
          className="mt-6 items-center rounded-xl bg-film-orange py-3 active:opacity-80"
          onPress={() =>
            router.replace({
              pathname: "/league/[leagueId]",
              params: { leagueId: effectiveLeagueId! },
            } as never)
          }>
          <Text className="font-semibold text-[#0D0D0D]">Back to league</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
