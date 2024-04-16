import React, { useState, useEffect } from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { RcButton } from '@ringcentral/juno';

import { BackHeaderView } from '../BackHeaderView';
import { CustomizedForm } from './CustomizedForm';

const Panel = styled.div`
  width: 100%;
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SaveButton = styled(RcButton)`
  position: absolute;
  right: 15px;
  top: 8px;
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
        <CustomizedForm
          schema={schema}
          onFormDataChange={(newFormData) => {
            const changedKeys = Object.keys(newFormData).filter(
              (key) => newFormData[key] !== formDataState[key],
            );
            setFormDataState(newFormData);
            onFormDataChange(pageId, newFormData, changedKeys);
          }}
          formData={formDataState}
          uiSchema={uiSchema}
          onButtonClick={onButtonClick}
          hiddenSubmitButton={type === 'page' || !showSaveButton}
          onSubmit={() => onSave(pageId, formDataState)}
        />
      </FieldsArea>
    </Panel>
  );
  if (type === 'tab') {
    return panel;
  }
  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title={title}
      rightButton={
        showSaveButton ? (
          <SaveButton
            variant='plain'
            onClick={() => onSave(pageId, formDataState)}
            loading={saveButtonLoading}
            disabled={!allRequiredFieldsAreFilled(formDataState, schema)}
          >
            {saveButtonLabel }
          </SaveButton>
        ) : null
      }
    >
      {panel}
    </BackHeaderView>
  );
}
