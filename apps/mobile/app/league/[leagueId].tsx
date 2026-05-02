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

import { useLeagueHubQuery } from "@/queries/leagues";

export default function LeagueHubScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const hub = useLeagueHubQuery(
    typeof leagueId === "string" ? leagueId : null
  );

  useEffect(() => {
    if (hub.data?.league.name) {
      navigation.setOptions({ title: hub.data.league.name });
    }
  }, [hub.data?.league.name, navigation]);

  if (hub.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-film-bg">
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

  if (hub.isError || !hub.data) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-6 pt-4">
        <Text className="text-film-chalk">
          {hub.error instanceof Error
            ? hub.error.message
            : "Could not load league"}
        </Text>
      </SafeAreaView>
    );
  }

  const { league, members, standings } = hub.data;

  return (
    <SafeAreaView
      className="flex-1 bg-film-bg"
      edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-2">
        <View className="rounded-xl border border-film-orange/40 bg-film-field/30 p-4">
          <Text className="text-xs font-medium uppercase text-film-gold">
            Invite code
          </Text>
          <Text className="mt-1 font-mono text-lg text-film-chalk">
            {league.inviteCode}
          </Text>
          <Text className="mt-3 text-sm text-film-chalk/70">
            Season {league.seasonYear} · Week {league.currentWeek} · Cap{" "}
            {league.memberCap}
          </Text>
          <Pressable
            className="mt-4 items-center rounded-lg bg-film-orange py-3 active:opacity-80"
            onPress={() =>
              router.push({
                pathname: "/challenge/[leagueId]",
                params: { leagueId: league.id },
              } as never)
            }>
            <Text className="font-semibold text-[#0D0D0D]">
              Start weekly challenge
            </Text>
          </Pressable>
        </View>

        <Text className="mt-8 text-sm font-semibold uppercase tracking-wide text-film-chalk/60">
          Standings
        </Text>
        {standings.length === 0 ? (
          <Text className="mt-2 text-film-chalk/65">
            No season points yet — check back after scoring starts.
          </Text>
        ) : (
          <View className="mt-2 rounded-xl border border-white/10">
            {standings.map((row, i) => (
              <View
                key={row.userId}
                className={`flex-row justify-between border-b border-white/10 px-3 py-2.5 ${
                  i === standings.length - 1 ? "border-b-0" : ""
                }`}>
                <Text className="text-film-chalk">
                  {row.rank ?? "—"}. {row.username}
                </Text>
                <Text className="font-mono text-film-chalk/90">
                  {row.totalPts} pts
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text className="mt-8 text-sm font-semibold uppercase tracking-wide text-film-chalk/60">
          Members ({members.length})
        </Text>
        <View className="mt-2 rounded-xl border border-white/10">
          {members.map((m, i) => (
            <View
              key={m.userId}
              className={`border-b border-white/10 px-3 py-2.5 ${
                i === members.length - 1 ? "border-b-0" : ""
              }`}>
              <Text className="text-film-chalk">
                {m.username}
                {m.isCommissioner ? (
                  <Text className="text-film-gold"> · Commish</Text>
                ) : null}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
