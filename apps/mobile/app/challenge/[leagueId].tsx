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

import type { ScenarioAnswer, WeeklyChallengeSubmitBody } from "@filmroom/types";

import { ExplanationPanel } from "@/components/challenges/ExplanationPanel";
import { ScenarioCard } from "@/components/challenges/ScenarioCard";
import { useSubmitWeeklyChallengeMutation, useWeeklyChallengeQuery } from "@/queries/challenges";

type DraftResponse = {
  scenarioId: string;
  answer: ScenarioAnswer;
  responseTimeMs: number;
};

export default function WeeklyChallengeScreen() {
  const { leagueId } = useLocalSearchParams<{ leagueId: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  const effectiveLeagueId = typeof leagueId === "string" ? leagueId : null;
  const challenge = useWeeklyChallengeQuery(effectiveLeagueId);
  const submit = useSubmitWeeklyChallengeMutation(effectiveLeagueId);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<ScenarioAnswer | null>(
    null
  );
  const [draftResponses, setDraftResponses] = useState<DraftResponse[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scenarioStartedAt, setScenarioStartedAt] = useState<number>(Date.now());

  useEffect(() => {
    if (challenge.data?.challenge) {
      navigation.setOptions({
        title: `Week ${challenge.data.challenge.weekNumber} Challenge`,
      });
    }
  }, [challenge.data?.challenge, navigation]);

  useEffect(() => {
    setScenarioStartedAt(Date.now());
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, [scenarioIndex]);

  const scenarios = challenge.data?.scenarios ?? [];
  const currentScenario = scenarios[scenarioIndex] ?? null;
  const currentDraft = useMemo(
    () =>
      currentScenario
        ? draftResponses.find((item) => item.scenarioId === currentScenario.id) ??
          null
        : null,
    [currentScenario, draftResponses]
  );

  if (challenge.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-film-bg">
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

  if (challenge.isError || !challenge.data) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-6 pt-4">
        <Text className="text-film-chalk">
          {challenge.error instanceof Error
            ? challenge.error.message
            : "Could not load weekly challenge"}
        </Text>
      </SafeAreaView>
    );
  }

  if (challenge.data.submission) {
    const total = challenge.data.submission.totalPoints;
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <View className="rounded-2xl border border-film-gold/30 bg-film-field/25 p-5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-film-gold">
            Already submitted
          </Text>
          <Text className="mt-3 text-3xl font-bold text-film-chalk">
            {total} pts
          </Text>
          <Text className="mt-2 text-film-chalk/70">
            You already completed this weekly challenge.
          </Text>
        </View>

        <Pressable
          className="mt-5 items-center rounded-xl border border-white/10 py-3 active:opacity-80"
          onPress={() =>
            router.replace({
              pathname: "/league/[leagueId]",
              params: { leagueId: effectiveLeagueId! },
            } as never)
          }>
          <Text className="font-semibold text-film-chalk">Back to league</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!currentScenario) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-film-chalk">No scenarios available.</Text>
      </SafeAreaView>
    );
  }

  const totalScenarios = scenarios.length;
  const isLastScenario = scenarioIndex === totalScenarios - 1;

  const onSelect = (answer: ScenarioAnswer) => {
    if (showExplanation) return;

    const responseTimeMs = Math.max(0, Date.now() - scenarioStartedAt);
    const draft: DraftResponse = {
      scenarioId: currentScenario.id,
      answer,
      responseTimeMs,
    };

    setDraftResponses((prev) => [
      ...prev.filter((item) => item.scenarioId !== currentScenario.id),
      draft,
    ]);
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  const onAdvance = () => {
    if (!currentDraft) return;

    if (isLastScenario) {
      const body: WeeklyChallengeSubmitBody = {
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

      setSubmitted(true);
      submit.mutate(
        {
          challengeId: challenge.data.challenge.id,
          body,
        },
        {
          onError: () => setSubmitted(false),
          onSuccess: () => {
            router.replace({
              pathname: "/league/[leagueId]",
              params: { leagueId: effectiveLeagueId! },
            } as never);
          },
        }
      );
      return;
    }

    setScenarioIndex((value) => value + 1);
  };

  return (
    <SafeAreaView className="flex-1 bg-film-bg" edges={["bottom", "left", "right"]}>
      <ScrollView className="flex-1 px-4 pt-3">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-film-gold">
              Weekly challenge
            </Text>
            <Text className="mt-1 text-sm text-film-chalk/70">
              Scenario {scenarioIndex + 1} of {totalScenarios}
            </Text>
          </View>
          <Text className="font-mono text-sm text-film-chalk/60">
            Week {challenge.data.challenge.weekNumber}
          </Text>
        </View>

        <ScenarioCard
          scenario={currentScenario}
          selectedAnswer={selectedAnswer}
          disabled={showExplanation || submitted || submit.isPending}
          onSelect={onSelect}
        />

        {showExplanation && currentDraft ? (
          <View className="mt-4">
            <ExplanationPanel
              scenario={currentScenario}
              selectedAnswer={currentDraft.answer}
              responseTimeMs={currentDraft.responseTimeMs}
              isLast={isLastScenario}
              onNext={onAdvance}
            />
          </View>
        ) : (
          <Text className="mt-4 text-sm text-film-chalk/55">
            Pick the best answer to lock in your response.
          </Text>
        )}

        {submit.isError ? (
          <Text className="mt-4 text-sm text-red-400">
            {submit.error instanceof Error
              ? submit.error.message
              : "Could not submit challenge"}
          </Text>
        ) : null}

        {submit.isPending || submitted ? (
          <View className="mt-5 flex-row items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
            <ActivityIndicator color="#FF6B35" />
            <Text className="text-film-chalk/75">
              Submitting your weekly score...
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
