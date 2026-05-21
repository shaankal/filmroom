import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth";
import { usePendingH2hQuery } from "@/queries/h2h";
import { useLeaguesQuery } from "@/queries/leagues";
import { useSundayWindowsQuery } from "@/queries/sunday";

export default function HomeScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const leagues = useLeaguesQuery();
  const pendingH2h = usePendingH2hQuery();
  const sunday = useSundayWindowsQuery();

  const firstLeague = leagues.data?.leagues[0];

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <View className="flex-1 px-4 pt-2">
        <Text className="text-3xl font-bold text-film-chalk">Film Room</Text>
        <Text className="mt-1 text-film-chalk/75">
          Hey {session?.username ?? "player"} — your week starts here.
        </Text>

        {leagues.isPending ? (
          <ActivityIndicator className="mt-8" color="#FF6B35" />
        ) : (
          <View className="mt-6 gap-3">
            {firstLeague ? (
              <Pressable
                className="rounded-xl border border-film-orange/50 bg-film-field/30 p-4 active:opacity-80"
                onPress={() =>
                  router.push({
                    pathname: "/league/[leagueId]",
                    params: { leagueId: firstLeague.id },
                  } as never)
                }>
                <Text className="text-xs font-semibold uppercase text-film-gold">
                  Primary league
                </Text>
                <Text className="mt-2 text-lg font-semibold text-film-chalk">
                  {firstLeague.name}
                </Text>
                <Text className="mt-1 text-sm text-film-chalk/65">
                  Week {firstLeague.currentWeek} · {firstLeague.memberCount}{" "}
                  members
                </Text>
              </Pressable>
            ) : (
              <View className="rounded-xl border border-white/10 p-4">
                <Text className="text-film-chalk/75">
                  Join or create a league on the Leagues tab to start playing.
                </Text>
              </View>
            )}

            {(pendingH2h.data?.challenges.length ?? 0) > 0 ? (
              <View className="rounded-xl border border-white/10 p-4">
                <Text className="text-sm font-semibold text-film-chalk">
                  Pending H2H ({pendingH2h.data!.challenges.length})
                </Text>
                {pendingH2h.data!.challenges.slice(0, 3).map((c) => (
                  <Pressable
                    key={c.id}
                    className="mt-3 rounded-lg bg-black/25 px-3 py-2 active:opacity-80"
                    onPress={() =>
                      router.push({
                        pathname: "/h2h/[id]",
                        params: { id: c.id },
                      } as never)
                    }>
                    <Text className="text-film-chalk">
                      {c.challengerUsername} vs {c.challengedUsername}
                    </Text>
                    <Text className="text-xs text-film-chalk/60">
                      {c.status} · Week {c.weekNumber}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {sunday.data?.active && firstLeague ? (
              <Pressable
                className="rounded-xl border border-film-gold/40 p-4 active:opacity-80"
                onPress={() =>
                  router.push({
                    pathname: "/sunday/[windowId]",
                    params: {
                      windowId: sunday.data!.active!.id,
                      leagueId: firstLeague.id,
                    },
                  } as never)
                }>
                <Text className="text-sm font-semibold text-film-gold">
                  Sunday Live is open
                </Text>
                <Text className="mt-1 text-film-chalk/70">
                  {sunday.data.active.windowType === "primetime"
                    ? "Primetime window"
                    : "Early slate"}{" "}
                  — tap to play
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
