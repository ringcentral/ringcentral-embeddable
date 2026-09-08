import type { ContactMatcher } from './ContactMatcher';

export async function refreshContactMatch(
  contactMatcher: ContactMatcher,
  phoneNumber: string,
): Promise<void> {
  contactMatcher.setManualRefreshNumber(phoneNumber);
  await contactMatcher.forceMatchNumber({ phoneNumber });
}
