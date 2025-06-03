import React, { useState, useEffect } from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { BackHeaderView } from '../BackHeaderView';
import {
  RcIconButton,
  RcTypography,
  RcAlert,
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcListItemIcon,
  RcIcon,
} from '@ringcentral/juno';
import { Close, PlayCircle, SendFilled } from '@ringcentral/juno-icon';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

const SectionTitle = styled(RcTypography)`
  padding: 0 16px;
`;

const StyledAlert = styled(RcAlert)`
  margin: 16px;
`;

const NoMessage = styled(RcTypography)`
  padding: 0 16px;
  margin-top: 16px;
`;

export const VoicemailDropPanel = ({
  voicemailMessages,
  onClose,
  onBackButtonClick,
  showCloseButton,
  onDrop,
  onLoad,
  callSessionId,
  hideBackButton,
}) => {
  const [dropping, setDropping] = useState(false);
  const closeButton = showCloseButton ? (
    <RcIconButton
      symbol={Close}
      onClick={onClose}
      title='Close'
    />
  ) : null;

  useEffect(() => {
    onLoad();
  }, []);

  return (
    <BackHeaderView
      title='Voicemail drop'
      onBack={onBackButtonClick}
      hideBackButton={hideBackButton}
      rightButton={closeButton}
    >
      <Container>
        <StyledAlert>
          Pick a pre-recorded message to drop, then you can start a new call. The message will automatically be sent after voicemail greeting ends. The call will continue in the background until the message is delivered.
        </StyledAlert>
        <SectionTitle variant="body2">Pre-recorded messages:</SectionTitle>
        <RcList>
          {voicemailMessages.map((voicemailMessage) => (
            <RcListItem key={voicemailMessage.id}>
              <RcListItemIcon>
                <RcIcon symbol={PlayCircle} />
              </RcListItemIcon>
              <RcListItemText
                primary={voicemailMessage.label}
                primaryTypographyProps={{
                  title: voicemailMessage.label,
                }}
              />
              <RcListItemSecondaryAction>
                <RcIconButton
                  symbol={SendFilled}
                  onClick={async () => {
                    try {
                      setDropping(true);
                      await onDrop(callSessionId, voicemailMessage.id);
                      setDropping(false);
                    } catch (error) {
                      setDropping(false);
                      console.error(error);
                    }
                  }}
                  title='Drop'
                  disabled={dropping}
                />
              </RcListItemSecondaryAction>
            </RcListItem>
          ))}
          {
            voicemailMessages.length === 0 ? (
              <NoMessage variant="body1">
                No pre-recorded messages, please go to settings to create one.
              </NoMessage>
            ) : null
          }
        </RcList>
      </Container>
    </BackHeaderView>
  );
};
