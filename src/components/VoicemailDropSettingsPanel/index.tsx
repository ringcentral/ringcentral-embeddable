import React, { useState, useEffect } from 'react';
import {
  styled,
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcListItemIcon,
  RcIcon,
  RcIconButton,
  RcButton,
  RcTypography,
  RcAlert,
  RcTooltip,
  RcSlider,
  RcFormLabel,
} from '@ringcentral/juno';
import { BackHeaderView } from '../BackHeaderView';
import { Edit, PlayCircle, Delete, ViewBorder } from '@ringcentral/juno-icon';
import { VoicemailDropMessage } from './VoicemailDropMessage';
import { ConfirmDialog } from '../ConfirmDialog';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const AddButtonWrapper = styled.div`
  margin: 16px;
`;

const SectionTitle = styled(RcTypography)`
  margin: 16px;
`;

const StyledAlert = styled(RcAlert)`
  margin: 16px;
`;

const SliderWrapper = styled.div`
  padding: 0 16px;
`;

const StyledFormLabel = styled(RcFormLabel)`
  font-size: 0.75rem;
`;

export const VoicemailDropSettingsPanel = ({
  onBackButtonClick,
  voicemailMessages,
  externalVoicemailDropMessages,
  onSave,
  onDelete,
  onLoadExternalVoicemailDropMessages,
  currentLocale,
  noBeepSilenceDuration,
  onNoBeepSilenceDurationChange,
}) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  useEffect(() => {
    if (typeof onLoadExternalVoicemailDropMessages === 'function') {
      onLoadExternalVoicemailDropMessages();
    }
  }, []);

  const content = selectedMessage ? (
    <VoicemailDropMessage
      message={selectedMessage}
      onSave={(newMessage) => {
        onSave(newMessage);
        setSelectedMessage(null);
      }}
      currentLocale={currentLocale}
    />
  ) : (
    voicemailMessages.length > 0 ? (
      <>
        <SectionTitle variant="body2">
          Pre-recorded messages:
        </SectionTitle>
        <RcList>
          {voicemailMessages.map((message) => (
            <RcListItem key={message.id}>
              <RcListItemIcon>
                <RcIcon symbol={PlayCircle} />
              </RcListItemIcon>
              <RcListItemText
                primary={message.label}
                primaryTypographyProps={{
                  title: message.label,
                }}
              />
              <RcListItemSecondaryAction>
                <RcIconButton symbol={Edit} onClick={() => setSelectedMessage(message)} />
                <RcIconButton
                  symbol={Delete}
                  onClick={() => {
                    setDeleteMessage(message);
                    setDeleteDialogOpen(true);
                  }}
                />
              </RcListItemSecondaryAction>

            </RcListItem>
          ))}
          {externalVoicemailDropMessages.map((message) => (
            <RcListItem key={message.id}>
              <RcListItemIcon>
                <RcIcon symbol={PlayCircle} />
              </RcListItemIcon>
              <RcListItemText primary={message.label} />
              <RcListItemSecondaryAction>
                <RcIconButton symbol={ViewBorder} onClick={() => {
                  setSelectedMessage(message);
                }} />
              </RcListItemSecondaryAction>
            </RcListItem>
          ))}
        </RcList>
      </>
    ) : null
  );
  return (
    <BackHeaderView
      title="Voicemail drop settings"
      onBack={() => {
        if (selectedMessage) {
          setSelectedMessage(null);
        } else {
          onBackButtonClick();
        }
      }}
    >
      <Container>
        {
          !selectedMessage && (
            <StyledAlert severity="info">
              When you notice that your outbound call goes to voicemail, you can drop a pre-recorded message.
            </StyledAlert>
          )
        }
        {
          !selectedMessage && (
            <SliderWrapper>
              <StyledFormLabel>Silence timeout duration</StyledFormLabel>
              <RcSlider
                value={noBeepSilenceDuration}
                onChange={(e, value) => onNoBeepSilenceDurationChange(value)}
                min={2}
                max={8}
                step={1}
              />
              <RcTypography variant="caption1" color="textSecondary">
                The app listens for the voicemail beep to start playing the pre-recorded message. If no beep is detected, it will wait for {noBeepSilenceDuration} seconds of silence before sending the message. Setting the timeout too short may cause false silence detection.
              </RcTypography>
            </SliderWrapper>
          )
        }
        {content}
        {
          !selectedMessage && (
            <RcTooltip title={voicemailMessages.length >= 20 ? 'You have reached the maximum 10 number of voicemail messages.' : ''}>
              <AddButtonWrapper>
                <RcButton
                  fullWidth
                    onClick={() => {
                      setSelectedMessage({
                        id: null,
                        name: '',
                        file: null,
                        fileName: '',
                      });
                  }}
                  variant="outlined"
                  disabled={voicemailMessages.length >= 20}
                >
                  Add a pre-recorded message
                </RcButton>
              </AddButtonWrapper>
            </RcTooltip>
          )
        }
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            onDelete(deleteMessage);
            setDeleteDialogOpen(false);
            setDeleteMessage(null);
          }}
          title="Are you sure you want to delete this message?"
          confirmText="Delete"
          confirmButtonColor="danger.b04"
        />
      </Container>
    </BackHeaderView>
  );
};

