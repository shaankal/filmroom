export type LeaguePassPurchaseBody = {
  leagueId: string;
  platform: "ios" | "android" | "web";
};

export type LeaguePassPurchaseResponse = {
  leagueId: string;
  message: string;
  testMode: boolean;
};

export type LeaguePassStatusResponse = {
  leagueId: string;
  active: boolean;
  seasonYear: number;
};
