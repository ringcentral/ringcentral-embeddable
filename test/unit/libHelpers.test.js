import callDirections from '@ringcentral-integration/commons/enums/callDirections';

import { getCallContact } from '../../src/lib/callHelper';
import { getWebphoneSessionContactMatch } from '../../src/lib/contactMatchHelper';
import {
  findExistedConversation,
  getConversationPhoneNumber,
} from '../../src/lib/conversationHelper';
import hackSend from '../../src/lib/hackSend';
import { isDuplicated } from '../../src/lib/isDuplicated';
import { isFirefox } from '../../src/lib/isFirefox';
import lockRefresh from '../../src/lib/lockRefresh';
import parseCallbackUri from '../../src/lib/parseUri';
import { popWindow } from '../../src/lib/popWindow';
import { renderContactName } from '../../src/lib/renderContactName';
import { isSameContact } from '../../src/lib/widgetContact';

function defineGlobal(name, value) {
  Object.defineProperty(global, name, {
    value,
    configurable: true,
    writable: true,
  });
}

function createLocalStorage(initialValues = {}) {
  const storage = {};
  Object.defineProperties(storage, {
    getItem: {
      value(key) {
        return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null;
      },
    },
    setItem: {
      value(key, value) {
        this[key] = String(value);
      },
    },
    removeItem: {
      value(key) {
        delete this[key];
      },
    },
  });
  Object.entries(initialValues).forEach(([key, value]) => {
    storage.setItem(key, value);
  });
  return storage;
}

describe('call and contact helpers', () => {
  it('returns null when call data is missing', () => {
    expect(getCallContact()).toBeNull();
  });

  it('returns the single inbound match for a call', () => {
    const match = {
      id: 'contact-1',
      name: 'Ada',
    };
    const result = getCallContact({
      direction: callDirections.inbound,
      fromMatches: [match],
      from: {
        phoneNumber: '+16505550101',
      },
    });

    expect(result).toBe(match);
  });

  it('falls back to the outbound phone number when no single match exists', () => {
    const result = getCallContact({
      direction: callDirections.outbound,
      toMatches: [],
      to: {
        extensionNumber: '101',
      },
    });

    expect(result).toEqual({
      phoneNumber: '101',
    });
  });

  it('returns an existing webphone session contact match first', () => {
    const contactMatch = {
      id: 'existing',
    };

    expect(getWebphoneSessionContactMatch({ contactMatch }, {})).toBe(contactMatch);
  });

  it('selects outbound and inbound matches from contact mapping', () => {
    const outboundMatch = {
      id: 'outbound',
    };
    const inboundMatch = {
      id: 'inbound',
    };

    expect(
      getWebphoneSessionContactMatch(
        {
          direction: callDirections.outbound,
          from: '+100',
          to: '+200',
        },
        {
          '+100': [inboundMatch],
          '+200': [outboundMatch],
        },
      ),
    ).toBe(outboundMatch);
    expect(
      getWebphoneSessionContactMatch(
        {
          direction: callDirections.inbound,
          from: '+100',
          to: '+200',
        },
        {
          '+100': [inboundMatch],
          '+200': [outboundMatch],
        },
      ),
    ).toBe(inboundMatch);
  });

  it('renders matched or fallback call contact names', () => {
    expect(
      renderContactName({
        direction: callDirections.inbound,
        fromMatches: [{ name: 'Inbound Match' }],
        from: { name: 'Inbound Fallback' },
      }),
    ).toBe('Inbound Match');
    expect(
      renderContactName({
        direction: callDirections.outbound,
        toMatches: [],
        to: { name: 'Outbound Fallback' },
      }),
    ).toBe('Outbound Fallback');
  });

  it('compares widget contacts by id and phone numbers', () => {
    expect(isSameContact({ id: '101' }, { id: '101' })).toBe(true);
    expect(isSameContact({ phoneNumber: '+1' }, { phoneNumber: '+1' })).toBe(true);
    expect(
      isSameContact(
        { phoneNumbers: [{ phoneNumber: '+2' }] },
        { phoneNumber: '+2' },
      ),
    ).toBe(true);
    expect(
      isSameContact(
        { phoneNumber: '+3' },
        { phoneNumbers: [{ phoneNumber: '+3' }] },
      ),
    ).toBe(true);
    expect(isSameContact(null, { id: '101' })).toBe(false);
    expect(isSameContact({ id: '101' }, { id: '102' })).toBe(false);
  });
});

describe('conversation helpers', () => {
  it('finds an inbound text conversation by phone number', () => {
    const conversation = {
      type: 'SMS',
      direction: 'Inbound',
      from: {
        phoneNumber: '+16505550101',
      },
      to: [{ phoneNumber: '+16505550102' }],
    };

    expect(findExistedConversation([conversation], '+16505550101')).toBe(conversation);
  });

  it('finds an outbound text conversation by extension number', () => {
    const conversation = {
      type: 'SMS',
      direction: 'Outbound',
      from: {
        phoneNumber: '+16505550101',
      },
      to: [{ extensionNumber: '102' }],
    };

    expect(findExistedConversation([conversation], '102')).toBe(conversation);
  });

  it('ignores non-text and multi-recipient conversations', () => {
    const conversations = [
      {
        type: 'Fax',
        direction: 'Inbound',
        from: {
          phoneNumber: '+16505550101',
        },
        to: [{ phoneNumber: '+16505550102' }],
      },
      {
        type: 'SMS',
        direction: 'Outbound',
        to: [{ phoneNumber: '+1' }, { phoneNumber: '+2' }],
      },
    ];

    expect(findExistedConversation(conversations, '+16505550101')).toBeUndefined();
  });

  it('returns the conversation phone number by direction', () => {
    expect(
      getConversationPhoneNumber({
        direction: 'Inbound',
        from: {
          extensionNumber: '101',
        },
      }),
    ).toBe('101');
    expect(
      getConversationPhoneNumber({
        direction: 'Outbound',
        to: [{
          phoneNumber: '+16505550102',
        }],
      }),
    ).toBe('+16505550102');
    expect(
      getConversationPhoneNumber({
        direction: 'Outbound',
        to: [],
      }),
    ).toBeNull();
  });
});

describe('browser utility helpers', () => {
  afterEach(() => {
    delete global.window;
    delete global.navigator;
    delete global.localStorage;
    jest.restoreAllMocks();
  });

  it('detects Firefox by user agent', () => {
    defineGlobal('window', {
      navigator: {
        userAgent: 'Mozilla/5.0 Firefox/126.0',
      },
    });

    expect(isFirefox()).toBe(true);

    global.window.navigator.userAgent = 'Mozilla/5.0 Chrome/126.0';
    expect(isFirefox()).toBe(false);
  });

  it('marks duplicate ids and clears expired keys', () => {
    defineGlobal('localStorage', createLocalStorage({
      'sms-old': '1',
      'sms-new': '2',
    }));
    jest.spyOn(Date, 'now').mockReturnValue(3);

    expect(isDuplicated('sms', 'latest', 2)).toBe(false);
    expect(global.localStorage.getItem('sms-latest')).toBe('3');
    expect(global.localStorage.getItem('sms-old')).toBeNull();
    expect(isDuplicated('sms', 'latest', 2)).toBe(true);
  });

  it('keeps storage entries when the group is below the max size', () => {
    defineGlobal('localStorage', createLocalStorage({
      'sms-current': '1',
    }));

    expect(isDuplicated('sms', 'latest', 20)).toBe(false);
    expect(global.localStorage.getItem('sms-current')).toBe('1');
  });

  it('continues when duplicate storage writes fail', () => {
    defineGlobal('localStorage', {
      getItem: jest.fn(() => null),
      setItem: jest.fn(() => {
        throw new Error('blocked');
      }),
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(isDuplicated('sms', 'latest')).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('opens a centered popup and rejects javascript urls', () => {
    const focus = jest.fn();
    const open = jest.fn(() => ({ focus }));
    defineGlobal('window', {
      screenLeft: 10,
      screenTop: 20,
      screen: {
        width: 1200,
        height: 800,
      },
      outerWidth: 1200,
      innerHeight: 800,
      open,
    });

    const result = popWindow('https://example.com', 'popup', 400, 300);

    expect(result).toEqual({ focus });
    expect(open).toHaveBeenCalledWith(
      'https://example.com',
      'popup',
      'scrollbars=yes, width=400, height=300, top=270, left=410',
    );
    expect(focus).toHaveBeenCalled();
    expect(() => popWindow('javascript:alert(1)', 'bad', 400, 300)).toThrow(
      'Invalid window open url',
    );
  });

  it('uses Firefox screen fallbacks and ignores focus errors', () => {
    const open = jest.fn(() => ({
      focus: jest.fn(() => {
        throw new Error('focus blocked');
      }),
    }));
    defineGlobal('window', {
      screen: {
        left: 30,
        top: 40,
      },
      outerWidth: 1000,
      innerHeight: 700,
      open,
    });

    expect(popWindow('https://example.com', 'popup', 300, 200)).toEqual({
      focus: expect.any(Function),
    });
    expect(open).toHaveBeenCalledWith(
      'https://example.com',
      'popup',
      'scrollbars=yes, width=300, height=200, top=290, left=380',
    );
  });
});

describe('SDK patch helpers', () => {
  afterEach(() => {
    delete global.window;
    delete global.navigator;
  });

  it('adds no-cache headers to SDK sends', async () => {
    const originalSend = jest.fn((options) => Promise.resolve(options));
    const platform = {
      send: originalSend,
    };
    const sdk = {
      platform: jest.fn(() => platform),
    };

    hackSend(sdk);
    const result = await platform.send({
      headers: {
        Authorization: 'Bearer token',
      },
    });

    expect(result.headers).toEqual({
      Authorization: 'Bearer token',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '-1',
    });
    expect(platform.originalSend).toBe(originalSend);
  });

  it('keeps the SDK unchanged when web locks are unavailable', () => {
    defineGlobal('window', {
      navigator: {
        userAgent: 'Chrome',
      },
    });
    defineGlobal('navigator', {});
    const sdk = {
      platform: jest.fn(),
    };

    expect(lockRefresh(sdk)).toBe(sdk);
    expect(sdk.platform).not.toHaveBeenCalled();
  });

  it('wraps SDK refresh with a web lock and returns valid auth data', async () => {
    defineGlobal('window', {
      navigator: {
        userAgent: 'Chrome',
      },
    });
    defineGlobal('navigator', {
      locks: {
        request: jest.fn((name, options, callback) => callback({ name, options })),
      },
    });
    const authData = {
      access_token: 'token',
    };
    const platform = {
      _auth: {
        accessTokenValid: jest.fn(() => Promise.resolve(true)),
        data: jest.fn(() => Promise.resolve(authData)),
      },
      _refresh: jest.fn(),
    };
    const originalRefresh = platform._refresh;
    const sdk = {
      platform: jest.fn(() => platform),
    };

    lockRefresh(sdk);
    const response = await platform._refresh();

    expect(navigator.locks.request).toHaveBeenCalledWith(
      'token_refresh',
      { mode: 'exclusive' },
      expect.any(Function),
    );
    expect(await response.json()).toEqual(authData);
    expect(platform._$$refresh).toBe(originalRefresh);
    expect(platform._refresh).not.toBe(originalRefresh);
    expect(platform._$$refresh).not.toHaveBeenCalled();
  });

  it('falls back to the original refresh when auth data is expired', async () => {
    defineGlobal('window', {
      navigator: {
        userAgent: 'Chrome',
      },
    });
    defineGlobal('navigator', {
      locks: {
        request: jest.fn((name, options, callback) => callback({ name, options })),
      },
    });
    const refreshResponse = {
      ok: true,
    };
    const platform = {
      _auth: {
        accessTokenValid: jest.fn(() => Promise.resolve(false)),
      },
      _refresh: jest.fn(() => Promise.resolve(refreshResponse)),
    };
    const originalRefresh = platform._refresh;
    const sdk = {
      platform: jest.fn(() => platform),
    };

    lockRefresh(sdk);

    await expect(platform._refresh()).resolves.toBe(refreshResponse);
    expect(platform._$$refresh).toBe(originalRefresh);
    expect(platform._$$refresh).toHaveBeenCalled();
  });
});

describe('URI parsing', () => {
  it('combines query and hash parameters', () => {
    expect(
      parseCallbackUri(
        'https://example.com/callback?code=abc&state=one#access_token=token&expires_in=3600',
      ),
    ).toEqual({
      code: 'abc',
      state: 'one',
      access_token: 'token',
      expires_in: '3600',
    });
  });

  it('throws an enriched error for OAuth errors', () => {
    expect(() => parseCallbackUri(
      'https://example.com/callback?error=access_denied&error_description=Denied',
    )).toThrow(
      expect.objectContaining({
        message: 'access_denied',
        error: 'access_denied',
        error_description: 'Denied',
      }),
    );
  });
});
