/**
 * @jest-environment node
 */

import requestWithPostMessage from '../../src/lib/requestWithPostMessage';

function createMessageWindow() {
  const messageListeners = new Set();
  return {
    target: {
      postMessage: jest.fn(),
    },
    window: {
      addEventListener: jest.fn((event, listener) => {
        if (event === 'message') {
          messageListeners.add(listener);
        }
      }),
      removeEventListener: jest.fn((event, listener) => {
        if (event === 'message') {
          messageListeners.delete(listener);
        }
      }),
      parent: {},
    },
    dispatchMessage(data) {
      messageListeners.forEach((listener) => listener({ data }));
    },
  };
}

describe('requestWithPostMessage', () => {
  afterEach(() => {
    delete global.window;
    jest.useRealTimers();
  });

  it('posts a request and resolves the matching response', async () => {
    const messageWindow = createMessageWindow();
    global.window = messageWindow.window;
    messageWindow.target.postMessage.mockImplementation((message) => {
      Promise.resolve().then(() => {
        messageWindow.dispatchMessage({
          type: 'rc-post-message-response',
          responseId: message.requestId,
          response: {
            ok: true,
          },
        });
      });
    });

    const result = await requestWithPostMessage(
      '/contacts',
      { page: 1 },
      3000,
      messageWindow.target,
    );

    expect(messageWindow.target.postMessage).toHaveBeenCalledWith(
      {
        type: 'rc-post-message-request',
        requestId: expect.any(String),
        path: '/contacts',
        body: {
          page: 1,
        },
      },
      '*',
    );
    expect(result).toEqual({
      ok: true,
    });
    expect(messageWindow.window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });

  it('ignores unrelated responses until the matching response arrives', async () => {
    const messageWindow = createMessageWindow();
    global.window = messageWindow.window;
    messageWindow.target.postMessage.mockImplementation((message) => {
      Promise.resolve().then(() => {
        messageWindow.dispatchMessage(null);
        messageWindow.dispatchMessage({
          type: 'custom-response',
          responseId: 'other-id',
          response: {
            ignored: true,
          },
        });
        messageWindow.dispatchMessage({
          type: 'custom-response',
          responseId: message.requestId,
          response: {
            ok: true,
          },
        });
      });
    });

    await expect(requestWithPostMessage(
      '/contacts',
      { page: 1 },
      3000,
      messageWindow.target,
      'custom',
    )).resolves.toEqual({
      ok: true,
    });
  });

  it('rejects and removes the listener when no response arrives', async () => {
    jest.useFakeTimers();
    const messageWindow = createMessageWindow();
    global.window = messageWindow.window;

    const result = requestWithPostMessage(
      '/contacts',
      {},
      3000,
      messageWindow.target,
    );
    jest.advanceTimersByTime(3000);

    await expect(result).rejects.toThrow('Time out');
    expect(messageWindow.window.removeEventListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
  });
});
