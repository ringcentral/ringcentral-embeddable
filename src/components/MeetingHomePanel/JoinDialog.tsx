import React from 'react';

import {
  RcButton,
  RcDialog,
  RcDialogContent,
  RcDialogActions,
  RcDialogTitle,
  RcTextField,
  styled,
} from '@ringcentral/juno';
import i18n from './i18n';

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paper {
    width: calc(100% - 32px);
    margin: 16px;
  }
`;

export function JoinDialog({
  open,
  onClose,
  onJoin,
  meetingId,
  onMeetingIdChange,
  currentLocale,
}) {
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
    >
      <RcDialogTitle>Join a meeting</RcDialogTitle>
      <RcDialogContent>
        <RcTextField
          label="Meeting info"
          fullWidth
          placeholder={i18n.getString('enterMeetingId', currentLocale)}
          value={meetingId}
          onChange={onMeetingIdChange}
        />
      </RcDialogContent>
      <RcDialogActions>
        <RcButton variant="text" onClick={onClose}>
          {i18n.getString('cancel', currentLocale)}
        </RcButton>
        <RcButton
          onClick={onJoin}
          disabled={!meetingId}
        >
          {i18n.getString('join', currentLocale)}
        </RcButton>
      </RcDialogActions>
    </StyledDialog>
  );
}
