import type { DirectTransferTypes } from '../../enums';

/**
 * How a transfer is carried out: WARM asks the destination first, COLD hands
 * the call over, VOICEMAIL sends it to a directory user's voicemail.
 */
export type CxTransferMode = Exclude<DirectTransferTypes, 'CANCEL'>;

/**
 * CxTransferCall options for configuration
 */
export interface CxTransferCallOptions {
  // Optional configuration options
}

/**
 * Phone book item for transfer
 */
export interface CxTransferPhoneBookItem {
  destination: string;
  name: string;
  countryId: string;
  phoneBookName: string;
  parsedDestination: string;
  phoneBookItemIndex: number;
}

/**
 * Direct agent list item
 */
export interface CxDirectAgentListItem {
  agentId: string;
  firstName: string;
  lastName: string;
  username: string;
  available: boolean;
}

/**
 * Received transfer call
 */
export interface CxReceivedTransferCall {
  uii: string;
  ani: string;
  agentId: string;
  agentName: string;
}

/**
 * Transfer call params
 */
export interface TransferCallParams {
  dialDest: string;
  countryId: string;
}
