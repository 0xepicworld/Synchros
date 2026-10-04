/** Web preview: reminders are a phone-only feature. */
export async function ensurePermission() {
  return false;
}
export async function scheduleDailyReminder(_hour: number, _minute: number) {
  return false;
}
export async function cancelReminders() {}
export const remindersSupported = false;
