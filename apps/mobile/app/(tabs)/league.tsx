import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { GhostButton } from "@/components/ui/GhostButton";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StandingRow } from "@/components/ui/StandingRow";
import { useAuthStore } from "@/stores/auth";
import { useCreateH2hMutation } from "@/queries/h2h";
import { useLeagueNudgeMutation } from "@/queries/leagues";
import { usePrimaryLeague } from "@/lib/usePrimaryLeague";
import { useSundayLiveQuery } from "@/queries/sunday";

export default function LeagueTabScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const { primary, hub, leagues } = usePrimaryLeague();
  const sundayLive = useSundayLiveQuery(primary?.id ?? null);
  const createH2h = useCreateH2hMutation();
  const nudge = useLeagueNudgeMutation(primary?.id ?? null);
  const [copied, setCopied] = useState(false);

  if (leagues.isLoading || (primary != null && hub.isLoading)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-film-bg">
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

  if (leagues.isError) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-4 pt-4">
        <Text className="text-2xl font-bold text-film-chalk">League</Text>
        <Text className="mt-2 text-red-400">
          {leagues.error instanceof Error
            ? leagues.error.message
            : "Could not load leagues"}
        </Text>
        <Text className="mt-2 text-sm text-film-chalk/60">
          Check that the API is running and EXPO_PUBLIC_API_URL points at your PC
          (e.g. http://192.168.68.55:3000 on a phone).
        </Text>
      </SafeAreaView>
    );
  }

  if (primary && hub.isError) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-4 pt-4">
        <Text className="text-2xl font-bold text-film-chalk">League</Text>
        <Text className="mt-2 text-red-400">
          {hub.error instanceof Error
            ? hub.error.message
            : "Could not load league"}
        </Text>
      </SafeAreaView>
    );
  }

  if (!primary || !hub.data) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-4 pt-4">
        <Text className="text-2xl font-bold text-film-chalk">League</Text>
        <Text className="mt-2 text-film-chalk/70">
          No league yet. Manage leagues to create or join one.
        </Text>
        <View className="mt-6">
          <PrimaryButton
            label="Manage leagues"
            onPress={() => router.push("/(tabs)/leagues" as never)}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { league, members, standings } = hub.data;
  const isCommissioner = session?.userId === league.commissionerId;

  const copyInvite = async () => {
    await Share.share({
      message: `Join my Film Room league with code: ${league.inviteCode}`,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onChallengeMember = (opponentId: string, username: string) => {
    if (opponentId === session?.userId) return;
    Alert.alert(`Challenge ${username}?`, "Send a head-to-head for this week.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: () =>
          createH2h.mutate(
            { leagueId: league.id, challengedUserId: opponentId },
            {
              onSuccess: () =>
                router.push({
                  pathname: "/(tabs)/challenge",
                } as never),
            }
          ),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <ScrollView className="pb-8" showsVerticalScrollIndicator={false}>
        <View className="px-3.5 pb-1 pt-1">
          <SectionLabel>Your league</SectionLabel>
          <Text className="-mt-1 text-lg font-black text-white">{league.name}</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Badge
              label={`${members.length} / ${league.memberCap} members`}
              variant="green"
            />
            <Badge label={`Week ${league.currentWeek}`} variant="orange" />
            <Badge label={league.healthState} variant="dim" />
          </View>
        </View>

        <View className="mx-3.5 mt-3 flex-row items-center justify-between rounded-xl bg-[#1E1E1E] px-3.5 py-3">
          <View>
            <Text className="text-[8px] tracking-widest text-[#555555]">
              INVITE CODE
            </Text>
            <Text className="mt-1 font-mono text-lg font-black tracking-[4px] text-film-orange">
              {league.inviteCode}
            </Text>
          </View>
          <Pressable
            className="rounded-lg px-3 py-2 active:opacity-80"
            style={{ backgroundColor: "#FF6B35" }}
            onPress={copyInvite}>
            <Text className="text-[10px] font-bold tracking-wide text-white">
              {copied ? "COPIED" : "COPY"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-5">
          <SectionLabel>{`Week ${league.currentWeek} standings`}</SectionLabel>
          <View className="gap-1.5 px-3.5">
            {standings.length === 0 ? (
              <Text className="text-sm text-film-chalk/60">
                Play the weekly challenge to populate standings.
              </Text>
            ) : (
              standings.map((row) => (
                <StandingRow
                  key={row.userId}
                  rank={row.rank}
                  username={
                    row.userId === session?.userId ? "You" : row.username
                  }
                  subtitle={
                    row.userId === league.commissionerId ? "Commish" : undefined
                  }
                  points={row.totalPts}
                  weekDelta={
                    row.weeksWon > 0 ? `${row.weeksWon} wk wins` : undefined
                  }
                  isYou={row.userId === session?.userId}
                />
              ))
            )}
          </View>
        </View>

        <View className="mt-4 gap-3">
          <PrimaryButton
            label="Play weekly challenge"
            onPress={() =>
              router.push({
                pathname: "/challenge/[leagueId]",
                params: { leagueId: league.id },
              } as never)
            }
          />
          {sundayLive.data?.activeWindow ? (
            <GhostButton
              label="Sunday Live window open"
              onPress={() =>
                router.push({
                  pathname: "/sunday/[windowId]",
                  params: {
                    windowId: sundayLive.data!.activeWindow!.id,
                    leagueId: league.id,
                  },
                } as never)
              }
            />
          ) : null}
        </View>

        <View className="mt-5 px-3.5">
          <SectionLabel>Members — tap to challenge</SectionLabel>
          <View className="gap-1.5">
            {members.map((m) => (
              <Pressable
                key={m.userId}
                className="flex-row items-center gap-2 rounded-xl bg-[#1E1E1E] px-2.5 py-2 active:opacity-80"
                disabled={m.userId === session?.userId}
                onPress={() => onChallengeMember(m.userId, m.username)}>
                <View
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      m.userId === session?.userId ? "#FF6B35" : "#2A2A2A",
                  }}>
                  <Text className="text-[10px] font-bold text-white">
                    {m.username.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text className="flex-1 text-[11px] font-semibold text-[#DDDDDD]">
                  {m.username}
                  {m.isCommissioner ? (
                    <Text className="text-film-gold"> · Commish</Text>
                  ) : null}
                </Text>
                {m.userId !== session?.userId ? (
                  <Text className="text-[9px] text-[#555555]">H2H →</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-5 gap-3">
          <GhostButton
            label="+ Invite a friend (share code)"
            onPress={copyInvite}
          />
          <GhostButton
            label="Switch / create leagues"
            onPress={() => router.push("/(tabs)/leagues" as never)}
          />
          {isCommissioner ? (
            <GhostButton
              label={nudge.isPending ? "Sending nudge…" : "Nudge inactive members"}
              onPress={() =>
                nudge.mutate(undefined, {
                  onSuccess: (res) =>
                    Alert.alert("Done", `Nudged ${res.sent} member(s).`),
                })
              }
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
