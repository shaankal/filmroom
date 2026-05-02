import type { ScenarioDifficulty } from "./challenge";

export const BASE_POINTS: Record<ScenarioDifficulty, number> = {
  casual_sharp: 100,
  ball_knower: 150,
  sunday_sicko: 200,
};

export const MAX_SPEED_BONUS = 50;
export const SPEED_CUTOFF_MS = 30_000;
export const H2H_WIN_BONUS = 150;

export function calcScenarioScore(
  isCorrect: boolean,
  difficulty: ScenarioDifficulty,
  responseTimeMs: number
): number {
  if (!isCorrect) return 0;

  const boundedMs = Math.max(0, responseTimeMs);
  const base = BASE_POINTS[difficulty];
  const speedRatio = Math.max(0, 1 - boundedMs / SPEED_CUTOFF_MS);
  const speedBonus = Math.round(speedRatio * MAX_SPEED_BONUS);
  return base + speedBonus;
}

export function calcWeeklyTotal(
  challengePts: number,
  sundayPts: number,
  h2hBonusPts: number
): number {
  return Math.round(challengePts * 0.6 + sundayPts * 0.3 + h2hBonusPts * 0.1);
}
