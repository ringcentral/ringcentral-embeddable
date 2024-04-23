import React from 'react';

import FormattedMessage from '@ringcentral-integration/widgets/components/FormattedMessage';
import { RcLink } from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

const StyledLink = styled(RcLink)`
  font-size: 13px;
`;

export function getAlertRenderer() {
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
      return () => message.payload.alertMessage;
    }
    if (message.message === 'noUnreadForOldMessages') {
      return () => 'Sorry, app can\'t mark old messages as unread.';
    }
    if (message.message === 'noUnreadForOutboundMessages') {
      return () => 'Sorry, app can\'t mark outbound messages as unread.';
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
