import { isCxRecordingUrl } from '../../lib/isCxRecordingUrl';
import type {
  CxLeadDetails,
  CxLeadInfoGroup,
  CxLeadInfoLabelKey,
  CxLeadInfoRow,
} from './CxLeadInfo.interface';
import { CX_LEAD_AUX_FIELD_COUNT } from './getCxLeadAuxLabels';

interface BuildCxLeadInfoRowsInput {
  lead: CxLeadDetails;
  /** Campaign or queue name. */
  source: string;
  /** Latest lead state, live from PREVIEW-LEAD-STATE when one arrived. */
  leadState?: string;
  /** A call's lead counts its passes before the call, a preview lead's now. */
  isCallLead: boolean;
  /** From `getCxLeadAuxLabels`; `undefined` keeps the default "Aux N". */
  auxLabels: ReadonlyArray<string | undefined>;
}

type LeadField = Extract<keyof CxLeadDetails, string>;

interface FieldSpec {
  field: LeadField;
  labelKey: CxLeadInfoLabelKey;
  group: CxLeadInfoGroup;
  wide?: boolean;
}

interface RowSpec {
  id: string;
  group: CxLeadInfoGroup;
  wide?: boolean;
  label: Pick<CxLeadInfoRow, 'labelKey' | 'label'>;
}

/** Rows after the lead state and passes, in Agent One's order per card. */
const FIELD_SPECS: readonly FieldSpec[] = [
  { field: 'listDesc', labelKey: 'listDescription', group: 'status', wide: true },
  { field: 'title', labelKey: 'title', group: 'contact' },
  { field: 'suffix', labelKey: 'suffix', group: 'contact' },
  { field: 'email', labelKey: 'email', group: 'contact', wide: true },
  { field: 'address1', labelKey: 'address1', group: 'contact', wide: true },
  { field: 'address2', labelKey: 'address2', group: 'contact', wide: true },
  { field: 'city', labelKey: 'city', group: 'contact' },
  { field: 'state', labelKey: 'state', group: 'contact' },
  { field: 'zip', labelKey: 'zip', group: 'contact' },
  { field: 'leadId', labelKey: 'leadId', group: 'ids' },
  { field: 'externId', labelKey: 'externId', group: 'ids' },
  { field: 'gateKeeper', labelKey: 'gateKeeper', group: 'ids' },
];

function toText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

/**
 * A recording takes the full card width for its player.
 */
function createRow(
  { id, group, wide = false, label }: RowSpec,
  value: unknown,
): CxLeadInfoRow {
  const text = toText(value);
  const isRecording = isCxRecordingUrl(text);
  return {
    id,
    group,
    wide: wide || isRecording,
    ...label,
    value: text,
    isRecording,
  };
}

function isHiddenField(lead: CxLeadDetails, field: LeadField): boolean {
  return field === 'listDesc' && lead.showListName === false;
}

function buildHeadRows({
  lead,
  source,
  leadState,
  isCallLead,
}: BuildCxLeadInfoRowsInput): CxLeadInfoRow[] {
  const rows = [
    createRow(
      {
        id: 'source',
        group: 'status',
        wide: true,
        label: { labelKey: 'source' },
      },
      source,
    ),
    createRow(
      { id: 'leadState', group: 'status', label: { labelKey: 'leadState' } },
      leadState,
    ),
  ];
  if (lead.showLeadPasses !== false) {
    const labelKey = isCallLead ? 'preCallLeadPasses' : 'currentLeadPasses';
    rows.push(
      createRow(
        { id: 'leadPasses', group: 'status', label: { labelKey } },
        lead.leadPasses,
      ),
    );
  }
  return rows;
}

function buildFieldRows(lead: CxLeadDetails): CxLeadInfoRow[] {
  return FIELD_SPECS.filter(({ field }) => !isHiddenField(lead, field)).map(
    ({ field, labelKey, group, wide }) =>
      createRow({ id: field, group, wide, label: { labelKey } }, lead[field]),
  );
}

/**
 * Aux rows show only for a campaign or queue lead, as in Agent One.
 */
function buildAuxRows(
  lead: CxLeadDetails,
  auxLabels: ReadonlyArray<string | undefined>,
): CxLeadInfoRow[] {
  if (!lead.campaignId && !lead.sourceId) {
    return [];
  }
  return Array.from({ length: CX_LEAD_AUX_FIELD_COUNT }, (_, index) => {
    const number = index + 1;
    const label = auxLabels[index];
    return createRow(
      {
        id: `auxData${number}`,
        group: 'aux',
        label: label
          ? { label }
          : { labelKey: `aux${number}` as CxLeadInfoLabelKey },
      },
      lead[`auxData${number}` as LeadField],
    );
  });
}

function buildExtraDataRows(lead: CxLeadDetails): CxLeadInfoRow[] {
  return Object.entries(lead.extraData ?? {}).map(([key, value]) =>
    createRow(
      { id: `extraData-${key}`, group: 'extra', label: { label: key } },
      value,
    ),
  );
}

/**
 * The Lead details rows Agent One shows (`phone.detail.js` `_prepareList`),
 * each tagged with the card it is shown in: the source (which Agent One puts
 * in its header), state, passes and list; contact
 * details; ids; aux data; then the lead's extra data under its own keys.
 *
 * Empty rows are left out, except extra data, which Agent One always shows.
 * State and Zip show whenever they have a value: the US-dialing flag Agent
 * One also checks is not available here.
 */
export function buildCxLeadInfoRows(
  input: BuildCxLeadInfoRowsInput,
): CxLeadInfoRow[] {
  const fieldRows = [
    ...buildHeadRows(input),
    ...buildFieldRows(input.lead),
    ...buildAuxRows(input.lead, input.auxLabels),
  ].filter((row) => row.value !== '');
  return [...fieldRows, ...buildExtraDataRows(input.lead)];
}
