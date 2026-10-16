import { getCallAni } from '../../lib/getCxCallNumbers';
import type { CxBaseCall } from '../CxClient/interfaces';
import type { Lead } from '../CxLeads';
import type { CxLeadDetails } from './CxLeadInfo.interface';

/**
 * The lead of a call, as Agent One builds it (`apps/eag/src/app/phone/phone.js`):
 * the call's baggage, dialed at the call's number, overlaid with the fetched
 * preview lead of the same id, or else with the call's own `lead`.
 *
 * NEW-CALL's baggage lacks the campaign, lead state, list description, title,
 * suffix, email and gate keeper; only the preview lead brings those.
 *
 * @returns `null` when the call names no lead id; such calls get no Lead tab.
 */
export function resolveCxCallLead(
  call: CxBaseCall | null | undefined,
  leads: readonly Lead[],
): CxLeadDetails | null {
  const leadId = String(call?.baggage?.leadId || call?.lead?.leadId || '');
  if (!call || !leadId) {
    return null;
  }
  const previewLead = leads.find((lead) => String(lead.leadId) === leadId);
  return {
    ...call.baggage,
    destination: getCallAni(call),
    ...(previewLead ?? call.lead),
    leadId,
  };
}
