/** API + mobile shared auth payloads (V7). */

export type AuthSuccessBody = {
  userId: string;
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type AuthRefreshBody = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};
