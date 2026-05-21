import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth";
import { useProfileMeQuery } from "@/queries/profile";

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useProfileMeQuery();

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-2">
        <Text className="text-2xl font-bold text-film-chalk">Profile</Text>
        <Text className="mt-1 text-film-chalk/70">
          {session?.username ?? session?.email ?? "Signed in"}
        </Text>

        {profile.isPending ? (
          <ActivityIndicator className="mt-8" color="#FF6B35" />
        ) : profile.isError ? (
          <Text className="mt-6 text-red-400">
            {profile.error instanceof Error
              ? profile.error.message
              : "Could not load profile"}
          </Text>
        ) : profile.data ? (
          <View className="mt-6">
            <View className="rounded-xl border border-film-orange/40 bg-film-field/30 p-4">
              <Text className="text-sm text-film-chalk/70">Global score</Text>
              <Text className="mt-1 text-3xl font-bold text-film-chalk">
                {profile.data.globalScore}
              </Text>
              <Text className="mt-2 text-film-gold">{profile.data.rankTier}</Text>
            </View>

            <Text className="mt-8 text-sm font-semibold uppercase text-film-chalk/60">
              League standings
            </Text>
            {profile.data.leagueStandings.length === 0 ? (
              <Text className="mt-2 text-film-chalk/60">No leagues yet.</Text>
            ) : (
              profile.data.leagueStandings.map((row) => (
                <View
                  key={row.leagueId}
                  className="mt-2 rounded-lg border border-white/10 px-3 py-2.5">
                  <Text className="font-medium text-film-chalk">
                    {row.leagueName}
                  </Text>
                  <Text className="mt-1 text-sm text-film-chalk/65">
                    {row.totalPts} pts · Rank {row.rank ?? "—"} ·{" "}
                    {row.weeksWon} week wins
                  </Text>
                </View>
              ))
            )}

            <Text className="mt-8 text-sm font-semibold uppercase text-film-chalk/60">
              Rivalries
            </Text>
            {profile.data.rivalries.length === 0 ? (
              <Text className="mt-2 text-film-chalk/60">
                Play H2H challenges to build rivalry records.
              </Text>
            ) : (
              profile.data.rivalries.map((row) => (
                <View
                  key={row.opponentId}
                  className="mt-2 rounded-lg border border-white/10 px-3 py-2.5">
                  <Text className="text-film-chalk">
                    vs {row.opponentUsername}
                  </Text>
                  <Text className="mt-1 text-sm text-film-chalk/65">
                    You {row.yourWins} – {row.theirWins} them
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
