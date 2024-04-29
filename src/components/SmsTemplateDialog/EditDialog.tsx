import React from 'react';

import {
  RcButton,
  RcDialog,
  RcDialogContent,
  RcDialogActions,
  RcDialogTitle,
  RcTextField,
  RcTextarea,
  styled,
} from '@ringcentral/juno';

const StyledTextarea = styled(RcTextarea)`
  margin-top: 16px;
`;

export function EditDialog({
  open,
  onClose,
  onSave,
  editingTemplate,
  onChange,
}) {
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      PaperProps={{
        style: {
          margin: '16px',
          width: 'calc(100% - 32px)',
        }
      }}
    >
      <RcDialogTitle>
        {editingTemplate.id ? 'Edit' : 'New'} template
      </RcDialogTitle>
      <RcDialogContent>
        <RcTextField
          label="Template name"
          fullWidth
          value={editingTemplate.displayName}
          onChange={e => onChange({
            ...editingTemplate,
            displayName: e.target.value,
          })}
          placeholder="Enter a name"
        />
        <StyledTextarea
          label="Template content"
          fullWidth
          value={editingTemplate.body.text}
          onChange={e => onChange({
            ...editingTemplate,
            body: {
              text: e.target.value,
            },
          })}
          minRows={3}
          maxRows={10}
          placeholder="Enter template text"
          inputProps={{
            maxLength: 1000,
          }}
        />
      </RcDialogContent>
      <RcDialogActions>
        <RcButton variant="text" onClick={onClose}>
          Cancel
        </RcButton>
        <RcButton onClick={onSave}>
          Save
        </RcButton>
      </RcDialogActions>
    </RcDialog>
  );
}
