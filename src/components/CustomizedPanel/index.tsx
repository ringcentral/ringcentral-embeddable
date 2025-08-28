import React, { useState, useEffect } from 'react';
import { styled, css } from '@ringcentral/juno/foundation';
import { RcButton, RcIconButton } from '@ringcentral/juno';
import { SaveDraft, Close } from '@ringcentral/juno-icon';
import { BackHeaderView } from '../BackHeaderView';
import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-page';

const Panel = styled.div`
  width: 100%;
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const StyledBackHeaderView = styled(BackHeaderView)<{ $twoRightButtons?: boolean }>`
  ${({ $twoRightButtons }) => $twoRightButtons && css`
    .BackHeader-root {
      padding-right: 70px;
    }
  `}
`;

const SaveButton = styled(RcButton)`
  position: absolute;
  right: 15px;
  top: 8px;
`;

const HeaderButtons = styled.div`
  position: absolute;
  right: 2px;
  top: 0;
`;

const FieldsArea = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding-top: 0;
`;

function allRequiredFieldsAreFilled(formData = {}, schema) {
  const requiredFields = schema.required || [];
  for (const key of requiredFields) {
    if (typeof formData[key] === 'undefined' || formData[key] === null || formData[key] === '') {
      return false;
    }
  }
  return true;
}

export function CustomizedPanel({
  onSave,
  formData,
  schema,
  uiSchema,
  onFormDataChange,
  onBackButtonClick,
  infoNode,
  title,
  saveButtonLoading,
  onButtonClick,
  pageId,
  type = 'page',
  hideBackButton = false,
  onClose = () => {},
  showCloseButton = false,
}) {
  const [formDataState, setFormDataState] = useState({});
  const showSaveButton = !!uiSchema.submitButtonOptions;
  const saveButtonLabel = uiSchema.submitButtonOptions?.submitText || 'Save';
  useEffect(() => {
    setFormDataState(formData);
  }, [formData]);

  const panel = (
    <Panel>
      {infoNode}
      <FieldsArea>
        <JSONSchemaPage
          schema={schema}
          onFormDataChange={(newFormData) => {
            const changedKeys = Object.keys(newFormData).filter(
              (key) => {
                const newVal = newFormData[key];
                const oldVal = formDataState[key];
                if (typeof newVal === 'object' && typeof oldVal === 'object') {
                  return JSON.stringify(newVal) !== JSON.stringify(oldVal);
                }
                return newVal !== oldVal;
              },
            );
            setFormDataState(newFormData);
            onFormDataChange(pageId, newFormData, changedKeys);
          }}
          formData={formDataState}
          uiSchema={uiSchema}
          onButtonClick={(id) => onButtonClick(id, formDataState)}
          hiddenSubmitButton={type === 'page' || !showSaveButton}
          onSubmit={() => onSave(pageId, formDataState)}
        />
      </FieldsArea>
    </Panel>
  );
  if (type === 'tab') {
    return panel;
  }
  let rightButtons;
  let saveButton;
  let closeButton = showCloseButton ? (
    <RcIconButton
      symbol={Close}
      onClick={onClose}
      title='Close'
    />
  ) : null;
  if (showSaveButton) {
    if (closeButton) {
      saveButton = (
        <RcIconButton
          symbol={SaveDraft}
          onClick={() => onSave(pageId, formDataState)}
          loading={saveButtonLoading}
          disabled={!allRequiredFieldsAreFilled(formDataState, schema)}
          title={saveButtonLabel}
          color="action.primary"
        />
      );
      rightButtons = (
        <HeaderButtons>
          {saveButton}
          {closeButton}
        </HeaderButtons>
      );
    } else {
      saveButton = (
        <SaveButton
          variant='plain'
          onClick={() => onSave(pageId, formDataState)}
          loading={saveButtonLoading}
          disabled={!allRequiredFieldsAreFilled(formDataState, schema)}
        >
          {saveButtonLabel }
        </SaveButton>
      );
      rightButtons = saveButton;
    }
  } else if (closeButton) {
    rightButtons = (
      <HeaderButtons>
        {closeButton}
      </HeaderButtons>
    );
  }
  return (
    <StyledBackHeaderView
      onBack={onBackButtonClick}
      title={title}
      hideBackButton={hideBackButton}
      rightButton={rightButtons}
      $twoRightButtons={!!(showSaveButton && showCloseButton)}
    >
      {panel}
    </StyledBackHeaderView>
  );
}
