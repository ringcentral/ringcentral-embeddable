import {
  AppFooterNav,
  AppHeaderNav,
  CopyIconButtonSpring,
} from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { VoicemailPlayer } from '@ringcentral-integration/micro-message/src/app/components';
import type { VoicemailPagePanelProps } from '@ringcentral-integration/micro-message/src/app/views/VoicemailView/Voicemail.view.interface';
import i18n from '@ringcentral-integration/micro-message/src/app/views/VoicemailView/VoicemailPage/i18n';
import {
  ActionMenuList,
  PageHeader,
  useHistoryActionButtons,
} from '@ringcentral-integration/next-widgets/components';
import { Block, BlockHeader } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React, { type FunctionComponent } from 'react';

import { useAdditionalMessageButtons } from '../ConversationsView/useAdditionalMessageButtons';

/**
 * The upstream voicemail page, plus the third-party `messageAction` buttons
 * that the upstream action list cannot render.
 */
export const VoicemailPage: FunctionComponent<VoicemailPagePanelProps> = ({
  currentVoicemail,
  className,
  goBack,
  onDownload,
  onStartLoad,
  useConversationItemInfo,
  useActionsHandler,
  audioStatus,
  updateAudioStatus,
  children,
}) => {
  const { t } = useLocale(i18n);
  const { info, actions } = useConversationItemInfo(currentVoicemail);
  const onAction = useActionsHandler(
    currentVoicemail,
    info,
    'Voicemail detail page',
  );
  const {
    DisplayName,
    formattedPhoneNumber,
    Avatar,
    creationTime,
    myCallerIdTitle,
    myCallerId,
  } = info;
  const historyButtons = useHistoryActionButtons(actions, onAction);
  const additionalButtons = useAdditionalMessageButtons(currentVoicemail);
  const buttons = [...historyButtons, ...additionalButtons];
  const voicemailAttachmentUri = currentVoicemail.voicemailAttachment?.uri;

  return (
    <>
      <AppHeaderNav override>
        <PageHeader onBackClick={goBack} />
      </AppHeaderNav>
      <div
        className={clsx(
          'mt-3 mb-4 flex flex-col gap-4 justify-center items-center',
          className,
        )}
        data-sign="contactDetail"
      >
        <Avatar size="xxlarge" />
        <div className="flex flex-col gap-2 items-center">
          <h2 className="typography-title truncate w-full px-4 text-center text-neutral-b0 flex flex-col items-center gap-1">
            <DisplayName
              displayControl={{
                maybe: true,
                matchCounts: true,
                align: 'center',
              }}
            />
          </h2>
          {formattedPhoneNumber && (
            <div className="flex gap-1 items-center">
              <p
                className="typography-subtitle text-neutral-b2"
                title={formattedPhoneNumber}
              >
                {formattedPhoneNumber}
              </p>
              <CopyIconButtonSpring getText={() => formattedPhoneNumber} />
            </div>
          )}
        </div>
        <div className="flex gap-6">
          <ActionMenuList buttons={buttons} variant="plain" />
        </div>
      </div>
      <div className="px-3 py-2" data-sign="toNumber">
        <Block className="mb-2">
          <BlockHeader>
            <span className="typography-descriptorMini">{myCallerIdTitle}</span>
            <div className="text-neutral-b2 typography-mainText">
              {myCallerId} ({t('me')})
            </div>
          </BlockHeader>
        </Block>
      </div>
      <div className="px-3 py-2">
        <Block className="mb-2">
          <BlockHeader>
            <span
              className="typography-descriptorMini"
              data-sign="voicemailCreationTime"
            >
              {creationTime}
            </span>
            <div className="text-neutral-b2">
              {currentVoicemail.voicemailAttachment && voicemailAttachmentUri ? (
                <VoicemailPlayer
                  data-sign="voicemailPlayer"
                  uri={voicemailAttachmentUri}
                  duration={currentVoicemail.voicemailAttachment.duration}
                  onStartLoad={onStartLoad}
                  onDownload={onDownload}
                  audioStatus={audioStatus}
                  updateAudioStatus={updateAudioStatus}
                  loadSourceExternally
                />
              ) : (
                t('notAvailable')
              )}
            </div>
          </BlockHeader>
        </Block>
      </div>
      <div data-sign="log-notes-transcript-section">{children}</div>
      <AppFooterNav />
    </>
  );
};

VoicemailPage.displayName = 'VoicemailPage';
