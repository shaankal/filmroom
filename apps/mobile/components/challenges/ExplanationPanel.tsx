import { Pressable, Text, View } from "react-native";

import type { ScenarioAnswer, WeeklyChallengeScenario } from "@filmroom/types";

type Props = {
  scenario: WeeklyChallengeScenario;
  selectedAnswer: ScenarioAnswer;
  responseTimeMs: number;
  onNext: () => void;
  isLast: boolean;
};

export function ExplanationPanel({
  scenario,
  selectedAnswer,
  responseTimeMs,
  onNext,
  isLast,
}: Props) {
  const isCorrect = selectedAnswer === scenario.correctAnswer;

  return (
    <View className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <Text
        className={`text-sm font-semibold uppercase tracking-wide ${
          isCorrect ? "text-green-400" : "text-film-orange"
        }`}>
        {isCorrect ? "Correct" : "Not quite"}
      </Text>
      <Text className="mt-2 text-base text-film-chalk">
        You answered {selectedAnswer}. Correct answer: {scenario.correctAnswer}.
      </Text>
      <Text className="mt-2 text-sm text-film-chalk/60">
        Response time: {(responseTimeMs / 1000).toFixed(1)}s
      </Text>
      <Text className="mt-4 text-base leading-6 text-film-chalk/80">
        {scenario.explanation}
      </Text>

      <Pressable
        className="mt-5 items-center rounded-xl bg-film-orange py-3 active:opacity-80"
        onPress={onNext}>
        <Text className="font-semibold text-[#0D0D0D]">
          {isLast ? "Finish challenge" : "Next scenario"}
        </Text>
      </Pressable>
    </View>
  );
}
