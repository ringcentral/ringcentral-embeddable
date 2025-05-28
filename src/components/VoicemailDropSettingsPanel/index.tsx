import React, { useState } from 'react';
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
} from '@ringcentral/juno';
import { BackHeaderView } from '../BackHeaderView';
import { Edit, PlayCircle, Delete } from '@ringcentral/juno-icon';
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

export const VoicemailDropSettingsPanel = ({
  onBackButtonClick,
  voicemailMessages,
  onSave,
  onDelete,
}) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);

  const content = selectedMessage ? (
    <VoicemailDropMessage
      message={selectedMessage}
      onSave={(newMessage) => {
        onSave(newMessage);
        setSelectedMessage(null);
      }}
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
              <RcListItemText primary={message.label} />
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
              When you found the outbound call is redirected to voicemail, you can drop a pre-recorded message to the voicemail.
            </StyledAlert>
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

