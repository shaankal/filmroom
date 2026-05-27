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

import type { ScenarioAnswer, SundaySubmitBody } from "@filmroom/types";

import { ScenarioCard } from "@/components/challenges/ScenarioCard";
import {
  useSubmitSundayMutation,
  useSundayScenariosQuery,
} from "@/queries/sunday";

type DraftResponse = {
  scenarioId: string;
  answer: ScenarioAnswer;
  responseTimeMs: number;
};

export default function SundayLiveScreen() {
  const { windowId, leagueId } = useLocalSearchParams<{
    windowId: string;
    leagueId: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();

  const effectiveWindowId = typeof windowId === "string" ? windowId : null;
  const effectiveLeagueId = typeof leagueId === "string" ? leagueId : null;

  const scenariosQuery = useSundayScenariosQuery(effectiveWindowId);
  const submit = useSubmitSundayMutation(effectiveWindowId);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<ScenarioAnswer | null>(
    null
  );
  const [draftResponses, setDraftResponses] = useState<DraftResponse[]>([]);
  const [answerLocked, setAnswerLocked] = useState(false);
  const [scenarioStartedAt, setScenarioStartedAt] = useState(Date.now());

  useEffect(() => {
    if (scenariosQuery.data?.window) {
      navigation.setOptions({
        title:
          scenariosQuery.data.window.windowType === "primetime"
            ? "Sunday Primetime"
            : "Sunday Early Slate",
      });
    }
  }, [scenariosQuery.data?.window, navigation]);

  useEffect(() => {
    setScenarioStartedAt(Date.now());
    setSelectedAnswer(null);
    setAnswerLocked(false);
  }, [scenarioIndex]);

  const scenarios = scenariosQuery.data?.scenarios ?? [];
  const currentScenario = scenarios[scenarioIndex] ?? null;
  const currentDraft = useMemo(
    () =>
      currentScenario
        ? draftResponses.find((item) => item.scenarioId === currentScenario.id) ??
          null
        : null,
    [currentScenario, draftResponses]
  );

  if (!effectiveLeagueId) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-film-chalk">Missing league context.</Text>
      </SafeAreaView>
    );
  }

  if (scenariosQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-film-bg">
        <ActivityIndicator color="#FF6B35" size="large" />
      </SafeAreaView>
    );
  }

  if (scenariosQuery.isError || !scenariosQuery.data) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-film-chalk">
          {scenariosQuery.error instanceof Error
            ? scenariosQuery.error.message
            : "Sunday window unavailable"}
        </Text>
      </SafeAreaView>
    );
  }

  if (!currentScenario) {
    return (
      <SafeAreaView className="flex-1 bg-film-bg px-5 pt-4">
        <Text className="text-film-chalk">No scenarios for this window.</Text>
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
      const body: SundaySubmitBody = {
        leagueId: effectiveLeagueId,
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
          Sunday Live
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
                {isLastScenario ? "Submit Sunday score" : "Next scenario"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
