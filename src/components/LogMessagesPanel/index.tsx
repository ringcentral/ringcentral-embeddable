import React, { useState, useEffect } from 'react';

import { CustomizedPanel } from '../CustomizedPanel';
import { ConversationInfo } from './ConversationInfo';

export default function LogMessagesPanel({
  currentLocale,
  onBackButtonClick,
  formatPhone,
  dateTimeFormatter,
  customizedPage,
  onCustomizedFieldChange,
  conversationLog,
  onSaveLog,
  correspondentMatches,
  lastMatchedCorrespondentEntity,
  isLogging,
  onFormPageButtonClick,
  onClose,
  showCloseButton,
  hideBackButton,
}) {
  const [defaultPage, setDefaultPage] = useState({
    schema: {
      type: 'object',
      properties: {} as any,
    },
    uiSchema: {
      submitButtonOptions: {
        submitText: 'Save',
      },
    } as any,
    formData: {
      contactId: '',
      note: '',
    } as any,
  });

  useEffect(() => {
    if (!correspondentMatches || correspondentMatches.length === 0) {
      setDefaultPage({
        schema: {
          type: 'object',
          properties: {
            contactId: {
              title: 'Contact',
              type: 'string',
              oneOf: [{
                title: 'Unknown',
                const: 'unknown',
              }],
            },
          },
        },
        uiSchema: {
          submitButtonOptions: {
            submitText: 'Save',
          },
        },
        formData: {
          contactId: 'unknown'
        },
      });
      return;
    }
    const defaultContactId = lastMatchedCorrespondentEntity ?
      lastMatchedCorrespondentEntity.id :
      correspondentMatches[0].id;
    setDefaultPage({
      schema: {
        type: 'object',
        properties: {
          contactId: {
            title: 'Contact',
            type: 'string',
            oneOf: correspondentMatches.map((entity) => ({
              title: entity.name,
              const: entity.id,
              description: entity.description,
            })),
          },
        },
      },
      uiSchema: {
        submitButtonOptions: {
          submitText: 'Save',
        },
      },
      formData: {
        contactId: defaultContactId,
      },
    });
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
  return (
    <CustomizedPanel
      type="page"
      hideBackButton={hideBackButton}
      onBackButtonClick={onBackButtonClick}
      onButtonClick={onFormPageButtonClick}
      title={
        customizedPage && customizedPage.title ?
            customizedPage.title :
            (isLogged ? 'Edit log' : 'Log messages')
      }
      onSave={(_pageId, formData) => {
        onSaveLog({
          formData,
          conversationId,
        });
      }}
      saveButtonLoading={isLogging}
      onClose={onClose}
      showCloseButton={showCloseButton}
      infoNode={
        <ConversationInfo
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          dateTimeFormatter={dateTimeFormatter}
          conversationLog={conversationLog}
        />
      }
      onFormDataChange={(_pageId, formData, keys) => {
        onCustomizedFieldChange(conversationLog, formData, keys);
      }}
      schema={customizedPage && customizedPage.schema || defaultPage.schema}
      uiSchema={customizedPage && customizedPage.schema ? (customizedPage.uiSchema || {}) : defaultPage.uiSchema}
      formData={customizedPage && customizedPage.schema ? (customizedPage.formData || {}) : defaultPage.formData}
      pageId={customizedPage && customizedPage.id}
    />
  );
}
