import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { useAuthStore } from "@/stores/auth";
import { usePendingH2hQuery } from "@/queries/h2h";
import { usePrimaryLeague } from "@/lib/usePrimaryLeague";

export default function ChallengeTabScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const pending = usePendingH2hQuery();
  const { primary } = usePrimaryLeague();

  const incoming =
    pending.data?.challenges.filter(
      (c) => c.challengedId === session?.userId && c.status !== "complete"
    ) ?? [];
  const sent =
    pending.data?.challenges.filter(
      (c) => c.challengerId === session?.userId && c.status !== "complete"
    ) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["top", "left", "right"]}>
      <ScrollView className="pb-8">
        <View className="px-3.5 pb-3 pt-1">
          <Text className="text-lg font-black text-white">H2H Challenges</Text>
          <Text className="mt-0.5 text-[9px] tracking-widest text-[#555555]">
            {incoming.length + sent.length} PENDING
          </Text>
        </View>

        {pending.isLoading ? (
          <ActivityIndicator className="mt-8" color="#FF6B35" />
        ) : pending.isError ? (
          <Text className="px-3.5 text-sm text-red-400">
            {pending.error instanceof Error
              ? pending.error.message
              : "Could not load challenges"}
          </Text>
        ) : (
          <>
            <SectionLabel>Incoming</SectionLabel>
            {incoming.length === 0 ? (
              <Text className="mb-4 px-3.5 text-sm text-film-chalk/55">
                No incoming challenges.
              </Text>
            ) : (
              incoming.map((c) => (
                <Card key={c.id} className="mb-2">
                  <View className="mb-2.5 flex-row items-center gap-2">
                    <AvatarInitials
                      username={c.challengerUsername}
                      size={34}
                      accent
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="text-xs font-bold text-white">
                        {c.challengerUsername} challenged you
                      </Text>
                      <Text className="text-[9px] text-[#555555]">
                        Week {c.weekNumber}
                      </Text>
                    </View>
                    <Badge label="+150 pts" variant="orange" />
                  </View>
                  <View
                    className="mb-2.5 rounded-lg px-2.5 py-2"
                    style={{ backgroundColor: "#252525" }}>
                    <Text className="text-[8px] tracking-wide text-[#555555]">
                      SCENARIO PACK
                    </Text>
                    <Text className="text-[10px] text-[#CCCCCC]">
                      Week {c.weekNumber} · same set as weekly
                    </Text>
                  </View>
                  <PrimaryButton
                    label="Accept & play"
                    onPress={() =>
                      router.push({
                        pathname: "/h2h/[id]",
                        params: { id: c.id },
                      } as never)
                    }
                  />
                </Card>
              ))
            )}

            <SectionLabel>Sent</SectionLabel>
            {sent.length === 0 ? (
              <Text className="px-3.5 text-sm text-film-chalk/55">
                Challenge someone from the League tab.
              </Text>
            ) : (
              sent.map((c) => (
                <View
                  key={c.id}
                  className="mx-3.5 mb-2 flex-row items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#1E1E1E] px-3 py-2.5">
                  <View className="flex-row items-center gap-2">
                    <AvatarInitials
                      username={c.challengedUsername}
                      size={30}
                    />
                    <View>
                      <Text className="text-[11px] text-[#CCCCCC]">
                        {c.challengedUsername}
                      </Text>
                      <Text className="text-[9px] text-[#444444]">
                        Waiting for response…
                      </Text>
                    </View>
                  </View>
                  <Badge label={c.status} variant="dim" />
                </View>
              ))
            )}

            {primary ? (
              <View className="mt-6">
                <PrimaryButton
                  label="Weekly challenge"
                  onPress={() =>
                    router.push({
                      pathname: "/challenge/[leagueId]",
                      params: { leagueId: primary.id },
                    } as never)
                  }
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
