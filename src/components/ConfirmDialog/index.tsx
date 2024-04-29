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
  confirmText = 'Confirm',
  confirmButtonColor = 'primary',
  keepMounted = false,
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
        <RcButton onClick={onConfirm} color={confirmButtonColor}>
          {confirmText}
        </RcButton>
      </RcDialogActions>
    </RcDialog>
  );
}
