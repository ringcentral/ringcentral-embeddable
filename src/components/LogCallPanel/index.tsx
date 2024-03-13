import React, { useState, useEffect, useRef } from 'react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import { CallInfo } from './CallInfo';
import { LogPanel } from '../LogPanel';

function getDefaultFields(call, defaultContactId, defaultNote) {
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
      value: defaultContactId || matchContacts[0].id,
    });
  }
  fields.push({
    id: 'note',
    type: 'input.text',
    label: 'Note',
    placeholder: "Add call log note",
    value: defaultNote,
  });
  return fields;
}

export default function LogCallPanel({
  currentLocale,
  currentCall = null,
  onSave,
  onLoadData,
  formatPhone,
  dateTimeFormatter,
  customizedPageData,
  onCustomizedFieldChange,
  onBackButtonClick,
  isLogging,
}) {
  const currentCallRef = useRef(null);
  const [defaultFields, setDefaultFields] = useState([]);
  useEffect(() => {
    if (!currentCall) {
      currentCallRef.current = null;
      return;
    }
    let defaultNote = '';
    let defaultContactId = '';
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
        defaultNote = matchedActivity.note || '';
        defaultContactId = matchedActivity && (
          matchedActivity.contact && (
            matchedActivity.contact.id || matchedActivity.contact
          )) || '';
      }
      setDefaultFields(getDefaultFields(currentCall, defaultContactId, defaultNote));
      return;
    }
    const currentMatch = currentCall.activityMatches && currentCall.activityMatches[0];
    const previousMatch = currentCallRef.current && currentCallRef.current.activityMatches && currentCallRef.current.activityMatches[0];
    if (currentMatch && previousMatch && currentMatch !== previousMatch) {
      defaultNote = currentMatch.note || '';
      defaultContactId = currentMatch.contactId || currentMatch.contact && (
        currentMatch.contact.id || currentMatch.contact
       ) || '';
      setDefaultFields(getDefaultFields(currentCall, defaultContactId, defaultNote));
    }
    currentCallRef.current = currentCall;
  }, [currentCall]);

  if (!currentCall) {
    return null;
  }
  const isLogged = currentCall.activityMatches && currentCall.activityMatches.length > 0;
  const isCustomizedFields = customizedPageData && customizedPageData.fields && customizedPageData.fields.length > 0;
  const fields = isCustomizedFields ? customizedPageData.fields : defaultFields;
  
  return (
    <LogPanel
      onBackButtonClick={onBackButtonClick}
      onSave={(input) => {
        onSave({
          call: currentCall,
          input,
          note: input.note,
        });
      }}
      saveButtonLoading={isLogging}
      infoNode={
        <CallInfo
          call={currentCall}
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          dateTimeFormatter={dateTimeFormatter}
        />
      }
      pageTitle={
        customizedPageData && customizedPageData.pageTitle ?
            customizedPageData.pageTitle :
            (isLogged ? 'Edit log' : 'Log call')
      }
      saveButtonLabel={
        customizedPageData && customizedPageData.saveButtonLabel
      }
      fields={fields}
      onFieldInputChange={(newValues, key) => {
        onCustomizedFieldChange(currentCall, newValues, key);
      }}
    />
  );
}
