import type { CxLeadUpdateFields } from '../CxClient/interfaces';
import type { CxLeadDetails } from '../CxLeadInfo/CxLeadInfo.interface';

/**
 * What a campaign lets agents change on its leads, from
 * `allowLeadUpdatesByCampaign`: nothing, every field, or every field but the
 * phone.
 */
export type CxLeadUpdatePermission = 'none' | 'all' | 'noPhone';

/** Fields saved on a lead, laid over it wherever it is shown. */
export type CxLeadEditPatch = Partial<CxLeadUpdateFields> & {
  destination?: string;
  destinationE164?: string;
};

export interface CxLeadEditRequest {
  lead: CxLeadDetails;
  /** E.164 numbers, at most 6. */
  phoneNumbers: string[];
  fields: CxLeadUpdateFields;
}
