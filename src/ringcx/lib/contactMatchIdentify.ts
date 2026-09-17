interface ContactMatchQuery<T> {
  phoneNumber: string;
  callType: T;
}

type CallTypeRaw = 'INBOUND' | 'OUTBOUND' | 'INTERNAL';

type CallType = 'inbound' | 'outbound' | 'internal';

const separator = '_';

export const contactMatchIdentifyEncode = ({
  phoneNumber,
  callType,
}: ContactMatchQuery<CallTypeRaw | CallType>) =>
  `${phoneNumber}${separator}${callType}`.toLocaleLowerCase();

export const contactMatchIdentifyDecode = (identify: string) => {
  const [phoneNumber, callType] = identify.split(separator) as [
    ContactMatchQuery<CallType>['phoneNumber'],
    ContactMatchQuery<CallType>['callType'],
  ];
  return { phoneNumber, callType };
};
