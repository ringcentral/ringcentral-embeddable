import React, { useState, useEffect } from 'react';

import { CustomizedPanel } from '../CustomizedPanel';
import { ConversationInfo } from './ConversationInfo';

export default function LogMessagesPanel({
  currentLocale,
  onBackButtonClick,
  formatPhone,
  dateTimeFormatter,
  customizedPageData,
  onCustomizedFieldChange,
  conversationLog,
  onSaveLog,
  correspondentMatches,
  lastMatchedCorrespondentEntity,
  isLogging,
}) {
  const [defaultFields, setDefaultFields] = useState([]);

  useEffect(() => {
    if (!correspondentMatches || correspondentMatches.length === 0) {
      setDefaultFields([{
        id: 'contactId',
        label: 'Contact',
        type: 'input.choice',
        options: [{
          id: 'unknown',
          name: 'Unknown',
        }],
      }]);
      return;
    }
    const defaultContactId = lastMatchedCorrespondentEntity ?
      lastMatchedCorrespondentEntity.id :
      correspondentMatches[0].id;
    setDefaultFields([{
      id: 'contactId',
      label: 'Contact',
      type: 'input.choice',
      options: correspondentMatches.map((entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.description,
      })),
      value: defaultContactId,
    }]);
  }, [correspondentMatches, lastMatchedCorrespondentEntity]);

  if (!conversationLog) {
    return null;
  }

  let isLogged = false;
  let conversationId = '';
  if (Object.keys(conversationLog).length > 0) {
    const conversation = conversationLog[Object.keys(conversationLog)[0]];
    if (conversation) {
      conversationId = conversation.conversationId;
      if (conversation.conversationLogMatches && conversation.conversationLogMatches.length > 0) {
        isLogged = true;
      }
    }
  }
  const isCustomizedFields = customizedPageData && customizedPageData.fields && customizedPageData.fields.length > 0;
  const fields = isCustomizedFields ? customizedPageData.fields : defaultFields;
  return (
    <CustomizedPanel
      onBackButtonClick={onBackButtonClick}
      pageTitle={
        customizedPageData && customizedPageData.pageTitle ?
            customizedPageData.pageTitle :
            (isLogged ? 'Edit log' : 'Log messages')
      }
      saveButtonLabel={
        customizedPageData && customizedPageData.saveButtonLabel  || 'Save'
      }
      fields={fields}
      onSave={(input) => {
        onSaveLog({
          input,
          conversationId,
        });
      }}
      saveButtonLoading={isLogging}
      infoNode={
        <ConversationInfo
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          dateTimeFormatter={dateTimeFormatter}
          conversationLog={conversationLog}
        />
      }
      onFieldInputChange={(newValues, key) => {
        onCustomizedFieldChange(conversationLog, newValues, key);
      }}
    />
  );
}
