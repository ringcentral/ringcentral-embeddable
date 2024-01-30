import React, { useState, useRef } from 'react';

import { styled, palette2, ellipsis } from '@ringcentral/juno/foundation';
import {
  RcDialog,
  RcDialogContent,
  RcDialogTitle,
  RcIconButton,
  RcTypography,
  RcButton,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcListItemIcon,
  RcIcon,
} from '@ringcentral/juno';
import {
  Previous,
  ViewBorder,
  MoreVert,
  Download,
  Read,
  Unread,
  PhoneBorder,
  SmsBorder,
  People,
  AddMemberBorder,
  NewAction,
  ViewLogBorder,
} from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';

import { ActionMenu } from '../ActionMenu';
import { ConversationIcon } from './ConversationIcon';
import { AudioPlayer } from './AudioPlayer';

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

const DownloadLink = styled.a`
  display: none;
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
  faxAttachment,
  onDelete,
  self,
  detail,
  time,
  onPreviewFax,
  disableLinks,
  unread,
  onMarkMessage,
  onUnmarkMessage,
  onPlayVoicemail,
  shouldHideEntityButton,
  onLog,
  onViewEntity,
  onCreateEntity,
  hasEntity,
  onClickToDial,
  onClickToSms,
  disableClickToSms,
  phoneNumber,
  disableCallButton,
  disableClickToDial,
  isLogging,
  isLogged,
  isCreating
}) {
  const [moreMoreOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef(null);
  const downloadRef = useRef(null);
  let downloadUri = null;
  if (faxAttachment) {
    downloadUri = faxAttachment.uri;
  } else if (voicemailAttachment) {
    downloadUri = voicemailAttachment.uri;
  }
  const actions = [];
  if (onClickToDial) {
    actions.push({
      icon: PhoneBorder,
      title: i18n.getString('call', currentLocale),
      onClick: onClickToDial,
      disabled: disableLinks || disableCallButton || disableClickToDial || !phoneNumber,
    });
  }
  if (onClickToSms) {
    actions.push({
      icon: SmsBorder,
      title: i18n.getString('text', currentLocale),
      onClick: onClickToSms,
      disabled: disableLinks || disableClickToSms || !phoneNumber,
    });
  }
  if (!shouldHideEntityButton && hasEntity) {
    actions.push({
      icon: People,
      title: i18n.getString('viewDetails', currentLocale),
      onClick: onViewEntity,
      disabled: disableLinks,
    });
  }
  if (!hasEntity && onCreateEntity) {
    actions.push({
      icon: AddMemberBorder,
      title: i18n.getString('addEntity', currentLocale),
      onClick: onCreateEntity,
      disabled: disableLinks,
    });
  }
  if (onLog) {
    actions.push({
      icon: isLogged ? ViewLogBorder : NewAction,
      title: i18n.getString(isLogged ? 'editLog' : 'addLog', currentLocale),
      onClick: onLog,
      disabled: disableLinks || isLogging || isCreating,
    });
  }
  const subActions = [];
  if (type === messageTypes.fax) {
    subActions.push({
      icon: ViewBorder,
      title: i18n.getString('view', currentLocale),
      onClick: () => {
        onPreviewFax(faxAttachment.uri);
      },
      disabled: disableLinks || !faxAttachment || !faxAttachment.uri,
    });
    if (direction === messageDirection.inbound) {
      subActions.push({
        icon: unread ? Unread : Read,
        title: i18n.getString(unread ? 'unmark' : 'mark', currentLocale),
        onClick: () => {
          if (unread) {
            onUnmarkMessage();
          } else {
            onMarkMessage();
          }
          setMoreMenuOpen(false);
        },
        disabled: disableLinks,
      });
    }
    subActions.push({
      icon: Download,
      title: i18n.getString('download', currentLocale),
      onClick: () => {
        downloadRef.current.click();
        setMoreMenuOpen(false);
      },
      disabled: disableLinks || !faxAttachment || !faxAttachment.uri,
    });
  }
  if (type === messageTypes.voiceMail) {
    subActions.push({
      icon: Download,
      title: i18n.getString('download', currentLocale),
      onClick: () => {
        downloadRef.current.click();
        setMoreMenuOpen(false);
      },
      disabled: disableLinks || !voicemailAttachment || !voicemailAttachment.uri,
    });
    subActions.push({
      icon: unread ? Unread : Read,
      title: i18n.getString(unread ? 'unmark' : 'mark', currentLocale),
      onClick: () => {
        if (unread) {
          onUnmarkMessage();
        } else {
          onMarkMessage();
        }
        setMoreMenuOpen(false);
      },
      disabled: disableLinks,
    });
  }
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
          actions={actions}
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
                {direction === direction.inbound ? 'To' : 'From'}
              </SectionTitle>
              <RcTypography variant="body1">
                {self.phoneNumber || self.extension}
              </RcTypography>
            </StyleSection>
          ) : null
        }
        <br />
        <br />
        <RcButton
          variant='outlined'
          color="danger.f02"
          fullWidth
          onClick={onDelete}
        >
          {i18n.getString('delete', currentLocale)}
        </RcButton>
        <DownloadLink
          target="_blank"
          download
          title={i18n.getString('download', currentLocale)}
          ref={downloadRef}
          href={`${downloadUri}&contentDisposition=Attachment`}
        ></DownloadLink>
      </StyledDialogContent>
    </RcDialog>
  )
}