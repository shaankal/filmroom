import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { LeagueSummary } from "@filmroom/types";

import { ApiError } from "@/lib/api";
import {
  useCreateLeagueMutation,
  useInvitePreviewQuery,
  useJoinLeagueMutation,
  useLeaguesQuery,
} from "@/queries/leagues";

export default function LeaguesScreen() {
  const router = useRouter();
  const leagues = useLeaguesQuery();
  const create = useCreateLeagueMutation();
  const join = useJoinLeagueMutation();

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const joinCodeReady = joinCode.trim().length >= 4;
  const preview = useInvitePreviewQuery(joinCode);

  const onCreate = () => {
    const name = createName.trim();
    if (name.length < 2) return;
    create.mutate(
      { name },
      {
        onSuccess: (res) => {
          setCreateName("");
          router.push({
            pathname: "/league/[leagueId]",
            params: { leagueId: res.league.id },
          } as never);
        },
      }
    );
  };

  const onJoin = () => {
    const code = joinCode.trim().toLowerCase();
    if (code.length < 4) return;
    join.mutate(
      { invite_code: code },
      {
        onSuccess: (res) => {
          setJoinCode("");
          router.push({
            pathname: "/league/[leagueId]",
            params: { leagueId: res.leagueId },
          } as never);
        },
      }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <FlatList
        className="flex-1 px-4 pt-2"
        data={leagues.data?.leagues ?? []}
        keyExtractor={(item) => item.id}
        refreshing={leagues.isFetching && !leagues.isPending}
        onRefresh={() => void leagues.refetch()}
        ListHeaderComponent={
          <View className="pb-4">
            <Text className="text-2xl font-bold text-film-chalk">Leagues</Text>
            <Text className="mt-1 text-film-chalk/70">
              Create a league or join with an invite code.
            </Text>

            <View className="mt-6 rounded-xl border border-film-orange/40 bg-film-field/30 p-4">
              <Text className="text-sm font-medium text-film-gold">
                Create league
              </Text>
              <TextInput
                className="mt-3 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-film-chalk"
                placeholder="League name"
                placeholderTextColor="rgba(240,237,230,0.4)"
                value={createName}
                onChangeText={setCreateName}
                autoCapitalize="words"
                editable={!create.isPending}
              />
              <Pressable
                className="mt-3 items-center rounded-lg bg-film-orange py-3 active:opacity-80"
                onPress={onCreate}
                disabled={create.isPending || createName.trim().length < 2}>
                {create.isPending ? (
                  <ActivityIndicator color="#0D0D0D" />
                ) : (
                  <Text className="font-semibold text-[#0D0D0D]">
                    Create league
                  </Text>
                )}
              </Pressable>
              {create.isError ? (
                <Text className="mt-2 text-sm text-red-400">
                  {create.error instanceof Error
                    ? create.error.message
                    : "Could not create league"}
                </Text>
              ) : null}
            </View>

            <View className="mt-4 rounded-xl border border-white/10 p-4">
              <Text className="text-sm font-medium text-film-chalk/90">
                Join with code
              </Text>
              <TextInput
                className="mt-3 rounded-lg border border-white/15 bg-black/30 px-3 py-2 font-mono text-film-chalk"
                placeholder="Invite code"
                placeholderTextColor="rgba(240,237,230,0.4)"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!join.isPending}
              />
              {joinCodeReady && preview.isFetching ? (
                <ActivityIndicator className="mt-3" color="#FF6B35" />
              ) : joinCodeReady && preview.data ? (
                <View className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <Text className="text-base font-semibold text-film-chalk">
                    {preview.data.name}
                  </Text>
                  <Text className="mt-1 text-sm text-film-chalk/70">
                    Commish: {preview.data.commissionerUsername} ·{" "}
                    {preview.data.memberCount}/{preview.data.memberCap} members
                  </Text>
                  <Pressable
                    className="mt-3 items-center rounded-lg border border-film-gold py-2.5 active:opacity-80"
                    onPress={onJoin}
                    disabled={
                      join.isPending ||
                      preview.data.memberCount >= preview.data.memberCap
                    }>
                    {join.isPending ? (
                      <ActivityIndicator color="#E8C547" />
                    ) : (
                      <Text className="font-semibold text-film-gold">
                        Join league
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : joinCodeReady && preview.isError ? (
                <Text className="mt-2 text-sm text-red-400">
                  {preview.error instanceof ApiError
                    ? preview.error.message
                    : "Invalid or unknown code"}
                </Text>
              ) : null}
              {join.isError ? (
                <Text className="mt-2 text-sm text-red-400">
                  {join.error instanceof Error
                    ? join.error.message
                    : "Could not join"}
                </Text>
              ) : null}
            </View>

            <Text className="mt-6 text-sm font-medium text-film-chalk/80">
              Your leagues
            </Text>
          </View>
        }
        ListEmptyComponent={
          leagues.isPending ? (
            <ActivityIndicator className="mt-8" color="#FF6B35" />
          ) : leagues.isError ? (
            <Text className="mt-4 text-film-chalk/75">
              {leagues.error instanceof Error
                ? leagues.error.message
                : "Failed to load leagues"}
            </Text>
          ) : (
            <Text className="mt-2 text-film-chalk/60">
              No leagues yet — create one or join above.
            </Text>
          )
        }
        renderItem={({ item }: { item: LeagueSummary }) => (
          <LeagueRow
            league={item}
            onOpen={() =>
              router.push({
                pathname: "/league/[leagueId]",
                params: { leagueId: item.id },
              } as never)
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function LeagueRow({
  league,
  onOpen,
}: {
  league: LeagueSummary;
  onOpen: () => void;
}) {
  return (
    <Pressable
      className="mb-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 active:opacity-80"
      onPress={onOpen}>
      <Text className="text-lg font-semibold text-film-chalk">{league.name}</Text>
      <Text className="mt-1 text-sm text-film-chalk/65">
        {league.role === "commissioner" ? "Commissioner" : "Member"} ·{" "}
        {league.memberCount} players · Week {league.currentWeek}
      </Text>
    </Pressable>
  );
}
