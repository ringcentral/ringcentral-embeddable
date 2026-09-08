import type {
  CorrespondentMatch,
  FilteredConversation,
  LastMatchedCorrespondentEntity,
} from '@ringcentral-integration/micro-message/src/app/services';

import type { ThirdPartyPage, UnknownRecord } from '../../services/ThirdParty';

interface LogMessagePageLabels {
  contact: string;
  editLog: string;
  logMessages: string;
  save: string;
  unknown: string;
}

export type LoggableConversation = FilteredConversation & {
  conversationId?: string;
  lastMatchedCorrespondentEntity?: LastMatchedCorrespondentEntity | null;
  type?: string;
};

type LogMessageContact = CorrespondentMatch & {
  description?: string;
  id: string;
};

function getMatchedContacts(
  conversation: LoggableConversation,
): LogMessageContact[] {
  return conversation.correspondentMatches.filter(
    (contact): contact is LogMessageContact => Boolean(contact.id),
  );
}

function getDefaultContactId(
  conversation: LoggableConversation,
  contacts: LogMessageContact[],
): string {
  const selectedId = conversation.lastMatchedCorrespondentEntity?.id;
  if (selectedId && contacts.some(({ id }) => id === selectedId)) {
    return selectedId;
  }
  return contacts[0]?.id ?? 'unknown';
}

export function createDefaultLogMessagePage(
  conversation: LoggableConversation,
  labels: LogMessagePageLabels,
): ThirdPartyPage {
  const contacts = getMatchedContacts(conversation);
  const contactOptions =
    contacts.length > 0
      ? contacts.map(({ description, id, name }) => ({
          const: id,
          description,
          title: name || id,
        }))
      : [{ const: 'unknown', title: labels.unknown }];
  return {
    id: '$LOG-MESSAGES',
    title:
      conversation.conversationMatches.length > 0
        ? labels.editLog
        : labels.logMessages,
    schema: {
      properties: {
        contactId: {
          oneOf: contactOptions,
          title: labels.contact,
          type: 'string',
        },
      },
      type: 'object',
    },
    formData: {
      contactId: getDefaultContactId(conversation, contacts),
    },
    uiSchema: {
      submitButtonOptions: { submitText: labels.save },
    },
  };
}

export function resolveLogMessagePage(
  conversation: LoggableConversation,
  customizedPage: ThirdPartyPage | undefined,
  labels: LogMessagePageLabels,
): ThirdPartyPage {
  const fallbackPage = createDefaultLogMessagePage(conversation, labels);
  if (!customizedPage?.schema) {
    return fallbackPage;
  }
  return {
    ...customizedPage,
    title: customizedPage.title || fallbackPage.title,
  };
}

export function normalizeLogMessageFormData(value: unknown): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as UnknownRecord;
}

function valuesAreEqual(first: unknown, second: unknown): boolean {
  if (
    first &&
    second &&
    typeof first === 'object' &&
    typeof second === 'object'
  ) {
    return JSON.stringify(first) === JSON.stringify(second);
  }
  return first === second;
}

export function getChangedLogMessageKeys(
  currentFormData: UnknownRecord,
  nextFormData: UnknownRecord,
): string[] {
  return Object.keys(nextFormData).filter(
    (key) => !valuesAreEqual(currentFormData[key], nextFormData[key]),
  );
}

export function areRequiredLogMessageFieldsFilled(
  formData: UnknownRecord,
  schema: UnknownRecord,
): boolean {
  if (!Array.isArray(schema.required)) {
    return true;
  }
  return schema.required
    .filter((key): key is string => typeof key === 'string')
    .every((key) => {
      const value = formData[key];
      return value !== undefined && value !== null && value !== '';
    });
}
