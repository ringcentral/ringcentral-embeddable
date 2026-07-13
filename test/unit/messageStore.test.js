const messageDirection = require('@ringcentral-integration/commons/enums/messageDirection').default;
const messageTypes = require('@ringcentral-integration/commons/enums/messageTypes').default;
const { syncTypes } = require('@ringcentral-integration/commons/enums/syncTypes');
const { subscriptionFilters } = require('@ringcentral-integration/commons/enums/subscriptionFilters');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');
const { sleep } = require('@ringcentral-integration/utils');

jest.mock('@ringcentral-integration/utils', () => ({
  ...jest.requireActual('@ringcentral-integration/utils'),
  sleep: jest.fn(async () => {}),
}));

const { MessageStore } = require('../../src/modules/MessageStore');

function setValue(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value,
  });
}

function createMessageStore(overrides = {}) {
  const {
    _hasPermission = true,
    conversationStore,
    data,
    textConversations,
    voicemailTranscriptions,
    ...directOverrides
  } = overrides;
  const list = jest.fn(async () => ({
    records: [],
    syncInfo: {},
  }));
  const platformGet = jest.fn(async () => ({
    text: async () => 'Transcribed voicemail',
  }));
  const store = Object.create(MessageStore.prototype);
  Object.assign(store, {
    _conversationLoadLength: 2,
    _conversationsLoadLength: 3,
    _daySpan: 7,
    _handledRecord: null,
    _source: 'messageStore',
    _deps: {
      alert: {
        warning: jest.fn(),
      },
      appFeatures: {
        hasCallQueueSmsRecipientPermission: true,
        hasSharedMessageStorePermission: true,
      },
      auth: {
        ownerId: 'owner-1',
      },
      client: {
        account: jest.fn(() => ({
          extension: jest.fn(() => ({
            messageSync: jest.fn(() => ({
              list,
            })),
          })),
        })),
        service: {
          platform: jest.fn(() => ({
            get: platformGet,
          })),
        },
      },
      dataFetcherV2: {
        fetchData: jest.fn(),
        updateData: jest.fn(),
      },
      subscription: {
        message: null,
        subscribe: jest.fn(),
      },
      tabManager: {
        active: true,
      },
    },
    _dispatchMessageHandlers: jest.fn(),
    _messagesFilter: jest.fn((records) => records),
    _processRawConversationList: jest.fn(({ records }) => (
      records.map((record) => ({ conversationId: record.conversationId || record.id }))
    )),
    _processRawConversationStore: jest.fn(({ records }) => ({
      processed: records.map((record) => record.id),
    })),
    ...directOverrides,
  });
  setValue(store, '_hasPermission', _hasPermission);
  setValue(store, 'ready', true);
  setValue(store, 'syncInfo', null);
  setValue(store, 'conversationStore', conversationStore || {});
  setValue(store, 'data', data || {
    conversationList: [],
    conversationStore: {},
    syncInfo: null,
  });
  setValue(store, 'textConversations', textConversations || []);
  store.voicemailTranscriptions = voicemailTranscriptions || [];
  store._testList = list;
  store._testPlatformGet = platformGet;
  return store;
}

function createRecentRecord(id) {
  return {
    id,
    conversationId: `conversation-${id}`,
    lastModifiedTime: new Date().toISOString(),
  };
}

function createInvalidTokenError(errorCode) {
  return {
    response: {
      status: 400,
      clone: () => ({
        json: async () => ({
          errors: [{ errorCode }],
        }),
      }),
    },
  };
}

describe('MessageStore module', () => {
  beforeEach(() => {
    setStagedState({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('subscribes to message-store and shared-sms notifications on init', () => {
    const store = createMessageStore();

    store.onInit();

    expect(store._deps.subscription.subscribe).toHaveBeenCalledWith([
      subscriptionFilters.messageStore,
      '/restapi/v1.0/account/~/extension/~/shared-sms',
    ]);

    const noPermissionStore = createMessageStore({ _hasPermission: false });
    noPermissionStore.onInit();
    expect(noPermissionStore._deps.subscription.subscribe).not.toHaveBeenCalled();
  });

  it('syncs message pages with fSync, iSync, shared owner, and older-record recursion', async () => {
    const store = createMessageStore();
    store._testList
      .mockResolvedValueOnce({
        records: [{
          id: 'newer',
          creationTime: '2026-01-10T00:00:00.000Z',
        }],
        syncInfo: {
          olderRecordsExist: true,
        },
      })
      .mockResolvedValueOnce({
        records: [{
          id: 'older',
          creationTime: '2026-01-09T00:00:00.000Z',
        }],
        syncInfo: {
          olderRecordsExist: false,
        },
      });

    await expect(store._syncFunction({
      conversationLoadLength: 2,
      dateFrom: new Date('2026-01-01T00:00:00.000Z'),
      dateTo: new Date('2026-01-11T00:00:00.000Z'),
      recordCount: 3,
    })).resolves.toEqual({
      records: [
        { id: 'newer', creationTime: '2026-01-10T00:00:00.000Z' },
        { id: 'older', creationTime: '2026-01-09T00:00:00.000Z' },
      ],
      syncInfo: {
        olderRecordsExist: true,
        owner: 'Any',
      },
    });
    expect(store._testList).toHaveBeenNthCalledWith(1, expect.objectContaining({
      dateFrom: '2026-01-01T00:00:00.000Z',
      dateTo: '2026-01-11T00:00:00.000Z',
      owner: 'Any',
      recordCount: 3,
      recordCountPerConversation: 2,
      syncType: syncTypes.fSync,
    }));
    expect(store._testList).toHaveBeenNthCalledWith(2, expect.objectContaining({
      dateTo: '2026-01-10T00:00:00.000Z',
      syncType: syncTypes.fSync,
    }));
    expect(sleep).toHaveBeenCalledWith(500);

    store.syncInfo = {
      owner: 'Shared',
    };
    store._testList.mockResolvedValueOnce({
      records: [],
      syncInfo: {
        olderRecordsExist: false,
      },
    });
    await store._syncFunction({
      conversationLoadLength: 1,
      recordCount: 1,
      syncToken: 'sync-token',
    });
    expect(store._testList).toHaveBeenLastCalledWith({
      syncToken: 'sync-token',
      syncType: syncTypes.iSync,
    });
  });

  it('refreshes sync data after invalid sync-token errors and dispatches recent records', async () => {
    const store = createMessageStore();
    const recentRecord = createRecentRecord('message-1');
    store.syncInfo = {
      owner: 'Personal',
      syncToken: 'bad-token',
    };
    store._syncFunction = jest.fn()
      .mockRejectedValueOnce(createInvalidTokenError('MSG-333'))
      .mockResolvedValueOnce({
        records: [recentRecord, {
          id: 'old-message',
          lastModifiedTime: '2020-01-01T00:00:00.000Z',
        }],
        syncInfo: {
          syncToken: 'fresh-token',
        },
      });

    await expect(store._syncData()).resolves.toEqual({
      conversationList: [
        { conversationId: 'conversation-message-1' },
        { conversationId: 'old-message' },
      ],
      conversationStore: { processed: ['message-1', 'old-message'] },
      syncInfo: { syncToken: 'fresh-token' },
    });

    expect(store._syncFunction).toHaveBeenNthCalledWith(1, expect.objectContaining({
      conversationLoadLength: 2,
      recordCount: 6,
      syncToken: null,
    }));
    expect(store._syncFunction).toHaveBeenNthCalledWith(2, expect.objectContaining({
      syncToken: null,
    }));
    expect(store._dispatchMessageHandlers).toHaveBeenCalledWith([recentRecord]);
    expect(store._handledRecord).toBeNull();
    expect(store._processRawConversationList).toHaveBeenCalledWith(expect.objectContaining({
      isFSyncSuccess: true,
    }));
  });

  it('pushes messages and warns when unread requests cannot target inbound messages', async () => {
    const store = createMessageStore({
      conversationStore: {
        outbound: [{
          id: 'outbound-message',
          direction: messageDirection.outbound,
          type: messageTypes.sms,
        }],
      },
    });
    const records = [createRecentRecord('pushed-message')];

    await store.pushMessages(records);

    expect(store._deps.dataFetcherV2.updateData).toHaveBeenCalledWith(
      'messageStore',
      expect.objectContaining({
        conversationList: [{ conversationId: 'conversation-pushed-message' }],
        conversationStore: { processed: ['pushed-message'] },
      }),
      expect.any(Number),
    );
    expect(store._dispatchMessageHandlers).toHaveBeenCalledWith(records);

    await store.unreadMessage('missing');
    expect(store._deps.alert.warning).toHaveBeenCalledWith({
      message: 'noUnreadForOldMessages',
    });

    await store.unreadMessage('outbound');
    expect(store._deps.alert.warning).toHaveBeenCalledWith({
      message: 'noUnreadForOutboundMessages',
    });
  });

  it('computes shared text counts and keeps voicemail transcription cache bounded', () => {
    const store = createMessageStore({
      textConversations: [
        { id: 'personal', owner: null, unreadCounts: 2 },
        { id: 'shared-1', owner: { id: 'owner-1' }, unreadCounts: 3 },
        { id: 'shared-2', owner: { id: 'owner-2' }, unreadCounts: 4 },
      ],
    });

    expect(store.sharedSmsConversations).toEqual([
      { id: 'shared-1', owner: { id: 'owner-1' }, unreadCounts: 3 },
      { id: 'shared-2', owner: { id: 'owner-2' }, unreadCounts: 4 },
    ]);
    expect(store.personalTextUnreadCounts).toBe(2);
    expect(store.sharedTextUnreadCounts).toBe(7);

    Array.from({ length: 22 }).forEach((_, index) => {
      store.addVoicemailTranscription({
        id: `transcription-${index}`,
        messageId: `message-${index}`,
        text: `Text ${index}`,
      });
    });
    store.addVoicemailTranscription({
      id: 'replacement',
      messageId: 'message-21',
      text: 'Replacement',
    });

    expect(store.voicemailTranscriptions).toHaveLength(20);
    expect(store.voicemailTranscriptions[0]).toEqual({
      id: 'replacement',
      messageId: 'message-21',
      text: 'Replacement',
    });
    expect(store.voicemailTranscriptionMap['message-21']).toEqual({
      id: 'replacement',
      messageId: 'message-21',
      text: 'Replacement',
    });
  });

  it('fetches voicemail transcriptions for supported voicemail attachments', async () => {
    const store = createMessageStore();

    await store.fetchVoicemailTranscription(null);
    await store.fetchVoicemailTranscription({
      id: 'sms-1',
      type: messageTypes.sms,
    });
    expect(store.voicemailTranscriptions).toEqual([]);

    await store.fetchVoicemailTranscription({
      id: 'voicemail-progress',
      type: messageTypes.voiceMail,
      vmTranscriptionStatus: 'InProgress',
    });
    expect(store.voicemailTranscriptionMap['voicemail-progress']).toEqual({
      id: null,
      messageId: 'voicemail-progress',
      text: 'In progress',
    });

    await store.fetchVoicemailTranscription({
      id: 'voicemail-missing',
      type: messageTypes.voiceMail,
      vmTranscriptionStatus: 'Completed',
    });
    expect(store.voicemailTranscriptionMap['voicemail-missing']).toBeUndefined();

    await store.fetchVoicemailTranscription({
      id: 'voicemail-invalid-uri',
      type: messageTypes.voiceMail,
      vmTranscriptionStatus: 'Completed',
      attachments: [{
        id: 'transcription-invalid',
        type: 'AudioTranscription',
        uri: 'https://example.com/transcription.txt',
      }],
    });
    expect(store.voicemailTranscriptionMap['voicemail-invalid-uri']).toBeUndefined();

    await store.fetchVoicemailTranscription({
      id: 'voicemail-success',
      type: messageTypes.voiceMail,
      vmTranscriptionStatus: 'Completed',
      attachments: [{
        id: 'transcription-1',
        type: 'AudioTranscription',
        uri: 'https://media.ringcentral.com/transcription.txt',
      }],
    });
    expect(store._testPlatformGet).toHaveBeenCalledWith(
      'https://media.ringcentral.com/transcription.txt',
    );
    expect(store.voicemailTranscriptionMap['voicemail-success']).toEqual({
      id: 'transcription-1',
      messageId: 'voicemail-success',
      text: 'Transcribed voicemail',
    });

    store._testPlatformGet.mockRejectedValueOnce(new Error('download failed'));
    await store.fetchVoicemailTranscription({
      id: 'voicemail-error',
      type: messageTypes.voiceMail,
      vmTranscriptionStatus: 'Completed',
      attachments: [{
        id: 'transcription-2',
        type: 'AudioTranscription',
        uri: 'https://media.ringcentral.biz/transcription.txt',
      }],
    });
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    expect(store.voicemailTranscriptionMap['voicemail-error']).toEqual({
      id: null,
      messageId: 'voicemail-error',
      text: 'Failed to fetch transcription',
    });
  });
});
