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

const StyledActionArea = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
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

const StyledMoreMenu = styled(RcMenu)`
  .RcListItemText-primary {
    font-size: 0.875rem;
  }
`;

const StyledAudioPlayer = styled(AudioPlayer)`
  flex: 1;
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
        <br />
        <StyledActionArea>
          {
            onClickToDial ? (
              <RcIconButton
                symbol={PhoneBorder}
                disabled={
                  disableLinks ||
                  disableCallButton ||
                  disableClickToDial ||
                  !phoneNumber
                }
                title={i18n.getString('call', currentLocale)}
                onClick={onClickToDial}
              />
            ) : null
          }
          {
            onClickToSms ? (
              <RcIconButton
                symbol={SmsBorder}
                disabled={
                  disableLinks ||
                  disableClickToSms ||
                  !phoneNumber
                }
                title={i18n.getString('text', currentLocale)}
                onClick={onClickToSms}
              />
            ) : null
          }
          {
            (
              !shouldHideEntityButton &&
              hasEntity
            ) ? (
              <RcIconButton
                symbol={People}
                disabled={disableLinks}
                onClick={onViewEntity}
                title={i18n.getString('viewDetails', currentLocale)}
              />
            ) : null
          }
          {
            !hasEntity && onCreateEntity ? (
              <RcIconButton
                symbol={AddMemberBorder}
                disabled={disableLinks}
                onClick={onCreateEntity}
                title={i18n.getString('addEntity', currentLocale)}
              />
            ) : null
          }
          {
            onLog ? (
              <RcIconButton
                symbol={isLogged ? ViewLogBorder : NewAction}
                disabled={disableLinks || isLogging || isCreating}
                onClick={onLog}
                title={i18n.getString(isLogged ? 'editLog' : 'addLog', currentLocale)}
              />
            ) : null
          }
        </StyledActionArea>
        <br />
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
                <RcIconButton
                  symbol={ViewBorder}
                  disabled={!faxAttachment || !faxAttachment.uri || disableLinks}
                  onClick={() => {
                    onPreviewFax(faxAttachment.uri);
                  }}
                  title={i18n.getString('view', currentLocale)}
                />
                <RcIconButton
                  symbol={MoreVert}
                  onClick={() => {
                    setMoreMenuOpen(true);
                  }}
                  innerRef={moreButtonRef}
                />
                <StyledMoreMenu
                  open={moreMoreOpen}
                  anchorEl={moreButtonRef.current}
                  onClose={() => {
                    setMoreMenuOpen(false);
                  }}
                >
                  {
                    direction === messageDirection.inbound ? (
                      <RcMenuItem disabled={disableLinks}>
                        <RcListItemIcon>
                          <RcIcon
                            symbol={unread ? Unread : Read }
                            size="small"
                          />
                        </RcListItemIcon>
                        <RcListItemText
                          primary={i18n.getString(unread ? 'unmark' : 'mark', currentLocale)}
                          onClick={() => {
                            if (unread) {
                              onUnmarkMessage();
                            } else {
                              onMarkMessage();
                            }
                            setMoreMenuOpen(false);
                          }}
                        />
                      </RcMenuItem>
                    ) : null
                  }
                  <RcMenuItem disabled={disableLinks}>
                    <RcListItemIcon>
                      <RcIcon
                        symbol={Download}
                        size="small"
                      />
                    </RcListItemIcon>
                    <RcListItemText
                      primary={i18n.getString('download', currentLocale)}
                      onClick={() => {
                        downloadRef.current.click();
                        setMoreMenuOpen(false);
                      }}
                    />
                  </RcMenuItem>
                </StyledMoreMenu>
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
                <RcIconButton
                  symbol={MoreVert}
                  onClick={() => {
                    setMoreMenuOpen(true);
                  }}
                  innerRef={moreButtonRef}
                />
                <StyledMoreMenu
                  open={moreMoreOpen}
                  anchorEl={moreButtonRef.current}
                  onClose={() => {
                    setMoreMenuOpen(false);
                  }}
                >
                  <RcMenuItem disabled={disableLinks}>
                    <RcListItemIcon>
                      <RcIcon
                        symbol={Download}
                        size="small"
                      />
                    </RcListItemIcon>
                    <RcListItemText
                      primary={i18n.getString('download', currentLocale)}
                      onClick={() => {
                        downloadRef.current.click();
                        setMoreMenuOpen(false);
                      }}
                    />
                  </RcMenuItem>
                  <RcMenuItem disabled={disableLinks}>
                    <RcListItemIcon>
                      <RcIcon
                        symbol={unread ? Unread : Read }
                        size="small"
                      />
                    </RcListItemIcon>
                    <RcListItemText
                      primary={i18n.getString(unread ? 'unmark' : 'mark', currentLocale)}
                      onClick={() => {
                        if (unread) {
                          onUnmarkMessage();
                        } else {
                          onMarkMessage();
                        }
                        setMoreMenuOpen(false);
                      }}
                    />
                  </RcMenuItem>
                </StyledMoreMenu>
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