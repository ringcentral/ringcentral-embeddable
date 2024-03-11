import React, { useState, useEffect, useRef } from 'react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { styled } from '@ringcentral/juno/foundation';
import {
  RcButton,
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcIconButton,
} from '@ringcentral/juno';

import { Previous } from '@ringcentral/juno-icon';
import { Field } from './Field';
import { CallInfo } from './CallInfo';

const StyledDialogTitle = styled(RcDialogTitle)`
  padding: 5px 50px;
  position: relative;
  text-align: center;

  .MuiTypography-root {
    font-size: 0.9375rem;
  }
`;

const StyledDialogContent = styled(RcDialogContent)`
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const BackButton = styled(RcIconButton)`
  position: absolute;
  left: 10px;
  top: 0;
`;

const SaveButton = styled(RcButton)`
  position: absolute;
  right: 15px;
  top: 7px;
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

function getDefaultFields(call) {
  const fields: any[] = [];
  const matchContacts = call.direction === callDirections.inbound
      ? call.fromMatches : call.toMatches;
  if (matchContacts && matchContacts.length > 0) {
    fields.push({
      id: 'contactId',
      label: 'Contact',
      type: 'input.choice',
      options: matchContacts.map((entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.description,
      })),
    });
  }
  fields.push({
    id: 'note',
    type: 'input.text',
    label: 'Note',
    placeholder: "Add call log note",
  });
  return fields;
}

export default function LogCallModal({
  open,
  onClose,
  currentLocale,
  currentCall = null,
  currentLogCall = {},
  onSaveCallLog,
  onLoadData,
  formatPhone,
  dateTimeFormatter,
  customizedPageData,
  onCustomizedFieldChange,
}) {
  const currentCallRef = useRef(currentCall);
  const [defaultFieldValues, setDefaultFiledValues] = useState({});
  const [customizedFieldValues, setCustomizedFieldValues] = useState({});
  useEffect(() => {
    if (!currentCall) {
      currentCallRef.current = null;
      return;
    }
    if (
      !currentCallRef.current || (
        currentCall.id !== currentCallRef.current.id
      )
    ) {
      onLoadData(currentCall);
      const matchedActivity =
        currentCall.activityMatches &&
        currentCall.activityMatches[0];
      if (matchedActivity) {
        setDefaultFiledValues({
          note: matchedActivity.note || '',
          contactId: matchedActivity && (
            matchedActivity.contact && (
              matchedActivity.contact.id || matchedActivity.contact
            ))
        });
      } else {
        const matchContacts = currentCall.direction === callDirections.inbound
          ? currentCall.fromMatches : currentCall.toMatches;
        setDefaultFiledValues({
          note: '',
          contactId: matchContacts && matchContacts[0] && matchContacts[0].id
        });
      }
      currentCallRef.current = currentCall;
      return;
    }
    const currentMatch = currentCall.activityMatches && currentCall.activityMatches[0];
    const previousMatch = currentCallRef.current && currentCallRef.current.activityMatches && currentCallRef.current.activityMatches[0];
    if (currentMatch && previousMatch && currentMatch !== previousMatch) {
      setDefaultFiledValues({
        note: currentMatch.note || '',
        contactId: currentMatch && currentMatch.contact && currentMatch.contact.id
      });
    }
    currentCallRef.current = currentCall;
  }, [currentCall]);

  useEffect(() => {
    if (!customizedPageData) {
      setCustomizedFieldValues({});
      return;
    }
    const newValues = {};
    customizedPageData.fields.forEach((field) => {
      newValues[field.id] = field.value;
    });
    setCustomizedFieldValues(newValues);
  }, [customizedPageData])

  if (!currentCall) {
    return null;
  }
  const isLogged = currentCall.activityMatches && currentCall.activityMatches.length > 0;
  const isCustomizedFields = customizedPageData && customizedPageData.fields && customizedPageData.fields.length > 0;
  const fields = isCustomizedFields ? customizedPageData.fields : getDefaultFields(currentCall);
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <StyledDialogTitle>
        <BackButton
          symbol={Previous}
          onClick={onClose}
          data-sign="backButton"
        />
        {
          customizedPageData && customizedPageData.pageTitle ?
            customizedPageData.pageTitle :
            (isLogged ? 'Edit log' : 'Log call')
        }
        <SaveButton
          variant='plain'
          onClick={() => {
            onSaveCallLog({
              call: currentCall,
              input: isCustomizedFields ? customizedFieldValues : defaultFieldValues,
              note: isCustomizedFields ? undefined : defaultFieldValues.note, // for backward support
            });
          }}
        >
          {
            customizedPageData && customizedPageData.saveButtonLabel ? customizedPageData.saveButtonLabel : 'Save'
          }
        </SaveButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <CallInfo
          call={currentCall}
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          dateTimeFormatter={dateTimeFormatter}
        />
        <FieldsArea>
          {
            fields.map((field) => (
              <StyledField
                key={field.id}
                field={field}
                onChange={(value) => {
                  if (isCustomizedFields) {
                    const newValues = {
                      ...customizedFieldValues,
                      [field.id]: value,
                    };
                    setCustomizedFieldValues(newValues);
                    onCustomizedFieldChange(currentCall, newValues, field.id);
                    return;
                  }
                  setDefaultFiledValues({
                    ...defaultFieldValues,
                    [field.id]: value,
                  });
                }}
                value={isCustomizedFields ? customizedFieldValues[field.id] : defaultFieldValues[field.id]}
              />
            ))
          }
        </FieldsArea>
      </StyledDialogContent>
    </RcDialog>
  );
}
