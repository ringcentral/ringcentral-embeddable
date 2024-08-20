import React from 'react';

import { styled, palette2 } from '@ringcentral/juno/foundation';
import {
  RcDialog,
  RcDialogContent,
  RcDialogTitle,
  RcIconButton,
  RcTypography,
} from '@ringcentral/juno';
import { Previous } from '@ringcentral/juno-icon';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';
import { ActionMenu } from '../ActionMenu';
import { CallIcon } from './CallIcon';
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

const SectionRightArea = styled.div`
  display: flex;
  flex-direction: row;
`;

const SectionTitle = styled(RcTypography)`
  margin-bottom: 5px;
`;

const StyledActionButtons = styled(ActionMenu)`
  justify-content: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const StyledAudioPlayer = styled(AudioPlayer)`
  flex: 1;
`;

export function RecordingDialog({
  open,
  onClose,
  contactDisplay,
  missed,
  type,
  currentLocale,
  direction,
  to,
  from,
  countryCode,
  areaCode,
  maxExtensionLength,
  actions,
  disableLinks,
  time,
  recording,
}) {
  if (!open) {
    return null;
  }
  const self = direction === callDirections.inbound ? to : from;
  const mainActions = actions.filter((action) => action.id !== 'download');
  const downloadAction = actions.find((action) => action.id === 'download');
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
        <CallIcon
          direction={direction}
          missed={missed}
          currentLocale={currentLocale}
          type={type}
        />
        <br />
        {contactDisplay}
        <StyledActionButtons
          actions={mainActions}
          maxActions={4}
        />
        <StyleSection>
          <SectionTitle
            variant="caption2"
            color="neutral.f06"
          >
            {time}
          </SectionTitle>
          <SectionRightArea>
            <StyledAudioPlayer
              uri={recording.contentUri}
              disabled={disableLinks}
              currentLocale={currentLocale}
            />
            {
              downloadAction ? (
                <RcIconButton
                  symbol={downloadAction.icon}
                  title={downloadAction.title}
                  onClick={downloadAction.onClick}
                  disabled={downloadAction.disabled}
                />
              ) : null
            }
          </SectionRightArea>
        </StyleSection>
        {
          self ? (
            <StyleSection>
              <SectionTitle
                variant="caption2"
                color="neutral.f06"
              >
                {direction === callDirections.inbound ? 'To' : 'From'}
              </SectionTitle>
              <RcTypography variant="body1">
                {self.phoneNumber ? formatNumber({
                    phoneNumber: self.phoneNumber,
                    countryCode,
                    areaCode,
                    maxExtensionLength,
                }) : self.extension}
              </RcTypography>
            </StyleSection>
          ) : null
        }
      </StyledDialogContent>
    </RcDialog>
  );
}
