export interface ActiveCallInfo {
  id: string;
  from: string;
  to: string;
  direction: string;
  sipData: {
      toTag: string;
      fromTag: string;
  };
  telephonySessionId: string;
}
