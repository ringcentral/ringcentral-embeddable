import { useFormattedPhoneNumber } from '@ringcentral-integration/micro-auth/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import {
  ArrowRightUpMd,
  CallMd,
  CopyMd,
  DispositionMd,
  EditMd,
} from '@ringcentral/spring-icon';
import {
  Block,
  CircularProgressIndicator,
  IconButton,
} from '@ringcentral/spring-ui';
import type { FunctionComponent, ReactNode } from 'react';
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar';

import { useCxCallContactRenderInfo } from '../../hooks/useCxCallContactRenderInfo';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber/formatPhoneNumber';
import { ringCXLogId } from '../../lib/formatRingCXCall';
import type { CallHistoryDetailPanelProps } from './CallHistoryDetailPanel.interface';
import i18n from '../../views/CxCallHistoryDetailView/i18n';

/**
 * Format call time for the detail time card.
 */
function formatCallTime(timestamp: number): string {
  const callTime = dayjs(timestamp);
  const now = dayjs();
  if (callTime.isSame(now, 'day')) {
    return callTime.format('h:mm A');
  }
  if (callTime.isSame(now.subtract(1, 'day'), 'day')) {
    return `Yesterday, ${callTime.format('h:mm A')}`;
  }
  return callTime.format('ddd, h:mm A');
}

/**
 * Format duration as "(28 sec)" / "(1 min 5 sec)" for the status line.
 */
function formatDurationParts(
  durationMs: number,
  t: (key: string, options?: { count: number }) => string,
): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(t('hour', { count: hours }));
  }
  if (minutes > 0) {
    parts.push(t('minute', { count: minutes }));
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(t('second', { count: seconds }));
  }
  return `(${parts.join(' ')})`;
}

interface DetailFieldProps {
  label: string;
  value?: string;
  'data-sign'?: string;
}

const DetailField: FunctionComponent<DetailFieldProps> = ({
  label,
  value,
  'data-sign': dataSign,
}) => {
  if (!value) {
    return null;
  }
  return (
    <div className="min-w-0" data-sign={dataSign}>
      <div className="typography-descriptorMini text-neutral-b2">{label}</div>
      <div className="typography-mainText text-neutral-b1 truncate" title={value}>
        {value}
      </div>
    </div>
  );
};

interface DetailCardProps {
  children: ReactNode;
  'data-sign'?: string;
}

const DetailCard: FunctionComponent<DetailCardProps> = ({
  children,
  'data-sign': dataSign,
}) => (
  <Block
    className="mb-2"
    borderRadius="medium"
    data-sign={dataSign}
  >
    {children}
  </Block>
);

/**
 * CallHistoryDetailPanel - Read-only presentational component for call history detail
 *
 * Layout matches the RingCX web-agent history detail: centered contact header,
 * then bordered cards for source, time/status, disposition, and term details.
 */
export const CallHistoryDetailPanel: FunctionComponent<
  CallHistoryDetailPanelProps
> = ({
  callDetail,
  callMeta,
  isInbound,
  isLoading,
  callNotFound,
  dialableNumber,
  canDial,
  isDialDisabled,
  onBack,
  onDial,
  onCopyNumber,
  onCopyCallId,
  hostLogActions,
  onHostLogAction,
}) => {
  const { t } = useLocale(i18n);
  const hasViewLogAction = Boolean(
    hostLogActions?.some((action) => action.type === 'viewLog'),
  );

  const phoneNumber = useMemo(() => {
    if (!callDetail) return '';
    const party = isInbound ? callDetail.from : callDetail.to;
    return party?.phoneNumber || '';
  }, [callDetail, isInbound]);

  const serverName = isInbound ? callDetail?.fromName : callDetail?.toName;
  // The same resolution as the history row: the logged contact, else the
  // user's pick, else the `Maybe: <name>` guess, with the match picker.
  const { renderInfo, DisplayName } = useCxCallContactRenderInfo({
    uii: callDetail ? ringCXLogId(callDetail) : undefined,
    phoneNumber,
    matches: isInbound ? callDetail?.fromMatches : callDetail?.toMatches,
    activityMatches: callDetail?.activityMatches,
    serverName: serverName !== phoneNumber ? serverName : undefined,
    phoneNumberDisplayMode: 'unknown',
  });
  const matchedContact = renderInfo.matchedContact as
    | { name?: string; profileImageUrl?: string }
    | undefined;
  const contactName = matchedContact?.name || serverName || '';
  const contactAvatarUrl = matchedContact?.profileImageUrl;

  const isRealName = !!contactName && contactName !== phoneNumber;
  const displayName = isRealName ? contactName : t('unknown');
  const formattedPhoneNumber = useFormattedPhoneNumber(phoneNumber);

  const formattedDnis = useMemo(() => {
    if (!callMeta.dnis) return '';
    return (
      formatPhoneNumber({ phoneNumber: callMeta.dnis }) || callMeta.dnis
    );
  }, [callMeta.dnis]);

  const toFromLabel = isInbound ? t('to') : t('from');
  const toFromValue = useMemo(() => {
    if (isInbound) {
      return formattedDnis || callMeta.queueName || '';
    }
    if (callMeta.outboundType === 'MANUAL') {
      return t('manualOutbound');
    }
    return callMeta.campaignName || callMeta.queueName || '';
  }, [
    isInbound,
    formattedDnis,
    callMeta.queueName,
    callMeta.campaignName,
    callMeta.outboundType,
    t,
  ]);

  const sourceLabel = callMeta.queueName
    ? t('queueName')
    : callMeta.campaignName
      ? t('campaignName')
      : '';
  const sourceValue = callMeta.queueName || callMeta.campaignName || '';
  const showSource =
    !!sourceValue &&
    sourceValue.trim().toLocaleLowerCase() !==
      toFromValue.trim().toLocaleLowerCase();

  const callTimeText = useMemo(() => {
    if (!callDetail?.startTime) return '';
    return formatCallTime(callDetail.startTime);
  }, [callDetail?.startTime]);

  const directionLabel = isInbound ? t('inbound') : t('outbound');
  const durationLabel =
    callMeta.durationMs != null && callMeta.durationMs > 0
      ? formatDurationParts(callMeta.durationMs, t)
      : '';
  const statusLine = durationLabel
    ? `${directionLabel} ${durationLabel}`
    : directionLabel;

  if (isLoading && !callDetail) {
    return (
      <div
        className="flex flex-col h-full bg-neutral-base"
        data-sign="callHistoryDetailLoading"
      >
        <AppHeaderNav override>
          <PageHeader onBackClick={onBack}>{t('callDetails')}</PageHeader>
        </AppHeaderNav>
        <div className="flex-1 flex items-center justify-center">
          <CircularProgressIndicator size="medium" />
        </div>
        <AppFooterNav />
      </div>
    );
  }

  if (callNotFound) {
    return (
      <div
        className="flex flex-col h-full bg-neutral-base"
        data-sign="callHistoryDetailNotFound"
      >
        <AppHeaderNav override>
          <PageHeader onBackClick={onBack}>{t('callDetails')}</PageHeader>
        </AppHeaderNav>
        <div className="flex-1 flex items-center justify-center">
          <p className="typography-mainText text-neutral-b2">
            {t('callNotFound')}
          </p>
        </div>
        <AppFooterNav />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-neutral-base"
      data-sign="CallHistoryDetailPanel"
    >
      <AppHeaderNav override>
        <PageHeader onBackClick={onBack}>{t('callDetails')}</PageHeader>
      </AppHeaderNav>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          className="flex flex-col items-center gap-2 mb-4"
          data-sign="callDetailInfoHeader"
        >
          <ContactAvatar
            size="xlarge"
            variant="circle"
            contactName={isRealName ? contactName : undefined}
            phoneNumber={phoneNumber}
            url={contactAvatarUrl}
          />
          <div
            className="typography-title text-neutral-b1 text-center truncate max-w-full"
            data-sign="matchName"
            title={displayName}
          >
            <DisplayName
              displayControl={{ maybe: true, matchCounts: true, align: 'center' }}
            />
          </div>
          {phoneNumber ? (
            <div className="flex items-center gap-1 max-w-full">
              <span
                className="typography-mainText text-neutral-b1 truncate"
                data-sign="followInfo"
                title={formattedPhoneNumber}
              >
                {formattedPhoneNumber}
              </span>
              <IconButton
                symbol={CopyMd}
                size="xsmall"
                variant="icon"
                color="neutral"
                onClick={() => onCopyNumber(phoneNumber)}
                data-sign="historyDetailCopyNumber"
                aria-label={t('copyNumber')}
                TooltipProps={{ title: t('copyNumber') }}
              />
            </div>
          ) : null}
          <div
            className="flex items-center justify-center gap-3"
            data-sign="historyDetailActions"
          >
            {/* Hide dial when allowHistoricalDialing is off — eag hides the
                callback control rather than showing a disabled state. */}
            {canDial && dialableNumber ? (
              <IconButton
                symbol={CallMd}
                size="small"
                shape="circular"
                variant="outlined"
                color="neutral"
                disabled={isDialDisabled}
                onClick={() => onDial(dialableNumber)}
                data-sign="historyDetailDialButton"
                aria-label={t('dial')}
                TooltipProps={{ title: t('dial') }}
              />
            ) : null}
            {(hostLogActions || []).map((action) => (
              <IconButton
                key={action.type}
                symbol={
                  action.type === 'viewLog'
                    ? ArrowRightUpMd
                    : hasViewLogAction
                    ? EditMd
                    : DispositionMd
                }
                size="small"
                shape="circular"
                variant="outlined"
                color="neutral"
                disabled={action.disabled}
                onClick={() => onHostLogAction?.(action.type)}
                data-sign={`historyDetail-${action.type}`}
                aria-label={action.label || action.type}
                TooltipProps={{ title: action.label || action.type }}
              />
            ))}
            {callMeta.callId ? (
              <IconButton
                symbol={CopyMd}
                size="small"
                shape="circular"
                variant="outlined"
                color="neutral"
                onClick={() => onCopyCallId(callMeta.callId as string)}
                data-sign="historyDetailCopyCallId"
                aria-label={t('copyCallId')}
                TooltipProps={{ title: t('copyCallId') }}
              />
            ) : null}
          </div>
        </div>

        {(toFromValue || showSource) && (
          <DetailCard data-sign="sourceBlock">
            <div className="grid grid-cols-2 gap-3 w-full">
              <DetailField
                label={toFromLabel}
                value={toFromValue}
                data-sign="toFromField"
              />
              {showSource ? (
                <DetailField
                  label={sourceLabel}
                  value={sourceValue}
                  data-sign="sourceField"
                />
              ) : null}
            </div>
          </DetailCard>
        )}

        {(callTimeText || statusLine) && (
          <DetailCard data-sign="timeStatusBlock">
            <div className="w-full">
              {callTimeText ? (
                <div
                  className="typography-descriptorMini text-neutral-b2"
                  data-sign="callTime"
                >
                  {callTimeText}
                </div>
              ) : null}
              <div
                className="typography-mainText text-success-f"
                data-sign="callStatusLine"
              >
                {statusLine}
              </div>
            </div>
          </DetailCard>
        )}

        {callMeta.disposition ? (
          <DetailCard data-sign="dispositionBlock">
            <DetailField
              label={t('disposition')}
              value={callMeta.disposition}
              data-sign="dispositionField"
            />
          </DetailCard>
        ) : null}

        {(callMeta.callState ||
          formattedDnis ||
          callMeta.termParty ||
          callMeta.termReason) && (
          <DetailCard data-sign="termDetailsBlock">
            <div className="grid grid-cols-2 gap-3 w-full">
              <DetailField
                label={t('state')}
                value={callMeta.callState}
                data-sign="stateField"
              />
              <DetailField
                label={t('dnis')}
                value={formattedDnis}
                data-sign="dnisField"
              />
              <DetailField
                label={t('termParty')}
                value={callMeta.termParty}
                data-sign="termPartyField"
              />
              <DetailField
                label={t('termReason')}
                value={callMeta.termReason}
                data-sign="termReasonField"
              />
            </div>
          </DetailCard>
        )}
      </div>
      <AppFooterNav />
    </div>
  );
};

CallHistoryDetailPanel.displayName = 'CallHistoryDetailPanel';
