import { createConversationLoggerOptions } from '../src/app/services/ConversationLogger/createConversationLoggerOptions';

describe('ConversationLogger options', () => {
  function createOptions() {
    const thirdParty = {
      logConversation: jest.fn(async () => {}),
      messageLoggerRegistered: true,
    };
    const dateTimeFormat = {
      formatDateTime: jest.fn(() => '2026-09-07'),
    };
    return {
      options: createConversationLoggerOptions({
        autoLog: true,
        dateTimeFormat,
        thirdParty,
      }),
      thirdParty,
    };
  }

  test('preserves the default, readiness, and host log payload', async () => {
    const { options, thirdParty } = createOptions();
    const item = { conversationLogId: 'conversation-log-id' };

    expect(options.autoLog).toBe(true);
    expect(options.readyCheckFunction()).toBe(true);
    await options.logFunction({ item, triggerType: 'auto' });

    expect(thirdParty.logConversation).toHaveBeenCalledWith({
      item,
      triggerType: 'auto',
    });
  });

  test('only auto-processes current-day messages while always allowing threads', () => {
    const { options } = createOptions();

    expect(
      options.accordWithLogRequirement({ date: '2026-09-06', type: 'SMS' }),
    ).toBe(false);
    expect(
      options.accordWithLogRequirement({ date: '2026-09-07', type: 'SMS' }),
    ).toBe(true);
    expect(
      options.accordWithLogRequirement({ date: '2026-09-06', type: 'Thread' }),
    ).toBe(true);
  });

  test.each([
    [{ id: 'contact-id' }],
    [{ contactId: 'contact-id' }],
    [{ contact: 'contact-id' }],
    [{ contact: { id: 'contact-id' } }],
  ])('accepts legacy logged-contact shapes', (activity) => {
    const { options } = createOptions();

    expect(options.isLoggedContact({}, activity, { id: 'contact-id' })).toBe(
      true,
    );
  });
});
