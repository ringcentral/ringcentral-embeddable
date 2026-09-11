import { SmsTypingTimeTracker } from '../src/app/services/SmsTypingTimeTracker';

function createTracker({ enabled = true } = {}) {
  let onMessageUpdated;
  const tracker = new SmsTypingTimeTracker(
    { enable: jest.fn() },
    {
      onMessageUpdated: jest.fn((listener) => {
        onMessageUpdated = listener;
      }),
    },
    { get: jest.fn() },
    { enableTypingTimeTracking: enabled },
  );
  return { getOnMessageUpdated: () => onMessageUpdated, tracker };
}

describe('SmsTypingTimeTracker', () => {
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('persists elapsed typing time against the sent message', async () => {
    const { getOnMessageUpdated, tracker } = createTracker();
    await tracker.startTyping('conversation-id');
    Date.now.mockReturnValue(2_500);

    getOnMessageUpdated()({
      conversationId: 'conversation-id',
      direction: 'Outbound',
      id: 'message-id',
    });

    expect(tracker.getTypingTime('message-id')).toBe(1_500);
  });

  test('preserves accumulated time while navigating away', async () => {
    const { tracker } = createTracker();
    await tracker.startTyping('conversation-id');
    Date.now.mockReturnValue(1_600);
    await tracker.pauseTyping('conversation-id');
    Date.now.mockReturnValue(2_000);
    await tracker.startTyping('conversation-id');
    Date.now.mockReturnValue(2_900);
    await tracker.stopTyping('conversation-id', 'message-id');

    expect(tracker.getTypingTime('message-id')).toBe(1_500);
  });

  test('supports a persisted runtime override', async () => {
    const { tracker } = createTracker({ enabled: false });
    expect(tracker.enabled).toBe(false);

    await tracker.setEnabled(true);

    expect(tracker.enabled).toBe(true);
  });
});
