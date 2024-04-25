import React, { useState } from 'react';
import {
  RcTypography,
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcIconButton,
  RcList,
  styled,
  palette2,
} from '@ringcentral/juno';

import {
  Previous,
  NewAction,
} from '@ringcentral/juno-icon';

import { TemplateItem } from './TemplateItem';
import { EditDialog } from './EditDialog';

const StyledHeader = styled(RcDialogTitle)`
  padding: 0 30px;
  height: 40px;
  align-items: center;
  display: flex;
  justify-content: center;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
`;

const PreviousButton = styled(RcIconButton)`
  position: absolute;
  left: 6px;
  top: 0;
`;

const AddButton = styled(RcIconButton)`
  position: absolute;
  right: 6px;
  top: 0;
`;

const StyledDialogContent = styled(RcDialogContent)`
  padding: 0;
`;

export function SmsTemplateDialog({
  open,
  onClose,
  templates,
  onApply,
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({
    displayName: '',
    body: {
      text: '',
    },
  });
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <StyledHeader
        disableTypography
      >
        <RcTypography variant="body1">
          Text message templates
        </RcTypography>
      </StyledHeader>
      <PreviousButton
        symbol={Previous}
        onClick={onClose}
        data-sign="backButton"
      />
      <AddButton
        symbol={NewAction}
        data-sign="addButton"
        title="New template"
        onClick={() => {
          setEditingTemplate({
            displayName: '',
            body: {
              text: '',
            },
          });
          setEditDialogOpen(true);
        }}
      />
      <StyledDialogContent>
        <RcList>
          {
            templates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                onApply={onApply}
                onEdit={() => {
                  setEditingTemplate(template);
                  setEditDialogOpen(true);
                }}
              />
            ))
          }
        </RcList>
      </StyledDialogContent>
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={() => {
          setEditDialogOpen(false);
        }}
        editingTemplate={editingTemplate}
        onChange={setEditingTemplate}
      />
    </RcDialog>
  );
}
