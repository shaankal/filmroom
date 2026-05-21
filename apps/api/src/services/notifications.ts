/** OneSignal dispatch — log-only stub until keys are configured. */

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string
): Promise<void> {
  if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_API_KEY) {
    console.info("[notifications:stub]", { userIds, title, body });
    return;
  }

  // Production: POST https://api.onesignal.com/notifications with external_user_ids
  console.info("[notifications]", { userIds, title, body });
}
