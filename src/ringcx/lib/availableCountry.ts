import {
  format,
  formatTypes,
  isE164,
  parse,
  parseIncompletePhoneNumber,
} from '@ringcentral-integration/phone-number';
import { alpha2ToAlpha3, alpha3ToAlpha2 } from 'i18n-iso-countries';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export interface AvailableCountry {
  countryId: string;
  countryName?: string;
  /** country dialing code, eg. `49` for Germany */
  countryCode?: string;
}

interface NumberCountry {
  /** ISO 3166-1 alpha-3 country id, `undefined` when the country is unknown */
  countryId?: string;
  /** country dialing code, `null` when it cannot be told from the number */
  countryCode: string | null;
}

/**
 * Country of an E164 phone number, as both an ISO alpha-3 id and a dialing
 * code. `null` for anything else: a national number carries no country.
 */
export const parseNumberCountry = (
  phoneNumber: string,
): NumberCountry | null => {
  const cleanedNumber: string = parseIncompletePhoneNumber(
    phoneNumber.toString(),
  );
  if (!isE164(cleanedNumber)) {
    return null;
  }
  const { parsedNumber, isValid, hasInvalidChars, parsedCountry } = parse({
    input: phoneNumber,
  });
  if (!isValid || hasInvalidChars || !parsedNumber) {
    return null;
  }
  return {
    countryId: alpha2ToAlpha3(parsedCountry),
    // the national number is the E164 number without `+` and dialing code
    countryCode: cleanedNumber.endsWith(parsedNumber)
      ? cleanedNumber.slice(1, cleanedNumber.length - parsedNumber.length)
      : null,
  };
};

/**
 * Find a country in the agent config country list.
 *
 * `countryId` there is not always ISO alpha-3 -- Germany comes back as `GER`
 * while ISO 3166-1 has `DEU` -- so an id derived from a phone number only
 * matches reliably through the dialing code.
 */
export const findAvailableCountry = <T extends AvailableCountry>(
  availableCountries: T[] = [],
  { countryId, countryCode }: Partial<NumberCountry>,
): T | undefined => {
  // the id wins over the dialing code, which is shared by several countries
  const country =
    countryId &&
    availableCountries.find((item) => item.countryId === countryId);
  if (country) {
    return country;
  }
  return countryCode
    ? availableCountries.find((item) => item.countryCode === countryCode)
    : undefined;
};

/**
 * Format a destination of the given country as E164.
 */
export const formatCountryE164 = (
  phoneNumber: string,
  country?: AvailableCountry,
): string => {
  const alpha2 = country && alpha3ToAlpha2(country.countryId);
  if (alpha2) {
    return format({
      phoneNumber,
      countryCode: alpha2,
      type: formatTypes.e164,
    });
  }
  if (country?.countryCode) {
    // a country id that is not ISO alpha-3, eg. `GER`, has no alpha-2 to
    // format with, so the dialing code of the agent config takes over --
    // formatting it as US would turn a national number into a wrong one
    return (
      parsePhoneNumberFromString(phoneNumber, {
        defaultCallingCode: country.countryCode,
      })?.number || ''
    );
  }
  return format({ phoneNumber, type: formatTypes.e164 });
};
