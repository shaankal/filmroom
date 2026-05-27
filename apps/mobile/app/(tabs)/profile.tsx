import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandHeader } from "@/components/ui/BrandHeader";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StandingRow } from "@/components/ui/StandingRow";
import { useAuthStore } from "@/stores/auth";
import { useProfileMeQuery } from "@/queries/profile";

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useProfileMeQuery();

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <ScrollView className="pb-8" showsVerticalScrollIndicator={false}>
        <BrandHeader subtitle={session?.username ?? "Player"} />

        {profile.isLoading ? (
          <ActivityIndicator className="mt-10" color="#FF6B35" />
        ) : profile.isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-red-400">
              {profile.error instanceof Error
                ? profile.error.message
                : "Could not load profile"}
            </Text>
            {profile.error instanceof Error &&
            profile.error.message.toLowerCase().includes("invalid token") ? (
              <Text className="mt-2 text-xs text-film-chalk/55">
                Sign out and sign in again. If it persists, check SUPABASE_JWT_SECRET
                in apps/api/.env matches Supabase → Project Settings → API → JWT
                Secret.
              </Text>
            ) : null}
          </Card>
        ) : profile.data ? (
          <>
            <Card className="mt-2">
              <Text className="text-[8px] text-[#555555]">GLOBAL SCORE</Text>
              <Text className="mt-1 text-3xl font-black text-white">
                {profile.data.globalScore.toLocaleString()}
              </Text>
              <Text className="mt-2 text-sm font-bold text-film-gold">
                {profile.data.rankTier}
              </Text>
              {profile.data.email ? (
                <Text className="mt-2 text-[10px] text-[#555555]">
                  {profile.data.email}
                </Text>
              ) : null}
            </Card>

            <View className="mt-5">
              <SectionLabel>League standings</SectionLabel>
              {profile.data.leagueStandings.length === 0 ? (
                <Text className="px-3.5 text-sm text-film-chalk/55">
                  No leagues yet.
                </Text>
              ) : (
                <View className="gap-1 px-3.5">
                  {profile.data.leagueStandings.map((row) => (
                    <StandingRow
                      key={row.leagueId}
                      rank={row.rank}
                      username={row.leagueName}
                      subtitle={`${row.weeksWon} week wins`}
                      points={row.totalPts}
                    />
                  ))}
                </View>
              )}
            </View>

            <View className="mt-6">
              <SectionLabel>Rivalries</SectionLabel>
              {profile.data.rivalries.length === 0 ? (
                <Text className="px-3.5 text-sm text-film-chalk/55">
                  Win H2H challenges to build rivalry records.
                </Text>
              ) : (
                <View className="gap-1 px-3.5">
                  {profile.data.rivalries.map((row) => (
                    <View
                      key={row.opponentId}
                      className="flex-row items-center justify-between rounded-xl bg-[#1E1E1E] px-3 py-2.5">
                      <Text className="text-[11px] text-[#CCCCCC]">
                        vs {row.opponentUsername}
                      </Text>
                      <Text className="text-xs font-bold text-film-orange">
                        {row.yourWins}–{row.theirWins}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
