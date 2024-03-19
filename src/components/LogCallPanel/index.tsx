import React, { useState, useEffect, useRef } from 'react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import { CallInfo } from './CallInfo';
import { CustomizedPanel } from '../CustomizedPanel';

function getDefaultPage(call, defaultContactId, defaultNote) {
  const page = {
    schema: {
      type: 'object',
      properties: {} as any,
    },
    uiSchema: {} as any,
    formData: {} as any,
  };
  const matchContacts = call.direction === callDirections.inbound
      ? call.fromMatches : call.toMatches;
  if (matchContacts && matchContacts.length > 0) {
    page.schema.properties.contactId = {
      type: 'string',
      title: 'Contact',
      oneOf: matchContacts.map((entity) => ({
        title: entity.name,
        const: entity.id,
        description: entity.description,
      })),
    };
    page.formData.contactId = defaultContactId || matchContacts[0].id || '';
  }
  page.schema.properties.note = {
    type: 'string',
    title: 'Note',
  };
  page.formData.note = defaultNote || '';
  page.uiSchema = {
    note: {
      'ui:widget': 'textarea',
      'ui:placeholder': 'Add call log note',
    },
    submitButtonOptions: {
      submitText: 'Save',
    },
  }
  return page;
}

export default function LogCallPanel({
  currentLocale,
  currentCall = null,
  onSave,
  onLoadData,
  formatPhone,
  dateTimeFormatter,
  customizedPage,
  onCustomizedFieldChange,
  onBackButtonClick,
  isLogging,
}) {
  const currentCallRef = useRef(null);
  const [defaultPage, setDefaultPage] = useState({
    schema: {
      type: 'object',
      properties: {} as any,
    },
    uiSchema: {} as any,
    formData: {
      contactId: '',
      note: '',
    } as any,
  });
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
      setDefaultPage(getDefaultPage(currentCall, defaultContactId, defaultNote));
      return;
    }
    const currentMatch = currentCall.activityMatches && currentCall.activityMatches[0];
    const previousMatch = currentCallRef.current && currentCallRef.current.activityMatches && currentCallRef.current.activityMatches[0];
    if (currentMatch && previousMatch && currentMatch !== previousMatch) {
      defaultNote = currentMatch.note || '';
      defaultContactId = currentMatch.contactId || currentMatch.contact && (
        currentMatch.contact.id || currentMatch.contact
       ) || '';
       setDefaultPage(getDefaultPage(currentCall, defaultContactId, defaultNote));
    }
    currentCallRef.current = currentCall;
  }, [currentCall]);

  if (!currentCall) {
    return null;
  }
  const isLogged = currentCall.activityMatches && currentCall.activityMatches.length > 0;

  return (
    <CustomizedPanel
      onBackButtonClick={onBackButtonClick}
      onSave={(formData) => {
        onSave({
          call: currentCall,
          formData,
          note: formData.note,
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
      title={
        customizedPage && customizedPage.title ?
            customizedPage.title :
            (isLogged ? 'Edit log' : 'Log call')
      }
      schema={customizedPage && customizedPage.schema || defaultPage.schema}
      uiSchema={customizedPage && customizedPage.schema ? (customizedPage.uiSchema || {}) : defaultPage.uiSchema}
      formData={customizedPage && customizedPage.schema ? (customizedPage.formData || {}) : defaultPage.formData}
      onFormDataChange={(newFormData, keys) => {
        onCustomizedFieldChange(currentCall, newFormData, keys);
      }}
    />
  );
}
