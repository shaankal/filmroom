import type { ScenarioAnswer, ScenarioChoice, ScenarioDifficulty } from "@filmroom/types";

import { getSupabase } from "./supabase";

type ScenarioRow = {
  id: string;
  concept_tag: string;
  difficulty: ScenarioDifficulty;
  context: string;
  prompt: string;
  choices: unknown;
  correct_answer: ScenarioAnswer;
  explanation: string;
  status: string;
};

export function normalizeChoices(raw: unknown): ScenarioChoice[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized = raw
    .map((choice, index) => {
      if (typeof choice === "string") {
        const key = ["A", "B", "C", "D"][index] as ScenarioAnswer | undefined;
        return key ? { key, text: choice } : null;
      }

      if (
        choice &&
        typeof choice === "object" &&
        "key" in choice &&
        "text" in choice
      ) {
        const key = (choice as { key: unknown }).key;
        const text = (choice as { text: unknown }).text;
        if (
          (key === "A" || key === "B" || key === "C" || key === "D") &&
          typeof text === "string"
        ) {
          return { key, text };
        }
      }

      return null;
    })
    .filter((choice): choice is ScenarioChoice => Boolean(choice));

  return normalized;
}

export async function loadChallengeScenarios(scenarioSetId: string) {
  const supabase = getSupabase();
  const { data: setRow, error: setErr } = await supabase
    .from("scenario_sets")
    .select("scenario_ids")
    .eq("id", scenarioSetId)
    .maybeSingle();

  if (setErr || !setRow) {
    return null;
  }

  const scenarioIds = ((setRow.scenario_ids as string[] | null) ?? []).filter(
    Boolean
  );
  if (scenarioIds.length === 0) {
    return [];
  }

  const { data: scenarioRows, error: scenarioErr } = await supabase
    .from("scenarios")
    .select(
      "id, concept_tag, difficulty, context, prompt, choices, correct_answer, explanation, status"
    )
    .in("id", scenarioIds);

  if (scenarioErr || !scenarioRows) {
    return null;
  }

  const byId = new Map(
    (scenarioRows as ScenarioRow[]).map((row) => [row.id, row] as const)
  );

  return scenarioIds
    .map((id) => byId.get(id))
    .filter((row): row is ScenarioRow => Boolean(row));
}

export type { ScenarioRow };
