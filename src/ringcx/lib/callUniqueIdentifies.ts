import { contactMatchIdentifyEncode } from './contactMatchIdentify';

interface IdentifiableCall {
  readonly ani: string;
  readonly callType:
    | 'INBOUND'
    | 'OUTBOUND'
    | 'INTERNAL'
    | 'inbound'
    | 'outbound'
    | 'internal';
}

export const makeCallsUniqueIdentifies = (calls: IdentifiableCall[]) => {
  const numbers = calls.map(({ ani, callType }) => {
    const id = contactMatchIdentifyEncode({
      phoneNumber: ani,
      callType,
    });
    return id;
  });
  return Array.from(new Set(numbers));
};
