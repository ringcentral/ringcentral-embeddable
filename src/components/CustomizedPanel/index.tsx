import React, { useState, useEffect } from 'react';
import { styled } from '@ringcentral/juno/foundation';
import { RcButton } from '@ringcentral/juno';

import { Field } from './Field';
import { BackHeaderView } from '../BackHeaderView';

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
`;

const StyledField = styled(Field)`
  margin-bottom: 15px;
`;

export function CustomizedPanel({
  onSave,
  fields,
  onFieldInputChange,
  onBackButtonClick,
  infoNode,
  pageTitle,
  saveButtonLabel,
  saveButtonLoading,
}) {
  const [fieldValues, setFieldValues] = useState({});

  useEffect(() => {
    if (!fields) {
      setFieldValues({});
      return;
    }
    const newValues = {};
    fields.forEach((field) => {
      if (field.type && field.type.indexOf('input.') === 0) {
        newValues[field.id] = field.value;
      }
    });
    setFieldValues(newValues);
  }, [fields]);

  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title={pageTitle}
      rightButton={
        saveButtonLabel ? (
          <SaveButton
            variant='plain'
            onClick={() => onSave(fieldValues)}
            loading={saveButtonLoading}
          >
            {saveButtonLabel }
          </SaveButton>
        ) : null
      }
    >
      <Panel>
        {infoNode}
        <FieldsArea>
          {
            fields.map((field) => {
              let value = fieldValues[field.id];
              if (typeof value === 'undefined') {
                value = field.value;
              }
              return (
                <StyledField
                  key={field.id}
                  field={field}
                  onChange={(value) => {
                    const newValues = {
                      ...fieldValues,
                      [field.id]: value,
                    };
                    setFieldValues(newValues);
                    onFieldInputChange(newValues, field.id);
                  }}
                  value={value}
                />
              );
            })
          }
        </FieldsArea>
      </Panel>
    </BackHeaderView>
  );
}
