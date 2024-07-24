import React, { useState, useEffect } from 'react';
import {
  RcTypography,
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcIconButton,
  styled,
  palette2,
  RcLoading,
} from '@ringcentral/juno';

import {
  Previous,
  NewAction,
} from '@ringcentral/juno-icon';

import { TemplateList } from './TemplateList';
import { EditDialog } from './EditDialog';
import { ConfirmDialog } from '../ConfirmDialog';

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
  showTemplateManagement,
  loadTemplates,
  deleteTemplate,
  createOrUpdateTemplate,
  sortTemplates,
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({
    displayName: '',
    body: {
      text: '',
    },
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTemplates ? loadTemplates() : null;
    }
  }, [open]);

  const personalTemplates = templates.filter((template) => template.scope === 'Personal');

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
      {
        showTemplateManagement && personalTemplates.length < 25 && (
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
        )
      }
      <StyledDialogContent>
        <RcLoading loading={loading}>
          <TemplateList
            templates={templates}
            onApply={onApply}
            showTemplateManagement={showTemplateManagement}
            onEditItem={(template) => {
              setEditingTemplate(template);
              setEditDialogOpen(true);
            }}
            onDeleteItem={(template) => {
              setDeletingTemplate(template);
              setDeleteDialogOpen(true);
            }}
            sortTemplates={sortTemplates}
          />
        </RcLoading>
      </StyledDialogContent>
      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={async () => {
          setEditDialogOpen(false);
          setLoading(true);
          await createOrUpdateTemplate(editingTemplate);
          setLoading(false);
        }}
        editingTemplate={editingTemplate}
        onChange={setEditingTemplate}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          setDeleteDialogOpen(false);
          setLoading(true);
          await deleteTemplate(deletingTemplate.id);
          setDeletingTemplate(null);
          setLoading(false);
        }}
        title="Are you sure you want to delete this template?"
        confirmButtonColor="danger.b04"
        confirmText='Delete'
      />
    </RcDialog>
  );
}
