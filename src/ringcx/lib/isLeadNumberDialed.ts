import type { Lead } from '../services/CxLeads/CxLeads.interface';

/**
 * Fewer digits than this match too many numbers to compare by their end.
 */
const MIN_SUFFIX_DIGITS = 7;

function toDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

function isSameNumber(first: string, second: string): boolean {
  if (first === second) {
    return true;
  }
  const [shorter, longer] =
    first.length < second.length ? [first, second] : [second, first];
  // One side may carry the country code the other leaves out, such as the
  // number the server reports for a progressive dial.
  return shorter.length >= MIN_SUFFIX_DIGITS && longer.endsWith(shorter);
}

/**
 * Whether a number of a fetched lead was already dialed, as Agent One's
 * `multiNumberLeadDialDisabled` tells from the lead's `dialedList`. The list
 * holds the numbers as they were dialed or reported, so formatting is
 * ignored.
 */
export function isLeadNumberDialed(
  lead: Pick<Lead, 'dialedList'> | null | undefined,
  phoneNumber: string,
): boolean {
  const digits = toDigits(phoneNumber);
  if (!digits) {
    return false;
  }
  return (lead?.dialedList ?? []).some((dialed) =>
    isSameNumber(toDigits(dialed), digits),
  );
}
