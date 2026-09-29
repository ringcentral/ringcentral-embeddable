/**
 * Whether a historical callback may be placed right now.
 *
 * Mirrors eag's HistoryDetail gate: the agent must have
 * `allowHistoricalDialing`, a dialable destination, and an idle phone.
 */
export function canDialHistoryCall({
  phoneNumber,
  allowHistoricalDialing = false,
  isIdle,
}: {
  phoneNumber?: string;
  allowHistoricalDialing?: boolean;
  isIdle: boolean;
}): boolean {
  return !!phoneNumber && !!allowHistoricalDialing && isIdle;
}
