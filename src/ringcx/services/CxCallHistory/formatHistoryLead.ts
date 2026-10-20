import { OutboundType } from '../CxClient/interfaces';
import type { HistoryItemResponse } from '../CxClient/interfaces';
import type { CxLeadDetails } from '../CxLeadInfo/CxLeadInfo.interface';

const toText = (value: unknown): string =>
  value === undefined || value === null ? '' : String(value);

/**
 * The lead of a past lead call, renamed from the call history REST fields to
 * the ones the Lead tab shows (`id`, `externalId` and `aux1`..`aux5` become
 * `leadId`, `externId` and `auxData1`..`auxData5`). Manual and inbound calls
 * have no lead.
 */
export function formatHistoryLead(
  outbound: HistoryItemResponse['outbound'],
): CxLeadDetails | undefined {
  if (outbound?.type !== OutboundType.LEAD || !outbound.lead?.id) {
    return undefined;
  }
  const { lead } = outbound;
  return {
    leadId: toText(lead.id),
    externId: lead.externalId,
    title: lead.title,
    suffix: lead.suffix,
    firstName: lead.firstName,
    midName: lead.midName,
    lastName: lead.lastName,
    email: lead.email,
    address1: lead.address1,
    address2: lead.address2,
    city: lead.city,
    state: lead.state,
    zip: lead.zip,
    gateKeeper: lead.gateKeeper,
    listDesc: lead.listDesc,
    leadState: lead.leadState,
    leadPasses: toText(lead.leadPasses),
    auxData1: lead.aux1,
    auxData2: lead.aux2,
    auxData3: lead.aux3,
    auxData4: lead.aux4,
    auxData5: lead.aux5,
    extraData: lead.extraData ?? {},
    campaignId: toText(outbound.campaignId) || undefined,
  };
}
