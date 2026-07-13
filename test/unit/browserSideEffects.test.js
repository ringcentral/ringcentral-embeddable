function defineGlobal(name, value) {
  Object.defineProperty(global, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function createLocalStorage() {
  const storage = {
    setItem: jest.fn(function setItem(key, value) {
      this[key] = value;
    }),
    removeItem: jest.fn(function removeItem(key) {
      delete this[key];
    }),
  };
  return storage;
}

describe('BroadcastChannelWithStorage', () => {
  afterEach(() => {
    delete global.window;
    delete global.localStorage;
    jest.resetModules();
  });

  it('patches missing BroadcastChannel and emits parsed storage messages', () => {
    let storageListener;
    defineGlobal('window', {
      addEventListener: jest.fn((event, listener) => {
        if (event === 'storage') {
          storageListener = listener;
        }
      }),
      removeEventListener: jest.fn(),
    });
    defineGlobal('localStorage', createLocalStorage());

    jest.isolateModules(() => {
      const {
        BroadcastChannelWithStorage,
      } = require('../../src/lib/BroadcastChannel.polyfill');
      const channel = new BroadcastChannelWithStorage('channel-name');
      const listener = jest.fn();
      const onmessage = jest.fn();
      channel.addEventListener('message', listener);
      channel.onmessage = onmessage;
      channel.removeEventListener('message', listener);
      channel.addEventListener('message', listener);

      storageListener({
        key: 'channel-name',
        newValue: JSON.stringify({ ok: true }),
      });
      channel.postMessage({ sent: true });
      channel.close();

      expect(window.BroadcastChannel).toBe(BroadcastChannelWithStorage);
      expect(listener).toHaveBeenCalledWith({ data: { ok: true } });
      expect(onmessage).toHaveBeenCalledWith({ data: { ok: true } });
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'channel-name',
        JSON.stringify({ sent: true }),
      );
      expect(localStorage.removeItem).toHaveBeenCalledWith('channel-name');
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'storage',
        expect.any(Function),
      );
      expect(channel.name).toBe('channel-name');
    });
  });

  it('emits message errors for invalid storage payloads', () => {
    let storageListener;
    defineGlobal('window', {
      addEventListener: jest.fn((event, listener) => {
        if (event === 'storage') {
          storageListener = listener;
        }
      }),
      removeEventListener: jest.fn(),
    });
    defineGlobal('localStorage', createLocalStorage());

    jest.isolateModules(() => {
      const {
        BroadcastChannelWithStorage,
      } = require('../../src/lib/BroadcastChannel.polyfill');
      const channel = new BroadcastChannelWithStorage('channel-name');
      const listener = jest.fn();
      const onmessageerror = jest.fn();
      channel.addEventListener('messageerror', listener);
      channel.onmessageerror = onmessageerror;

      storageListener({
        key: 'channel-name',
        newValue: '{',
      });
      storageListener({
        key: 'other-channel',
        newValue: JSON.stringify({ ignored: true }),
      });
      storageListener({
        key: 'channel-name',
        newValue: '',
      });

      expect(listener).toHaveBeenCalledWith(expect.any(SyntaxError));
      expect(onmessageerror).toHaveBeenCalledWith(expect.any(SyntaxError));
    });
  });
});

describe('patchGetUserMedia', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    delete global.document;
    delete global.navigator;
    delete global.window;
    jest.resetModules();
  });

  it('delegates immediately on active tabs and warns on inactive pending prompts', async () => {
    const originalGetUserMedia = jest.fn(async (constraints) => ({
      constraints,
      stream: true,
    }));
    defineGlobal('document', {
      hidden: false,
    });
    defineGlobal('navigator', {
      mediaDevices: {
        getUserMedia: originalGetUserMedia,
      },
    });
    defineGlobal('window', {
      phone: {
        alert: {
          warning: jest.fn(),
        },
      },
    });

    jest.isolateModules(() => {
      require('../../src/lib/patchGetUserMedia');
    });

    await expect(navigator.mediaDevices.getUserMedia({ audio: true }))
      .resolves.toEqual({
        constraints: { audio: true },
        stream: true,
      });
    expect(originalGetUserMedia).toHaveBeenCalledWith({ audio: true });

    let resolveMedia;
    originalGetUserMedia.mockImplementationOnce(() => new Promise((resolve) => {
      resolveMedia = resolve;
    }));
    document.hidden = true;
    const pendingPromise = navigator.mediaDevices.getUserMedia({ video: true });
    jest.advanceTimersByTime(3000);
    expect(window.phone.alert.warning).toHaveBeenCalledWith({
      message: 'allowMicrophonePermissionOnInactiveTab',
      ttl: 0,
    });
    resolveMedia({ stream: 'late' });
    await expect(pendingPromise).resolves.toEqual({ stream: 'late' });
  });

  it('clears inactive tab prompt timers on rejected media requests', async () => {
    const mediaError = new Error('denied');
    defineGlobal('document', {
      hidden: true,
    });
    defineGlobal('navigator', {
      mediaDevices: {
        getUserMedia: jest.fn(async () => {
          throw mediaError;
        }),
      },
    });
    defineGlobal('window', {
      phone: {
        alert: {
          warning: jest.fn(),
        },
      },
    });

    jest.isolateModules(() => {
      require('../../src/lib/patchGetUserMedia');
    });

    await expect(navigator.mediaDevices.getUserMedia({ audio: true }))
      .rejects.toThrow('denied');
    jest.advanceTimersByTime(3000);
    expect(window.phone.alert.warning).not.toHaveBeenCalled();
  });
});
