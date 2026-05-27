import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ScenarioAnswer, SubmitH2HChallengeBody } from "@filmroom/types";

import { ScenarioCard } from "@/components/challenges/ScenarioCard";
import { useH2hDetailQuery, useSubmitH2hMutation } from "@/queries/h2h";

type DraftResponse = {
  scenarioId: string;
  answer: ScenarioAnswer;
  responseTimeMs: number;
};

export default function H2hChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const challengeId = typeof id === "string" ? id : null;

  const detail = useH2hDetailQuery(challengeId);
  const submit = useSubmitH2hMutation(challengeId);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<ScenarioAnswer | null>(
    null
  );
  const [draftResponses, setDraftResponses] = useState<DraftResponse[]>([]);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [scenarioStartedAt, setScenarioStartedAt] = useState(Date.now());

  useEffect(() => {
    if (detail.data?.challenge) {
      const c = detail.data.challenge;
      navigation.setOptions({
        title: `${c.challengerUsername} vs ${c.challengedUsername}`,
      });
    }
  }, [detail.data?.challenge, navigation]);

  useEffect(() => {
    setScenarioStartedAt(Date.now());
    setSelectedAnswer(null);
    setAnswerLocked(false);
  }, [scenarioIndex]);

  const scenarios = detail.data?.scenarios ?? [];
  const currentScenario = scenarios[scenarioIndex] ?? null;
  const currentDraft = useMemo(
    () =>
      currentScenario
        ? draftResponses.find((item) => item.scenarioId === currentScenario.id) ??
          null
        : null,
    [currentScenario, draftResponses]
  );

  if (detail.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-film-bg">
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-6 pt-4">
        <Text className="text-film-chalk">
          {detail.error instanceof Error
            ? detail.error.message
            : "Could not load challenge"}
        </Text>
      </SafeAreaView>
    );
  }

  if (detail.data.challenge.status === "complete") {
    const c = detail.data.challenge;
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-xl font-bold text-film-chalk">Final scores</Text>
        <Text className="mt-4 text-film-chalk">
          {c.challengerUsername}: {c.challengerScore ?? 0}
        </Text>
        <Text className="mt-2 text-film-chalk">
          {c.challengedUsername}: {c.challengedScore ?? 0}
        </Text>
        <Pressable
          className="mt-8 items-center rounded-xl bg-film-orange py-3"
          onPress={() => router.back()}>
          <Text className="font-semibold text-[#0D0D0D]">Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (detail.data.submission) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-film-chalk">
          You submitted ({detail.data.submission.totalPoints} pts). Waiting for
          your opponent.
        </Text>
        <Pressable
          className="mt-6 items-center rounded-xl border border-white/10 py-3"
          onPress={() => router.back()}>
          <Text className="font-semibold text-film-chalk">Back to league</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!currentScenario) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-film-chalk">No scenarios in this H2H set.</Text>
      </SafeAreaView>
    );
  }

  const totalScenarios = scenarios.length;
  const isLastScenario = scenarioIndex === totalScenarios - 1;

  const onSelect = (answer: ScenarioAnswer) => {
    if (answerLocked) return;
    const responseTimeMs = Math.max(0, Date.now() - scenarioStartedAt);
    setDraftResponses((prev) => [
      ...prev.filter((item) => item.scenarioId !== currentScenario.id),
      { scenarioId: currentScenario.id, answer, responseTimeMs },
    ]);
    setSelectedAnswer(answer);
    setAnswerLocked(true);
  };

  const onAdvance = () => {
    if (!currentDraft) return;

    if (isLastScenario) {
      const body: SubmitH2HChallengeBody = {
        responses: scenarios
          .map((scenario) =>
            draftResponses.find((item) => item.scenarioId === scenario.id)
          )
          .filter((item): item is DraftResponse => Boolean(item))
          .map((item) => ({
            scenarioId: item.scenarioId,
            answer: item.answer,
            responseTimeMs: item.responseTimeMs,
          })),
      };

      submit.mutate(body, {
        onSuccess: () => router.back(),
      });
      return;
    }

    setScenarioIndex((v) => v + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-3">
        <Text className="text-xs font-semibold uppercase text-film-gold">
          Head-to-head
        </Text>
        <Text className="mt-1 text-sm text-film-chalk/70">
          Scenario {scenarioIndex + 1} of {totalScenarios}
        </Text>

        <View className="mt-4">
          <ScenarioCard
            scenario={currentScenario}
            selectedAnswer={selectedAnswer}
            disabled={answerLocked || submit.isPending}
            onSelect={onSelect}
          />
        </View>

        {answerLocked && currentDraft ? (
          <View className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <Text className="text-sm font-semibold uppercase tracking-wide text-film-gold">
              Answer locked
            </Text>
            <Text className="mt-2 text-base text-film-chalk">
              You answered {currentDraft.answer}.
            </Text>
            <Text className="mt-2 text-sm text-film-chalk/60">
              Response time: {(currentDraft.responseTimeMs / 1000).toFixed(1)}s
            </Text>
            <Pressable
              className="mt-5 items-center rounded-xl bg-film-orange py-3 active:opacity-80"
              onPress={onAdvance}>
              <Text className="font-semibold text-[#0D0D0D]">
                {isLastScenario ? "Submit H2H score" : "Next scenario"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {submit.isPending ? (
          <ActivityIndicator className="mt-4" color="#FF6B35" />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
