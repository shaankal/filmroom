import { Pressable, Text, View } from "react-native";

import type {
  ScenarioAnswer,
  WeeklyChallengeScenario,
} from "@filmroom/types";

import { difficultyLabel } from "@/lib/format";

import { Badge } from "../ui/Badge";

type Props = {
  scenario: WeeklyChallengeScenario;
  selectedAnswer: ScenarioAnswer | null;
  disabled?: boolean;
  onSelect: (answer: ScenarioAnswer) => void;
  progressLabel?: string;
};

export function ScenarioCard({
  scenario,
  selectedAnswer,
  disabled = false,
  onSelect,
  progressLabel,
}: Props) {
  return (
    <View className="px-3.5">
      {progressLabel ? (
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-extrabold tracking-wide text-white">
            {progressLabel}
          </Text>
          <Badge label={difficultyLabel(scenario.difficulty)} variant="blue" />
        </View>
      ) : null}

      <View
        className="mb-3 rounded-2xl border p-3.5"
        style={{ backgroundColor: "#1E1E1E", borderColor: "#2A2A2A" }}>
        <Text className="text-[9px] font-semibold tracking-widest text-film-orange">
          SCENARIO
        </Text>
        <Text className="mt-2 border-b border-[#2A2A2A] pb-2 text-[10px] leading-5 text-[#777777]">
          {scenario.context}
        </Text>
        <Text className="mt-2 text-xs font-bold leading-5 text-white">
          {scenario.prompt}
        </Text>
      </View>

      <View className="gap-2">
        {scenario.choices.map((choice) => {
          const selected = selectedAnswer === choice.key;
          return (
            <Pressable
              key={choice.key}
              disabled={disabled}
              onPress={() => onSelect(choice.key)}
              className="flex-row items-center gap-2.5 rounded-xl border px-3 py-2.5 active:opacity-90"
              style={{
                backgroundColor: selected
                  ? "rgba(255,107,53,0.1)"
                  : "#1E1E1E",
                borderColor: selected
                  ? "rgba(255,107,53,0.45)"
                  : "#2A2A2A",
                borderWidth: 1.5,
                opacity: disabled ? 0.6 : 1,
              }}>
              <View
                className="h-[22px] w-[22px] items-center justify-center rounded-md"
                style={{
                  backgroundColor: selected ? "#FF6B35" : "#252525",
                }}>
                <Text
                  className="text-[10px] font-bold"
                  style={{ color: selected ? "#0D0D0D" : "#BBBBBB" }}>
                  {choice.key}
                </Text>
              </View>
              <Text
                className="flex-1 text-[10px] leading-4"
                style={{
                  color: selected ? "#FFFFFF" : "#BBBBBB",
                  fontWeight: selected ? "600" : "400",
                }}>
                {choice.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
