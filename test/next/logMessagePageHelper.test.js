import {
  createDefaultLogMessagePage,
  resolveLogMessagePage,
} from '../../next/app/views/LogMessageView/LogMessagePage.helper';

const labels = {
  contact: 'Contact',
  editLog: 'Edit log',
  logMessages: 'Log messages',
  save: 'Save',
  unknown: 'Unknown',
};

function createConversation(overrides = {}) {
  return {
    conversationMatches: [],
    correspondentMatches: [
      { description: 'CRM contact', id: 'contact-1', name: 'Ada Lovelace' },
      { id: 'contact-2', name: 'Grace Hopper' },
    ],
    ...overrides,
  };
}

describe('log-message page helpers', () => {
  test('builds the default contact schema and preserves the selected match', () => {
    const page = createDefaultLogMessagePage(
      createConversation({
        lastMatchedCorrespondentEntity: {
          id: 'contact-2',
          name: 'Grace Hopper',
        },
      }),
      labels,
    );

    expect(page).toEqual(
      expect.objectContaining({
        id: '$LOG-MESSAGES',
        title: 'Log messages',
        formData: { contactId: 'contact-2' },
      }),
    );
    expect(page.schema.properties.contactId.oneOf).toEqual([
      {
        const: 'contact-1',
        description: 'CRM contact',
        title: 'Ada Lovelace',
      },
      { const: 'contact-2', title: 'Grace Hopper' },
    ]);
  });

  test('provides the legacy unknown contact option without matches', () => {
    const page = createDefaultLogMessagePage(
      createConversation({ correspondentMatches: [] }),
      labels,
    );

    expect(page.formData).toEqual({ contactId: 'unknown' });
    expect(page.schema.properties.contactId.oneOf).toEqual([
      { const: 'unknown', title: 'Unknown' },
    ]);
  });

  test('uses the custom schema and edit fallback title', () => {
    const customPage = {
      id: '$LOG-MESSAGES',
      schema: { properties: { disposition: { type: 'string' } } },
    };
    const conversation = createConversation({
      conversationMatches: [{ id: 'activity-id', name: 'Activity' }],
    });

    expect(resolveLogMessagePage(conversation, customPage, labels)).toEqual({
      ...customPage,
      title: 'Edit log',
    });
  });
});
