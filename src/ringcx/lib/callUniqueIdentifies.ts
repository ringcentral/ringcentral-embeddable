import { getCallAni } from './getCxCallNumbers';

interface IdentifiableCall {
  readonly ani?: string;
  readonly aniE164?: string;
  readonly dnis?: string;
  readonly dnisE164?: string;
}

/**
 * Contact-match keys are plain phone numbers. Call type lives on the call.
 */
export const makeCallsUniqueIdentifies = (calls: IdentifiableCall[]) => {
  const numbers = calls
    .map((call) => getCallAni(call))
    .filter((phoneNumber): phoneNumber is string => Boolean(phoneNumber));
  return Array.from(new Set(numbers));
};
