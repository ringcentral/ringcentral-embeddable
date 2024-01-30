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
  onClick = undefined,
}) {
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      keepMounted={keepMounted}
      onClick={onClick}
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
