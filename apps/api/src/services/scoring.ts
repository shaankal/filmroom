import {
  calcScenarioScore as sharedCalcScenarioScore,
  calcWeeklyTotal,
  BASE_POINTS,
  H2H_WIN_BONUS,
  MAX_SPEED_BONUS,
  SPEED_CUTOFF_MS,
} from "@filmroom/types";

export {
  BASE_POINTS,
  calcWeeklyTotal,
  H2H_WIN_BONUS,
  MAX_SPEED_BONUS,
  SPEED_CUTOFF_MS,
};

export const calcScenarioScore = sharedCalcScenarioScore;
