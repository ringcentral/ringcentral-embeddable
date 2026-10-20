import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { FunctionComponent } from 'react';
import React from 'react';

import type {
  CxLeadInfoGroup,
  CxLeadInfoRow,
} from '../../services/CxLeadInfo/CxLeadInfo.interface';
import { DetailCard, DetailField } from '../DetailCard';
import type { LeadInfoCardsProps } from './LeadInfoPanel.interface';
import { LeadRecordingPlayer } from './LeadRecordingPlayer';
import i18n from './i18n';

/** Shown for an extra data field the lead left empty. */
const EMPTY_VALUE = '-';

/** Card order, top to bottom. */
const GROUP_ORDER: readonly CxLeadInfoGroup[] = [
  'status',
  'contact',
  'ids',
  'aux',
  'extra',
];

interface LeadInfoFieldProps {
  row: CxLeadInfoRow;
  loadRecording: LeadInfoCardsProps['loadRecording'];
}

const LeadInfoField: FunctionComponent<LeadInfoFieldProps> = ({
  row,
  loadRecording,
}) => {
  const { t } = useLocale(i18n);
  const label = row.labelKey ? t(row.labelKey) : row.label ?? '';
  return (
    <DetailField
      label={label}
      value={row.value || EMPTY_VALUE}
      className={row.wide ? 'col-span-2' : ''}
      data-sign={`leadField-${row.id}`}
    >
      {row.isRecording ? (
        <LeadRecordingPlayer value={row.value} loadRecording={loadRecording} />
      ) : undefined}
    </DetailField>
  );
};

/**
 * The rows of each non-empty card, in card order.
 */
function getCardRows(rows: readonly CxLeadInfoRow[]): CxLeadInfoRow[][] {
  return GROUP_ORDER.map((group) =>
    rows.filter((row) => row.group === group),
  ).filter((groupRows) => groupRows.length > 0);
}

/**
 * The Lead details Agent One shows (`containers/CallDetails/LeadInfoPanel`),
 * in two-column cards like the CX call history detail: status, contact,
 * ids, aux data, then extra data. Used by the Lead tab and by the call
 * history detail page.
 */
export const LeadInfoCards: FunctionComponent<LeadInfoCardsProps> = ({
  rows,
  loadRecording,
}) => (
  <>
    {getCardRows(rows).map((groupRows) => (
      <DetailCard
        key={groupRows[0].group}
        data-sign={`leadCard-${groupRows[0].group}`}
      >
        <div className="grid w-full grid-cols-2 gap-3">
          {groupRows.map((row) => (
            <LeadInfoField
              key={row.id}
              row={row}
              loadRecording={loadRecording}
            />
          ))}
        </div>
      </DetailCard>
    ))}
  </>
);
