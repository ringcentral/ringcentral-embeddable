/** Number of aux data fields a lead has, `auxData1`..`auxData5`. */
export const CX_LEAD_AUX_FIELD_COUNT = 5;

/**
 * A campaign's `customLabels` from LOGIN-PHASE-1, one `{ aux_N_label }`
 * object per field.
 */
export type CxCampaignCustomLabels = ReadonlyArray<Record<string, string>>;

interface GetCxLeadAuxLabelsInput {
  campaignLabels?: CxCampaignCustomLabels;
  /** NEW-CALL baggage labels, a single `{ aux_N_label }` object. */
  baggageLabels?: Record<string, string>;
}

function findCampaignLabel(
  campaignLabels: CxCampaignCustomLabels,
  key: string,
): string {
  return campaignLabels.find((label) => key in label)?.[key] ?? '';
}

/**
 * Admin labels of the five aux fields: the campaign's label, else the call
 * baggage's, else `undefined` for the default "Aux N".
 *
 * Agent One reads the baggage fallback as an array, so it never applies
 * there; it is read as the object it is here.
 */
export function getCxLeadAuxLabels({
  campaignLabels = [],
  baggageLabels = {},
}: GetCxLeadAuxLabelsInput): Array<string | undefined> {
  return Array.from({ length: CX_LEAD_AUX_FIELD_COUNT }, (_, index) => {
    const key = `aux_${index + 1}_label`;
    return (
      findCampaignLabel(campaignLabels, key) || baggageLabels[key] || undefined
    );
  });
}
