import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const transferErrors = ObjectMap.fromKeys([
  'TYPE_ERROR',
  'AGENT_ID_ERROR',
  'CONTACT_ID_ERROR',
  'RECIPIENT_NUMBER_ERROR',
  'TRANSFER_ERROR',
  'SEND_VOICEMAIL_ERROR',
]);
