import React from 'react';

import {
  RcButton,
  RcTypography,
  RcDialog,
  RcDialogContent,
  RcDialogActions,
} from '@ringcentral/juno';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  keepMounted,
}) {
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      keepMounted={keepMounted}
    >
      <RcDialogContent>
        <RcTypography>{title}</RcTypography>
      </RcDialogContent>
      <RcDialogActions>
        <RcButton variant="outlined" onClick={onClose}>
          Cancel
        </RcButton>
        <RcButton onClick={onConfirm}>Confirm</RcButton>
      </RcDialogActions>
    </RcDialog>
  );
}
