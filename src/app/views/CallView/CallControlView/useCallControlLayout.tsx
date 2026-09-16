import { VOICEMAIL_DROP_STATUS_MAP } from '../../../services/WebphoneV2/voicemailDropStatus';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { ExpandLogButton } from '@ringcentral-integration/micro-phone/src/app/components';
import { useContactRenderInfoFromCall } from '@ringcentral-integration/micro-phone/src/app/hooks';
import contactRenderI18n from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/i18n';
import { isPreinsertCall } from '@ringcentral-integration/micro-phone/src/app/services';
import type { CallControlViewPanelProps } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import {
  CallControlInformation,
  CallControlLayout,
} from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/CallControlLayout';
import i18n from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/i18n';
import { PageHeaderBackButton } from '@ringcentral-integration/next-widgets/components';
import { TeamMd } from '@ringcentral/spring-icon';
import { Icon, IconButton, Tooltip } from '@ringcentral/spring-ui';
import React from 'react';

import { useCallDisplayNameWithMatches } from '../../../components/MatchedContactsTag';

type CallControlLayoutOptions = {
  header?: React.ReactNode;
  main: React.ReactNode;
  footer: React.ReactNode;
  aiNoteTip?: React.ReactNode;
  onBack: () => void;
  onConferenceClick: () => void;
} & Pick<CallControlViewPanelProps, 'expanded' | 'onExpand'>;

/**
 * Builds the call-control layout with an interactive matched-contact picker.
 */
export function useCallControlLayout(
  call: CallControlViewPanelProps['call'],
  {
    main,
    header,
    expanded,
    onExpand,
    footer,
    onBack,
    onConferenceClick,
    aiNoteTip,
  }: CallControlLayoutOptions,
): React.ReactElement {
  const {
    DisplayName: BaseDisplayName,
    displayPhoneNumber,
    Avatar,
    duration,
    myCallerId,
    callQueueName,
    direction,
    OnOtherDevice,
  } = useContactRenderInfoFromCall(call, {
    phoneNumberDisplayMode: 'unknown',
    hideBlockedFromInfo: true,
  });
  const { t } = useLocale(i18n, contactRenderI18n);
  // While a pre-recorded voicemail is playing there is no meaningful call
  // duration, so the timer is replaced by the drop status — matching the
  // legacy ActiveCallPanel, which swapped its DurationCounter the same way.
  const voicemailDropStatus = (
    call as { webphoneSession?: { voicemailDropStatus?: string } }
  ).webphoneSession?.voicemailDropStatus;
  const voicemailDropStatusText = voicemailDropStatus
    ? VOICEMAIL_DROP_STATUS_MAP[voicemailDropStatus]
    : undefined;
  const isInbound = direction === 'Inbound';
  const matches = isInbound ? call.fromMatches : call.toMatches;
  const DisplayName = useCallDisplayNameWithMatches(
    BaseDisplayName,
    call.sessionId,
    call.isConferenceCall ? undefined : matches,
    call.activityMatches,
  );
  const connecting = isPreinsertCall(call);
  const conferenceParticipantsCount = call.conferenceParticipants?.length;
  // The name is not a link here: the call control page has no room for a
  // contact detail view, and clicking through mid-call takes the user off the
  // active call, so the name stays plain text.
  const displayName = (
    <DisplayName displayControl={{ maybe: true, matchCounts: true }} />
  );
  return (
    <CallControlLayout
      aiNoteTip={aiNoteTip}
      callInformation={
        <CallControlInformation
          avatar={<Avatar size="large" />}
          startAdornment={<PageHeaderBackButton onClick={onBack} />}
        >
          {call.isConferenceCall ? (
            <>
              <h3
                className="truncate text-neutral-b0 typography-title w-full flex flex-col"
                data-sign="userDisplayName"
              >
                {displayName}
              </h3>
              <p
                className="typography-descriptorMini text-neutral-b2 mt-1"
                data-sign="userPhoneNumber"
              >
                {t('conferenceCall')}
              </p>
              {OnOtherDevice && <OnOtherDevice />}
              <div className="mt-2">
                <Tooltip
                  title={`${t('participants')} (${conferenceParticipantsCount})`}
                >
                  <IconButton
                    data-sign="conferenceCallParticipantsIcon"
                    size="xsmall"
                    color="secondary"
                    className="flex flex-row p-1 size-auto typography-descriptor px-2 gap-1.5 h-6"
                    onClick={onConferenceClick}
                  >
                    <Icon size="xsmall" symbol={TeamMd} />
                    <span>{conferenceParticipantsCount}</span>
                  </IconButton>
                </Tooltip>
              </div>
            </>
          ) : (
            <>
              <h3
                className="typography-title text-neutral-b0 truncate w-full flex flex-col"
                data-sign="userDisplayName"
              >
                {displayName}
              </h3>
              {displayPhoneNumber && (
                <p
                  className="typography-descriptorMini text-neutral-b0"
                  data-sign="userPhoneNumber"
                >
                  {displayPhoneNumber}
                </p>
              )}
              {OnOtherDevice && <OnOtherDevice />}
              {!callQueueName && myCallerId && (
                <p
                  className="typography-descriptorMini text-neutral-b2"
                  data-sign="userCallerId"
                >
                  {t(isInbound ? 'to' : 'myCallerId')}: {myCallerId}
                </p>
              )}
            </>
          )}
        </CallControlInformation>
      }
      contentDataSign="activeCallPanel"
      footer={footer}
      header={header}
      isConferenceCall={call.isConferenceCall}
      main={main}
      status={
        voicemailDropStatusText ?? (connecting ? t('connecting') : duration)
      }
      statusEnd={
        onExpand && typeof expanded === 'boolean' ? (
          <ExpandLogButton expanded={expanded} onExpand={onExpand} />
        ) : null
      }
    />
  );
}
