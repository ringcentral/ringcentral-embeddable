import { ringCXLogId } from './formatRingCXCall';

/**
 * The key a live RingCX call's matched-contact pick is stored under: its
 * interaction id, which every leg of the call and its history rows share.
 *
 * One helper for every surface that reads or writes the pick, so the call
 * control page, the disposition page and the hand-off from history cannot
 * drift onto different ids.
 */
export function getCxCallSelectionKey(
  call?: { uii?: string; session?: { uii?: string } } | null,
): string | undefined {
  const uii = call?.uii || call?.session?.uii;
  return uii ? ringCXLogId({ uii }) : undefined;
}
