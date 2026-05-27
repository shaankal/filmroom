import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StandingRow } from "@/components/ui/StandingRow";
import { useAuthStore } from "@/stores/auth";
import { usePendingH2hQuery } from "@/queries/h2h";
import { usePrimaryLeague } from "@/lib/usePrimaryLeague";
import { useSundayWindowsQuery } from "@/queries/sunday";

export default function HomeScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { primary, hub, leagues } = usePrimaryLeague();
  const pendingH2h = usePendingH2hQuery();
  const sunday = useSundayWindowsQuery();

  const weekLabel = primary
    ? `WEEK ${primary.currentWeek} IS LIVE`
    : "JOIN A LEAGUE TO PLAY";

  const yourStanding = hub.data?.standings.find(
    (s) => s.userId === session?.userId
  );
  const topStandings = hub.data?.standings.slice(0, 3) ?? [];
  const pendingCount = pendingH2h.data?.challenges.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <ScrollView className="pb-8" showsVerticalScrollIndicator={false}>
        <BrandHeader subtitle={weekLabel} showBell />

        {leagues.isLoading ? (
          <ActivityIndicator className="mt-12" color="#FF6B35" />
        ) : leagues.isError ? (
          <Card className="mt-4">
            <Text className="text-sm text-red-400">
              {leagues.error instanceof Error
                ? leagues.error.message
                : "Could not reach API"}
            </Text>
            <Text className="mt-2 text-xs text-film-chalk/55">
              Is the API running? On a phone, use your PC LAN IP in
              EXPO_PUBLIC_API_URL, not localhost.
            </Text>
          </Card>
        ) : !primary ? (
          <Card className="mt-4">
            <Text className="text-sm text-film-chalk/75">
              Create or join a league on the League tab to unlock your home
              dashboard.
            </Text>
          </Card>
        ) : (
          <>
            <Card className="mt-2" highlight={false}>
              <View className="mb-2.5 flex-row items-start justify-between">
                <View>
                  <SectionLabel>Your League</SectionLabel>
                  <Text className="-mt-1 text-sm font-extrabold text-white">
                    {primary.name}
                  </Text>
                </View>
                <Badge label="Active" variant="orange" />
              </View>

              <View className="mb-3 flex-row gap-2">
                {[
                  {
                    value: (yourStanding?.totalPts ?? 0).toLocaleString(),
                    label: "YOUR PTS",
                    accent: true,
                  },
                  {
                    value: yourStanding?.rank ? `#${yourStanding.rank}` : "—",
                    label: "RANK",
                    accent: false,
                  },
                  {
                    value: String(primary.memberCount),
                    label: "MEMBERS",
                    accent: false,
                  },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    className="flex-1 items-center rounded-xl py-2"
                    style={{ backgroundColor: "#252525" }}>
                    <Text
                      className="text-lg font-extrabold"
                      style={{ color: stat.accent ? "#FF6B35" : "#FFFFFF" }}>
                      {stat.value}
                    </Text>
                    <Text className="mt-0.5 text-[8px] tracking-wide text-[#555555]">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>

              <SectionLabel>Top standings</SectionLabel>
              <View className="gap-1">
                {topStandings.map((row) => (
                  <StandingRow
                    key={row.userId}
                    rank={row.rank}
                    username={
                      row.userId === session?.userId ? "You" : row.username
                    }
                    points={row.totalPts}
                    isYou={row.userId === session?.userId}
                    showAvatar={false}
                  />
                ))}
              </View>
            </Card>

            <View className="mt-4">
              <PrimaryButton
                label="Play This Week's Challenge"
                icon="▶"
                onPress={() =>
                  router.push({
                    pathname: "/challenge/[leagueId]",
                    params: { leagueId: primary.id },
                  } as never)
                }
              />
            </View>

            {pendingCount > 0 ? (
              <Card className="mt-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-bold text-white">
                      H2H Challenges
                    </Text>
                    <Text className="mt-0.5 text-[10px] text-[#555555]">
                      {pendingH2h.data!.challenges[0]?.challengerUsername}{" "}
                      sent you a challenge
                    </Text>
                  </View>
                  <Badge label={`${pendingCount} Pending`} variant="orange" />
                </View>
              </Card>
            ) : null}

            {sunday.data?.active ? (
              <Card className="mt-3">
                <Text className="text-xs font-bold text-film-gold">
                  Sunday Live is open
                </Text>
                <Text className="mt-1 text-[10px] text-[#555555]">
                  {sunday.data.active.windowType === "primetime"
                    ? "Primetime window"
                    : "Early slate"}{" "}
                  — extra points toward this week
                </Text>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
