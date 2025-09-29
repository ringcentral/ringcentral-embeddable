import React from 'react';

import FormattedMessage from '@ringcentral-integration/widgets/components/FormattedMessage';
import { RcLink } from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';
import { CustomizedAlert } from './CustomizedAlert';

const StyledLink = styled(RcLink)`
  font-size: 13px;
`;

export function getAlertRenderer({
  onThirdPartyLinkClick,
}) {
  return (message) => {
    if (message.message === 'allowMicrophonePermissionOnInactiveTab') {
      return () => 'Please go to your first opened tab with this widget to allow microphone permission for this call.';
    }
    if (message.message === 'popupWindowOpened') {
      return () => 'You have a popup window opened.';
    }
    if (message.message === 'cannotPopupWindowWithCall') {
      return () => 'Sorry, app can\'t open popup window when there are active calls.';
    }
    if (message.message === 'stopRecordDisabled') {
      return () => 'Sorry, stopping recording is not supported for this call. Please contact your account administrator to enable "Allow mute in auto recording".';
    }
    if (message.message === 'showCustomAlertMessage') {
      return ({ message, showMore }) => {
        return (
          <CustomizedAlert
            message={message}
            showMore={showMore}
            onLinkClick={onThirdPartyLinkClick}
          />
        );
      }
    }
    if (message.message === 'noUnreadForOldMessages') {
      return () => 'Sorry, app can\'t mark old messages as unread.';
    }
    if (message.message === 'noUnreadForOutboundMessages') {
      return () => 'Sorry, app can\'t mark outbound messages as unread.';
    }
    if (message.message === 'deleteSmsTemplateError') {
      return () => 'Sorry, template deletion failed. Please try again later.';
    }
    if (message.message === 'saveSmsTemplateError') {
      return () => 'Sorry, template saving failed. Please try again later.';
    }
    if (message.message === 'smsTemplateMaxLimit') {
      return () => 'Sorry, you have reached the maximum 25 number of templates.';
    }
    if (message.message === 'dropVoicemailMessageError') {
      return () => 'Sorry, failed to drop voicemail message. Please try again later.';
    }
    if (message.message === 'dropVoicemailMessageGreetingDetectionTimeout') {
      return () => 'Sorry, voicemail greeting ended detection timeout. Please try again later.';
    }
    if (message.message === 'dropVoicemailMessageFailedAsCallEnded') {
      return () => 'Sorry, voicemail greeting ended detection failed as call ended. Please try again later.';
    }
    if (message.message === 'dropVoicemailMessageSendedAsCallEnded') {
      return () => 'Sorry, voicemail message sended failed as call ended.';
    }
    if (message.message === 'dropVoicemailMessageMaxLimit') {
      return () => 'Sorry, you have reached the maximum 10 number of voicemail messages.';
    }
    if (message.message === 'tooManyVoicemailDroppingSessions') {
      return () => 'Sorry, there are too many voicemail dropping calls. Please wait them to finish and dial again.';
    }
    if (message.message === 'showNoiseReductionNotSupported') {
      return () => (
        <FormattedMessage
          message="Sorry, noise reduction isn't supported for current version. Check {link} for more details."
          values={{
            link: (
              <StyledLink
                href="https://ringcentral.github.io/ringcentral-embeddable/docs/config/noise-reduction/"
                target='_blank'
              >
                here
              </StyledLink>
            )
          }}
        />
      );
    }
    return null;
  };
}
