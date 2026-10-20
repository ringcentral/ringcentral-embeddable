import { useFormattedPhoneNumber } from '@ringcentral-integration/micro-auth/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  ActionMenuList,
  PageHeader,
  PageHeaderBackButton,
} from '@ringcentral-integration/next-widgets/components';
import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
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
  CircularProgressIndicator,
  IconButton,
} from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar';

import { useCxCallContactRenderInfo } from '../../hooks/useCxCallContactRenderInfo';
import { DetailCard, DetailField } from '../DetailCard';
import { PastCallTabs } from '../LeadInfoPanel';
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

/** Header actions shown as buttons; the rest go in the More menu. */
const ACTION_DISPLAY_COUNT = 2;

interface CreateHeaderButtonOptions {
  actionType: string;
  label: string;
  symbol: ActionMenuListButtonProps['symbol'];
  disabled?: boolean;
  onClick: () => void;
  dataSign: string;
}

/**
 * A header action, styled as the EX call detail page's
 * (`useCallHistoryActionButtons`).
 */
function createHeaderButton({
  actionType,
  label,
  symbol,
  disabled = false,
  onClick,
  dataSign,
}: CreateHeaderButtonOptions): ActionMenuListButtonProps {
  return {
    actionType,
    color: 'secondary',
    disabled,
    label,
    onClick: (event) => {
      event.stopPropagation();
      onClick();
    },
    shape: 'squircle',
    size: 'medium',
    symbol,
    variant: 'outlined',
    'data-sign': dataSign,
  } as ActionMenuListButtonProps;
}

/**
 * CallHistoryDetailPanel - Read-only presentational component for call history detail
 *
 * Laid out as the EX call detail page: a compact header with back, avatar,
 * name, number and actions, then bordered cards for source, time/status,
 * disposition and term details, split into pill tabs for a lead call.
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
  pastLead,
  showLeadHistory,
  loadRecording,
  loadLeadHistory,
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

  const actionButtons: ActionMenuListButtonProps[] = [
    // Hidden when allowHistoricalDialing is off — eag hides the callback
    // control rather than showing a disabled state.
    ...(canDial && dialableNumber
      ? [
          createHeaderButton({
            actionType: 'dial',
            label: t('dial'),
            symbol: CallMd,
            disabled: isDialDisabled,
            onClick: () => onDial(dialableNumber),
            dataSign: 'historyDetailDialButton',
          }),
        ]
      : []),
    ...(hostLogActions || []).map((action) =>
      createHeaderButton({
        actionType: action.type,
        label: action.label || action.type,
        symbol:
          action.type === 'viewLog'
            ? ArrowRightUpMd
            : hasViewLogAction
            ? EditMd
            : DispositionMd,
        disabled: action.disabled,
        onClick: () => onHostLogAction?.(action.type),
        dataSign: `historyDetail-${action.type}`,
      }),
    ),
    ...(callMeta.callId
      ? [
          createHeaderButton({
            actionType: 'copyCallId',
            label: t('copyCallId'),
            symbol: CopyMd,
            onClick: () => onCopyCallId(callMeta.callId as string),
            dataSign: 'historyDetailCopyCallId',
          }),
        ]
      : []),
  ];

  // Who and when: always on top, as on the EX call detail page.
  const summaryCards = (
    <>
      {(toFromValue || showSource) && (
        <DetailCard data-sign="sourceBlock">
          {/* Two columns only when both fields show, so a lone value, such
              as a long campaign name, gets the whole width. */}
          <div
            className={`grid gap-3 w-full ${
              toFromValue && showSource ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
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
    </>
  );

  const hasDetailCards = Boolean(
    callMeta.disposition ||
      callMeta.callState ||
      formattedDnis ||
      callMeta.termParty ||
      callMeta.termReason,
  );

  // Disposition and term details: under the Call tab for a lead call.
  const detailCards = (
    <>
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
    </>
  );

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
      <AppHeaderNav override resetImmediately>
        <div
          className="flex h-[72px] items-center gap-1 px-2 pt-2"
          data-sign="callDetailInfoHeader"
        >
          <PageHeaderBackButton
            onClick={onBack}
            className="flex-none"
            size="medium"
          />
          <div
            className="flex flex-auto items-center gap-2 overflow-hidden"
            data-sign="contactDetail"
          >
            <ContactAvatar
              size="large"
              variant="circle"
              contactName={isRealName ? contactName : undefined}
              phoneNumber={phoneNumber}
              url={contactAvatarUrl}
            />
            <div className="ml-1 flex flex-auto flex-col overflow-hidden">
              <h2
                className="typography-subtitle flex items-center gap-1 truncate text-neutral-b0"
                data-sign="matchName"
                title={displayName}
              >
                <DisplayName displayControl={{ maybe: true, matchCounts: true }} />
              </h2>
              {phoneNumber ? (
                <div className="flex items-center gap-1" data-sign="displayNumber">
                  <p
                    className="typography-descriptor truncate text-neutral-b2"
                    data-sign="followInfo"
                    title={formattedPhoneNumber}
                  >
                    {formattedPhoneNumber}
                  </p>
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
            </div>
          </div>
          {actionButtons.length ? (
            <div
              className="flex flex-none items-center gap-1"
              data-sign="historyDetailActions"
            >
              <ActionMenuList
                buttons={actionButtons}
                displayCount={ACTION_DISPLAY_COUNT}
                variant="plain"
                propsMap={{ all: { variant: 'contained' } }}
                moreButtonProps={{ variant: 'contained' }}
              />
            </div>
          ) : null}
        </div>
      </AppHeaderNav>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {summaryCards}
        {pastLead ? (
          <PastCallTabs
            callContent={hasDetailCards ? detailCards : undefined}
            rows={pastLead.rows}
            leadId={pastLead.leadId}
            loadRecording={loadRecording}
            loadLeadHistory={showLeadHistory ? loadLeadHistory : undefined}
          />
        ) : (
          detailCards
        )}
      </div>
      <AppFooterNav />
    </div>
  );
};

CallHistoryDetailPanel.displayName = 'CallHistoryDetailPanel';
