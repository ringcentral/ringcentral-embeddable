import React from 'react';

import {
  RcButton,
  RcDialog,
  RcDialogContent,
  RcDialogActions,
  RcDialogTitle,
  RcTextarea,
  styled,
  palette2,
} from '@ringcentral/juno';

import { handleCopy } from '@ringcentral-integration/widgets/lib/handleCopy';
import copyI18n from '@ringcentral-integration/widgets/components/CopyToClipboard/i18n';
import i18n from './i18n';

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paper {
    width: calc(100% - 32px);
    margin: 16px;
  }
`;

const ReadonlyTextArea = styled(RcTextarea)`
  .RcTextareaInput-inputMultiline {
    background: ${palette2('neutral', 'b01')};
    color: ${palette2('neutral', 'f06')};
    font-size: 0.875rem;
    line-height: 20px;
    -webkit-text-fill-color: ${palette2('neutral', 'f06')};
  }
`;

export default function MeetingInviteDialog({
  show,
  meetingString = '',
  currentLocale,
  onClose,
}) {
  if (!show) {
    return null;
  }
  return (
    <StyledDialog
      open={show}
      onClose={onClose}
    >
      <RcDialogTitle>
        {i18n.getString('meetingAdded', currentLocale)}
      </RcDialogTitle>
      <RcDialogContent>
        <ReadonlyTextArea
          fullWidth
          value={meetingString}
          disabled
          multiline
          minRows={8}
        />
      </RcDialogContent>
      <RcDialogActions direction="vertical">
        <RcButton variant="outlined" onClick={onClose} fullWidth>
          {i18n.getString('cancel', currentLocale)}
        </RcButton>
        <RcButton
          onClick={async () => {
            try {
              await handleCopy(meetingString);
            } catch (e) {
              console.error(e);
            }
          }}
          color="primary"
          fullWidth
        >
          {copyI18n.getString('copyToClipboard', currentLocale)}
        </RcButton>
      </RcDialogActions>
    </StyledDialog>
  );
}
