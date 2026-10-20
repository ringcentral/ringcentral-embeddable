import type { CountryCode } from 'libphonenumber-js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/** A lead holds at most this many numbers, as in Agent One. */
export const CX_LEAD_MAX_PHONE_NUMBERS = 6;

/** Characters the server would read as number separators. */
const SEPARATOR_CHARACTERS = /[,;]/;

export interface CxLeadPhoneNumbersResult {
  /** The valid numbers, in E.164. */
  phoneNumbers: string[];
  /** The lines that are not valid numbers, as typed. */
  invalidLines: string[];
}

function toE164(line: string, defaultCountry: CountryCode): string | null {
  if (SEPARATOR_CHARACTERS.test(line)) {
    return null;
  }
  const parsed = parsePhoneNumberFromString(line, defaultCountry);
  return parsed?.isValid() ? parsed.number : null;
}

/**
 * The numbers of a lead's phone field, one per line, as Agent One's "Update
 * lead" dialog reads them: blank lines are skipped, and a line must be a
 * valid number with no `,` or `;`. National numbers are read in
 * `defaultCountry`, as the RingCX number formatter does.
 */
export function parseCxLeadPhoneNumbers(
  input: string,
  defaultCountry: CountryCode = 'US',
): CxLeadPhoneNumbersResult {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const parsed = lines.map((line) => ({ line, e164: toE164(line, defaultCountry) }));
  return {
    phoneNumbers: parsed
      .map(({ e164 }) => e164)
      .filter((e164): e164 is string => !!e164),
    invalidLines: parsed.filter(({ e164 }) => !e164).map(({ line }) => line),
  };
}
