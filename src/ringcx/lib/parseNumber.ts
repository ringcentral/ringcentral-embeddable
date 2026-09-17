import { parse, format, formatTypes } from '@ringcentral-integration/phone-number';
import cleanNumber from '@ringcentral-integration/phone-number/lib/cleanNumber';
import { messageTypes, callErrors } from '../enums';

import { CxTypeError } from './CxTypeError';

export const parseNumber = (input: string) => {
  const { parsedNumber, isValid, hasInvalidChars } = parse({
    input,
  });

  if (input === '911' || input === '933' || input === '112') {
    throw new CxTypeError({
      type: callErrors.emergencyNumber,
    });
  }

  if (!isValid || hasInvalidChars || !parsedNumber) {
    throw new CxTypeError({
      type: messageTypes.INVALID_NUMBER,
    });
  }

  const formattedNumber = cleanNumber(format({
    phoneNumber: input,
    type: formatTypes.e164,
  }));

  return formattedNumber;
};
