import React from 'react';

import { styled, palette2, ellipsis } from '@ringcentral/juno/foundation';
import {
  RcDialog,
  RcDialogContent,
  RcDialogTitle,
  RcIconButton,
  RcTypography,
  RcButton,
} from '@ringcentral/juno';
import { Previous } from '@ringcentral/juno-icon';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';

import { ActionMenu } from '../ActionMenu';
import { ConversationIcon } from './ConversationIcon';
import { AudioPlayer } from '../AudioPlayer';

const StyledDialogTitle = styled(RcDialogTitle)`
  padding: 5px 6px;
`;

const StyledDialogContent = styled(RcDialogContent)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 16px;
  padding-right: 16px;
`;

const StyleSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${palette2('neutral', 'l03')};
  width: 100%;
  margin-bottom: 8px;
`;

const DetailSection = styled(StyleSection)`
  flex-direction: row;
`;

const SectionLeftArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  ${ellipsis()}
`;

const SectionRightArea = styled.div`
  display: flex;
  flex-direction: row;
`;

const SectionTitle = styled(RcTypography)`
  margin-bottom: 5px;
`;

const StyledAudioPlayer = styled(AudioPlayer)`
  flex: 1;
`;

const StyledActionButtons = styled(ActionMenu)`
  justify-content: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
`;

export function DetailDialog({
  open,
  onClose,
  contactDisplay,
  correspondents,
  type,
  currentLocale,
  direction,
  voicemailAttachment,
  self,
  detail,
  time,
  disableLinks,
  onPlayVoicemail,
  actions,
}) {
  if (!open) {
    return null;
  }
  const mainActions = actions.filter((action) => action.id !== 'delete' && !action.sub);
  const subActions = actions.filter((action) => action.sub);
  const deleteAction = actions.find((action) => action.id === 'delete');
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      fullScreen
      keepMounted={false}
    >
      <StyledDialogTitle>
        <RcIconButton
          symbol={Previous}
          onClick={onClose}
          title="Back"
        />
      </StyledDialogTitle>
      <StyledDialogContent>
        <ConversationIcon
          group={correspondents && correspondents.length > 1}
          type={type}
          currentLocale={currentLocale}
          direction={direction}
          color="neutral.f06"
        />
        <br />
        {contactDisplay}
        <StyledActionButtons
          actions={mainActions}
          maxActions={4}
        />
        {
          type === messageTypes.fax ? (
            <DetailSection>
              <SectionLeftArea>
                <SectionTitle
                  variant="caption2"
                  color="neutral.f06"
                >
                  {time}
                </SectionTitle>
                <RcTypography variant="body1">
                  {detail}
                </RcTypography>
              </SectionLeftArea>
              <SectionRightArea>
                <ActionMenu
                  actions={subActions}
                  maxActions={2}
                  size={undefined}
                />
              </SectionRightArea>
            </DetailSection>
          ) : null
        }
        {
          type === messageTypes.voiceMail && voicemailAttachment ? (
            <StyleSection>
              <SectionTitle
                variant="caption2"
                color="neutral.f06"
              >
                {time}
              </SectionTitle>
              <SectionRightArea>
                <StyledAudioPlayer
                  uri={voicemailAttachment.uri}
                  duration={voicemailAttachment.duration}
                  disabled={disableLinks}
                  currentLocale={currentLocale}
                  onPlay={onPlayVoicemail}
                />
                <ActionMenu
                  actions={subActions}
                  maxActions={1}
                />
              </SectionRightArea>
            </StyleSection>
          ) : null
        }
        {
          self ? (
            <StyleSection>
              <SectionTitle
                variant="caption2"
                color="neutral.f06"
              >
                {direction === messageDirection.inbound ? 'To' : 'From'}
              </SectionTitle>
              <RcTypography variant="body1">
                {self.phoneNumber || self.extension}
              </RcTypography>
            </StyleSection>
          ) : null
        }
        <br />
        <br />
        {
          deleteAction ? (
            <RcButton
              variant='outlined'
              color="danger.f02"
              fullWidth
              onClick={deleteAction.onClick}
              disabled={deleteAction.disabled}
            >
              {deleteAction.title}
            </RcButton>
          ) : null
        }
        
      </StyledDialogContent>
    </RcDialog>
  )
}
