import type { HistoryCall } from '@ringcentral-integration/micro-phone/src/app/services';

export type SmartNotesHistoryCall = HistoryCall & {
  hasSmartNote?: boolean;
  id?: string;
};
