import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth";
import { useCreateH2hMutation, usePendingH2hQuery } from "@/queries/h2h";
import { useLeagueHubQuery, useLeagueNudgeMutation } from "@/queries/leagues";
import { useSundayLiveQuery } from "@/queries/sunday";

export default function LeagueHubScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const effectiveLeagueId = typeof leagueId === "string" ? leagueId : null;

  const hub = useLeagueHubQuery(effectiveLeagueId);
  const pendingH2h = usePendingH2hQuery();
  const sundayLive = useSundayLiveQuery(effectiveLeagueId);
  const createH2h = useCreateH2hMutation();
  const nudge = useLeagueNudgeMutation(effectiveLeagueId);

  const leaguePending = useMemo(
    () =>
      (pendingH2h.data?.challenges ?? []).filter(
        (c) => c.leagueId === effectiveLeagueId
      ),
    [pendingH2h.data?.challenges, effectiveLeagueId]
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

  const { league, members, standings, rivalries } = hub.data;
  const isCommissioner = session?.userId === league.commissionerId;

  const onChallengeMember = (opponentId: string, username: string) => {
    if (!effectiveLeagueId || opponentId === session?.userId) return;
    Alert.alert(`Challenge ${username}?`, "Send a head-to-head for this week.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: () =>
          createH2h.mutate(
            { leagueId: effectiveLeagueId, challengedUserId: opponentId },
            {
              onSuccess: (res) =>
                router.push({
                  pathname: "/h2h/[id]",
                  params: { id: res.challenge.id },
                } as never),
            }
          ),
      },
    ]);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-film-bg"
      edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-2">
        <View className="rounded-xl border border-film-orange/40 bg-film-field/30 p-4">
          <Text className="text-xs font-medium uppercase text-film-gold">
            Invite code · {league.healthState}
          </Text>
          <Text className="mt-1 font-mono text-lg text-film-chalk">
            {league.inviteCode}
          </Text>
          <Text className="mt-3 text-sm text-film-chalk/70">
            Season {league.seasonYear} · Week {league.currentWeek} ·{" "}
            {league.leaguePassActive ? "League Pass active" : "Standard"}
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

          {sundayLive.data?.activeWindow ? (
            <Pressable
              className="mt-3 items-center rounded-lg border border-film-gold py-3 active:opacity-80"
              onPress={() =>
                router.push({
                  pathname: "/sunday/[windowId]",
                  params: {
                    windowId: sundayLive.data!.activeWindow!.id,
                    leagueId: league.id,
                  },
                } as never)
              }>
              <Text className="font-semibold text-film-gold">Sunday Live</Text>
            </Pressable>
          ) : null}

          {isCommissioner ? (
            <Pressable
              className="mt-3 items-center rounded-lg border border-white/15 py-3 active:opacity-80"
              disabled={nudge.isPending}
              onPress={() =>
                nudge.mutate(undefined, {
                  onSuccess: (res) =>
                    Alert.alert(
                      "Nudge sent",
                      `Pinged ${res.sent} inactive member(s).`
                    ),
                })
              }>
              <Text className="font-semibold text-film-chalk">
                {nudge.isPending ? "Sending…" : "Nudge inactive members"}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {leaguePending.length > 0 ? (
          <View className="mt-6">
            <Text className="text-sm font-semibold uppercase text-film-chalk/60">
              Pending H2H
            </Text>
            {leaguePending.map((c) => (
              <Pressable
                key={c.id}
                className="mt-2 rounded-lg border border-white/10 px-3 py-2.5 active:opacity-80"
                onPress={() =>
                  router.push({
                    pathname: "/h2h/[id]",
                    params: { id: c.id },
                  } as never)
                }>
                <Text className="text-film-chalk">
                  {c.challengerUsername} vs {c.challengedUsername}
                </Text>
                <Text className="text-xs text-film-chalk/60">{c.status}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text className="mt-8 text-sm font-semibold uppercase tracking-wide text-film-chalk/60">
          Standings
        </Text>
        {standings.length === 0 ? (
          <Text className="mt-2 text-film-chalk/65">
            No season points yet — play the weekly challenge first.
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

        {rivalries.length > 0 ? (
          <View className="mt-8">
            <Text className="text-sm font-semibold uppercase text-film-chalk/60">
              Rivalries
            </Text>
            {rivalries.map((r) => (
              <Text
                key={`${r.userAId}-${r.userBId}`}
                className="mt-2 text-film-chalk/80">
                {r.userAUsername} {r.userAWins}–{r.userBWins}{" "}
                {r.userBUsername}
              </Text>
            ))}
          </View>
        ) : null}

        <Text className="mt-8 text-sm font-semibold uppercase tracking-wide text-film-chalk/60">
          Members ({members.length})
        </Text>
        <View className="mt-2 rounded-xl border border-white/10">
          {members.map((m, i) => (
            <Pressable
              key={m.userId}
              className={`border-b border-white/10 px-3 py-2.5 active:opacity-80 ${
                i === members.length - 1 ? "border-b-0" : ""
              }`}
              onPress={() => onChallengeMember(m.userId, m.username)}
              disabled={m.userId === session?.userId || m.isCommissioner}>
              <Text className="text-film-chalk">
                {m.username}
                {m.isCommissioner ? (
                  <Text className="text-film-gold"> · Commish</Text>
                ) : null}
              </Text>
              {m.userId !== session?.userId ? (
                <Text className="text-xs text-film-chalk/50">
                  Tap to send H2H
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
