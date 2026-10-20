import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Button, List, ListItem, ListItemText } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

import { formatCxLeadPassDate } from '../../lib/formatCxLeadPassDate';
import { formatCxVoicemailAgentNotes } from '../../lib/formatCxVoicemailAgentNotes';
import type { CxLeadHistoryRecord } from '../../services/CxClient/interfaces';
import { DetailCard } from '../DetailCard';
import { LeadHistoryRefresh } from './LeadHistoryRefresh';
import type { LeadHistoryCardProps } from './LeadInfoPanel.interface';
import i18n from './i18n';
import { useLeadHistory } from './useLeadHistory';

/** Shown for a field the pass left empty, as in Agent One. */
const EMPTY_VALUE = '-';

interface LeadHistoryRecordProps {
  record: CxLeadHistoryRecord;
  divider: boolean;
}

/**
 * A labelled line under a history row's disposition, such as "Agent: Ann".
 */
interface HistoryLineProps {
  label: string;
  value: string;
  sign: string;
  /** Wraps up to 3 lines instead of truncating to one. */
  multiline?: boolean;
}

const HistoryLine: FunctionComponent<HistoryLineProps> = ({
  label,
  value,
  sign,
  multiline = false,
}) => {
  const text = `${label}: ${value}`;
  return (
    <span
      className={
        multiline
          ? 'typography-descriptor line-clamp-3 w-full whitespace-pre-line break-words text-neutral-b2'
          : 'typography-descriptor block w-full truncate text-neutral-b2'
      }
      title={text}
      data-sign={`leadHistory-${sign}`}
    >
      {text}
    </span>
  );
};

/**
 * One past attempt as a list row: the system disposition with the date on
 * one line, then labelled lines for the pass number, agent, agent
 * disposition and notes. Empty agent fields and notes are left out.
 */
const LeadHistoryRecord: FunctionComponent<LeadHistoryRecordProps> = ({
  record,
  divider,
}) => {
  const { t, currentLocale } = useLocale(i18n);
  const notes = formatCxVoicemailAgentNotes(
    record.agentNotes,
    record.passDisposition,
    {
      manualEntry: t('manualEntry'),
      accountAudio: t('accountAudio'),
      globalAudio: t('globalAudio'),
    },
  );
  const passDate = record.passDts
    ? formatCxLeadPassDate(record.passDts, { locale: currentLocale })
    : '';
  return (
    <ListItem
      size="auto"
      // A pass has no action, so it does not highlight on hover.
      hoverable={false}
      divider={divider}
      classes={{ content: 'bg-inherit !px-0 !py-2' }}
      data-sign="leadHistoryRecord"
    >
      <ListItemText
        primary={
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <span
              className="typography-mainText truncate text-neutral-b1"
              title={`${t('systemDisposition')}: ${record.passDisposition || EMPTY_VALUE}`}
              data-sign="leadHistory-systemDisposition"
            >
              {record.passDisposition || EMPTY_VALUE}
            </span>
            {passDate ? (
              <span
                className="typography-descriptor flex-none whitespace-nowrap text-neutral-b2"
                title={t('passDate')}
                data-sign="leadHistory-passDate"
              >
                {passDate}
              </span>
            ) : null}
          </div>
        }
        secondary={
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <HistoryLine
              label={t('passNumber')}
              value={record.passNumber || EMPTY_VALUE}
              sign="passNumber"
            />
            {record.agentName ? (
              <HistoryLine
                label={t('agent')}
                value={record.agentName}
                sign="agent"
              />
            ) : null}
            {record.agentDisposition ? (
              <HistoryLine
                label={t('agentDisposition')}
                value={record.agentDisposition}
                sign="agentDisposition"
              />
            ) : null}
            {notes ? (
              <HistoryLine
                label={t('notes')}
                value={notes}
                sign="agentNotes"
                multiline
              />
            ) : null}
          </div>
        }
      />
    </ListItem>
  );
};

/**
 * The lead's past dial attempts, loaded when the agent asks, as Agent One's
 * History panel does: **Show history** first, then **Refresh**. With
 * `autoLoad` it loads on mount, as Agent One's call history does. A parent
 * that passes `history` shows the title and Refresh itself.
 */
export const LeadHistoryCard: FunctionComponent<LeadHistoryCardProps> = ({
  leadId,
  loadLeadHistory,
  autoLoad = false,
  history: parentHistory,
}) => {
  const { t } = useLocale(i18n);
  const ownHistory = useLeadHistory({
    leadId,
    loadLeadHistory,
    autoLoad: autoLoad && !parentHistory,
  });
  const history = parentHistory ?? ownHistory;
  const { status, records } = history;
  return (
    <DetailCard data-sign="leadCard-history">
      <div className="flex w-full flex-col gap-3">
        {parentHistory ? null : (
          <div className="flex min-h-8 items-center justify-between gap-2">
            <span className="typography-subtitleMini text-neutral-b1">
              {t('history')}
            </span>
            {status === 'idle' ? (
              <Button
                variant="text"
                size="small"
                onClick={history.load}
                data-sign="leadHistoryShow"
              >
                {t('showHistory')}
              </Button>
            ) : (
              <LeadHistoryRefresh history={history} />
            )}
          </div>
        )}
        {status === 'loaded' && records.length === 0 ? (
          <div
            className="typography-descriptor text-neutral-b2"
            data-sign="leadHistoryEmpty"
          >
            {t('emptyHistory')}
          </div>
        ) : null}
        {status === 'failed' ? (
          <div
            className="typography-descriptor text-danger-f"
            data-sign="leadHistoryError"
          >
            {t('historyUnavailable')}
          </div>
        ) : null}
        {records.length ? (
          <List className="w-full" data-sign="leadHistoryList">
            {records.map((record, index) => (
              <LeadHistoryRecord
                key={`${record.passUii}-${record.passNumber}`}
                record={record}
                divider={index < records.length - 1}
              />
            ))}
          </List>
        ) : null}
      </div>
    </DetailCard>
  );
};
