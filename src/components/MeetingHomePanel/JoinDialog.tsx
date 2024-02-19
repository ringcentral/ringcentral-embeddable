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
          placeholder="Enter meeting ID or link"
          value={meetingId}
          onChange={onMeetingIdChange}
        />
      </RcDialogContent>
      <RcDialogActions>
        <RcButton variant="text" onClick={onClose}>
          Cancel
        </RcButton>
        <RcButton
          onClick={onJoin}
          disabled={!meetingId}
        >
          Join
        </RcButton>
      </RcDialogActions>
    </StyledDialog>
  );
}
