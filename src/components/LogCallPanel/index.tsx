import React, { useState, useEffect, useRef } from 'react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { styled } from '@ringcentral/juno/foundation';
import { RcButton } from '@ringcentral/juno';

import { Field } from './Field';
import { CallInfo } from './CallInfo';
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

export default function LogCallPanel({
  currentLocale,
  currentCall = null,
  onSaveCallLog,
  onLoadData,
  formatPhone,
  dateTimeFormatter,
  customizedPageData,
  onCustomizedFieldChange,
  onBackButtonClick,
}) {
  const currentCallRef = useRef(null);
  const [defaultFieldValues, setDefaultFieldValues] = useState({
    note: '',
    contactId: '',
  });
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
      currentCallRef.current = currentCall;
      onLoadData(currentCall);
      const matchedActivity =
        currentCall.activityMatches &&
        currentCall.activityMatches[0];
      if (matchedActivity) {
        setDefaultFieldValues({
          note: matchedActivity.note || '',
          contactId: matchedActivity && (
            matchedActivity.contact && (
              matchedActivity.contact.id || matchedActivity.contact
            )) || '',
        });
      } else {
        const matchContacts = currentCall.direction === callDirections.inbound
          ? currentCall.fromMatches : currentCall.toMatches;
        setDefaultFieldValues({
          note: '',
          contactId: matchContacts && matchContacts[0] && matchContacts[0].id || '',
        });
      }
      return;
    }
    const currentMatch = currentCall.activityMatches && currentCall.activityMatches[0];
    const previousMatch = currentCallRef.current && currentCallRef.current.activityMatches && currentCallRef.current.activityMatches[0];
    if (currentMatch && previousMatch && currentMatch !== previousMatch) {
      setDefaultFieldValues({
        note: currentMatch.note || '',
        contactId: currentMatch && currentMatch.contact && currentMatch.contact.id || '',
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
    <BackHeaderView
      onBack={onBackButtonClick}
      title={
        customizedPageData && customizedPageData.pageTitle ?
            customizedPageData.pageTitle :
            (isLogged ? 'Edit log' : 'Log call')
      }
      rightButton={
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
      }
    >
      <Panel>
        <CallInfo
          call={currentCall}
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          dateTimeFormatter={dateTimeFormatter}
        />
        <FieldsArea>
          {
            fields.map((field) => {
              let value = isCustomizedFields ? customizedFieldValues[field.id] : defaultFieldValues[field.id];
              if (typeof value === 'undefined') {
                value = field.value;
              }
              return (
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
                    setDefaultFieldValues({
                      ...defaultFieldValues,
                      [field.id]: value,
                    });
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
