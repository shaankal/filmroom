import { Pressable, Text, View } from "react-native";

import type {
  ScenarioAnswer,
  WeeklyChallengeScenario,
} from "@filmroom/types";

type Props = {
  scenario: WeeklyChallengeScenario;
  selectedAnswer: ScenarioAnswer | null;
  disabled?: boolean;
  onSelect: (answer: ScenarioAnswer) => void;
};

export function ScenarioCard({
  scenario,
  selectedAnswer,
  disabled = false,
  onSelect,
}: Props) {
  return (
    <View className="rounded-2xl border border-film-orange/25 bg-film-field/25 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-film-gold">
          {scenario.conceptTag.replace(/-/g, " ")}
        </Text>
        <Text className="text-xs uppercase text-film-chalk/55">
          {scenario.difficulty.replace(/_/g, " ")}
        </Text>
      </View>

      <Text className="mt-4 text-sm leading-5 text-film-chalk/75">
        {scenario.context}
      </Text>
      <Text className="mt-4 text-xl font-semibold leading-7 text-film-chalk">
        {scenario.prompt}
      </Text>

      <View className="mt-5 gap-3">
        {scenario.choices.map((choice) => {
          const isSelected = selectedAnswer === choice.key;

          return (
            <Pressable
              key={choice.key}
              className={`rounded-xl border px-4 py-3 active:opacity-80 ${
                isSelected
                  ? "border-film-orange bg-film-orange/15"
                  : "border-white/10 bg-black/20"
              } ${disabled ? "opacity-80" : ""}`}
              disabled={disabled}
              onPress={() => onSelect(choice.key)}>
              <Text
                className={`text-sm font-medium ${
                  isSelected ? "text-film-orange" : "text-film-chalk"
                }`}>
                {choice.key}. {choice.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
