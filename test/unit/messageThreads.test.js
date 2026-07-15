const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

const { MessageThreadEntries } = require('../../src/modules/MessageThreadEntries/MessageThreadEntries');
const { MessageThreads } = require('../../src/modules/MessageThreads/MessageThreads');

function createResponse(data) {
  return {
    json: jest.fn(async () => data),
  };
}

function createDataFetcher() {
  const dataMap = new Map();
  const timestampMap = new Map();
  return {
    register: jest.fn(),
    getData: jest.fn((source) => dataMap.get(source)),
    getTimestamp: jest.fn((source) => timestampMap.get(source) ?? 0),
    updateData: jest.fn(async (source, data, timestamp = Date.now()) => {
      dataMap.set(source, data);
      timestampMap.set(source, timestamp);
    }),
    setData(source, data, timestamp = Date.now()) {
      dataMap.set(source, data);
      timestampMap.set(source, timestamp);
    },
  };
}

function createPlatform() {
  return {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    send: jest.fn(),
  };
}

function createEntry(overrides = {}) {
  return {
    id: 'entry-1',
    threadId: 'thread-1',
    recordType: 'AliveMessage',
    direction: 'Inbound',
    text: 'hello',
    author: { phoneNumber: '+16505550123', name: 'Customer' },
    guestParty: { phoneNumber: '+16505550123', name: 'Customer' },
    creationTime: '2026-01-01T10:00:00.000Z',
    lastModifiedTime: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

function createThread(overrides = {}) {
  return {
    id: 'thread-1',
    status: 'Open',
    label: '',
    owner: {
      extensionId: 'owner-id',
      phoneNumber: '+16505550100',
      name: 'Owner',
    },
    ownerParty: {
      phoneNumber: '+16505550100',
      name: 'Owner Party',
    },
    guestParty: {
      phoneNumber: '+16505550123',
      name: 'Guest',
    },
    assignee: {
      extensionId: 'owner-id',
    },
    creationTime: '2026-01-01T09:00:00.000Z',
    lastModifiedTime: '2026-01-01T10:05:00.000Z',
    ...overrides,
  };
}

function createBaseDeps() {
  const dataFetcherV2 = createDataFetcher();
  const platform = createPlatform();
  return {
    appFeatures: {
      hasMessageThreadsPermission: true,
      ready: true,
    },
    auth: {
      ownerId: 'owner-id',
    },
    client: {
      service: {
        platform: () => platform,
      },
    },
    dataFetcherV2,
    grantExtensions: {
      smsRecipients: [{ extensionId: 'owner-id' }],
    },
    platform,
    storage: {
      ready: true,
    },
    subscription: {
      message: null,
      subscribe: jest.fn(async () => {}),
    },
    tabManager: {
      active: true,
    },
  };
}

function createEntryModule(deps = createBaseDeps()) {
  const entries = new MessageThreadEntries({
    ...deps,
    messageThreadEntriesOptions: {},
  });
  entries.parentModule = {
    analytics: { track: jest.fn() },
  };
  return entries;
}

function createThreadsModule(deps, messageThreadEntries) {
  const threads = new MessageThreads({
    ...deps,
    alert: {
      warning: jest.fn(),
    },
    messageThreadEntries,
    messageThreadsOptions: {},
  });
  threads.parentModule = {
    analytics: { track: jest.fn() },
  };
  return threads;
}

describe('message thread modules', () => {
  beforeEach(() => {
    setStagedState({});
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('merges entry sync data, read times, and note mutations into the entry store', async () => {
    const deps = createBaseDeps();
    const entries = createEntryModule(deps);
    const source = deps.dataFetcherV2.register.mock.calls[0][0];
    deps.dataFetcherV2.setData(source, {
      store: {
        'thread-1': [createEntry({
          id: 'old-entry',
          creationTime: Date.parse('2026-01-01T09:00:00.000Z'),
          lastModifiedTime: Date.parse('2026-01-01T09:00:00.000Z'),
        })],
      },
      syncInfo: { syncToken: 'old-token' },
    });

    const merged = entries._mergeIntoStoreData([
      createEntry({ id: 'entry-2', direction: 'Outbound' }),
      createEntry({
        id: 'old-entry',
        text: 'updated',
        lastModifiedTime: '2026-01-01T11:00:00.000Z',
      }),
    ]);
    expect(merged['thread-1'].map((entry) => entry.id)).toEqual([
      'old-entry',
      'entry-2',
    ]);
    expect(merged['thread-1'][0].text).toBe('updated');

    const afterDelete = entries._mergeIntoStoreData([
      createEntry({ id: 'old-entry', availability: 'Deleted' }),
    ]);
    expect(afterDelete['thread-1']).toBeUndefined();

    entries.updateReadTimeMap([
      createEntry({
        direction: 'Outbound',
        creationTime: '2026-01-01T12:00:00.000Z',
      }),
    ]);
    expect(entries.lastReadTimeMap['thread-1']).toBeLessThan(
      Date.parse('2026-01-01T12:00:00.000Z'),
    );
    entries.markAsUnread('thread-1', Date.parse('2026-01-01T10:00:00.000Z'));
    expect(entries.lastReadTimeMap['thread-1']).toBe(
      Date.parse('2026-01-01T10:00:00.000Z') - 1,
    );
    entries.clearReadTimeMap(['other-thread']);
    expect(entries.lastReadTimeMap['thread-1']).toBeUndefined();

    deps.platform.post.mockResolvedValueOnce(createResponse({
      id: 'note-1',
      threadId: 'thread-1',
      text: 'note',
      creationTime: '2026-01-01T12:00:00.000Z',
      lastModifiedTime: '2026-01-01T12:00:00.000Z',
    }));
    await expect(entries.createNote('thread-1', 'note')).resolves.toEqual(
      expect.objectContaining({ id: 'note-1', recordType: 'AliveNote' }),
    );
    expect(deps.platform.post).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/message-threads/notes',
      { text: 'note', threadId: 'thread-1' },
    );

    deps.platform.patch.mockResolvedValueOnce(createResponse({
      id: 'note-1',
      threadId: 'thread-1',
      text: 'updated note',
      creationTime: '2026-01-01T12:00:00.000Z',
      lastModifiedTime: '2026-01-01T12:05:00.000Z',
    }));
    await entries.updateNote('note-1', 'updated note');
    expect(deps.platform.patch).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/message-threads/notes/note-1',
      { text: 'updated note' },
    );

    await entries.deleteNote('thread-1', 'note-1');
    expect(deps.platform.send).toHaveBeenCalledWith({
      url: '/restapi/v1.0/account/~/message-threads/notes',
      method: 'DELETE',
      body: { ids: ['note-1'] },
    });
  });

  it('fetches entry sync data with fallback full sync and dispatches entity handlers', async () => {
    const deps = createBaseDeps();
    const entries = createEntryModule(deps);
    const source = deps.dataFetcherV2.register.mock.calls[0][0];
    deps.dataFetcherV2.setData(source, {
      store: {},
      syncInfo: { syncToken: 'expired-token' },
    });
    deps.platform.get
      .mockRejectedValueOnce({ response: { status: 400 } })
      .mockResolvedValueOnce(createResponse({
        records: [createEntry()],
        syncInfo: { syncToken: 'fresh-token' },
      }));
    const handler = jest.fn();
    entries.onEntityUpdated(handler);

    await expect(entries.fetchData()).resolves.toEqual(
      expect.objectContaining({
        syncInfo: { syncToken: 'fresh-token' },
      }),
    );

    expect(deps.platform.get).toHaveBeenNthCalledWith(
      1,
      '/restapi/v1.0/account/~/message-threads/entries/sync',
      { syncType: 'ISync', syncToken: 'expired-token' },
    );
    expect(deps.platform.get).toHaveBeenNthCalledWith(
      2,
      '/restapi/v1.0/account/~/message-threads/entries/sync',
      {
        messageType: 'SMS',
        recordCount: 250,
        scope: 'Accessible',
        syncType: 'FSync',
      },
    );
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'entry-1' }));

    entries.sync = jest.fn();
    entries.markThreadAsRead('thread-1');
    jest.advanceTimersByTime(5000);
    await Promise.resolve();
    expect(entries.lastReadTimeMap['thread-1']).toEqual(expect.any(Number));
    expect(entries.sync).toHaveBeenCalled();
  });

  it('covers alternate entry lifecycle, merge, sync, and read-time branches', async () => {
    const deps = createBaseDeps();
    const entries = createEntryModule(deps);
    const source = deps.dataFetcherV2.register.mock.calls[0][0];

    entries._handleSubscription(null);
    entries._handleSubscription({ event: '/presence' });
    entries.sync = jest.fn();
    entries._handleSubscription({ event: '/restapi/v1.0/account/~/message-threads/entries/sync' });
    expect(entries.sync).toHaveBeenCalled();

    const noSubscriptionDeps = createBaseDeps();
    noSubscriptionDeps.subscription = undefined;
    const noSubscriptionEntries = createEntryModule(noSubscriptionDeps);
    expect(() => noSubscriptionEntries.onInit()).not.toThrow();

    const noPermissionDeps = createBaseDeps();
    noPermissionDeps.grantExtensions.smsRecipients = [];
    const noPermissionEntries = createEntryModule(noPermissionDeps);
    noPermissionEntries.sync = jest.fn();
    noPermissionEntries.onInit();
    await noPermissionEntries._sync();
    expect(noPermissionEntries.sync).not.toHaveBeenCalled();

    deps.dataFetcherV2.setData(source, {
      store: {
        'thread-1': [
          createEntry({
            id: 'entry-1',
            creationTime: Date.parse('2026-01-01T10:00:00.000Z'),
            lastModifiedTime: Date.parse('2026-01-01T10:00:00.000Z'),
          }),
        ],
      },
      syncInfo: {},
    });
    expect(entries._mergeIntoStoreData([], false)).toEqual({
      'thread-1': [expect.objectContaining({ id: 'entry-1' })],
    });
    const unchangedStore = entries._mergeIntoStoreData([
      createEntry({
        id: 'entry-1',
        creationTime: undefined,
        lastModifiedTime: '2026-01-01T09:00:00.000Z',
      }),
      createEntry({
        id: 'missing-delete',
        availability: 'Deleted',
      }),
    ], false);
    expect(unchangedStore['thread-1'][0].id).toBe('entry-1');

    const createdWithoutCreationTime = entries._mergeIntoStoreData([
      createEntry({
        id: 'entry-no-creation',
        creationTime: undefined,
        lastModifiedTime: '2026-01-01T12:00:00.000Z',
      }),
    ], false);
    expect(createdWithoutCreationTime['thread-1']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'entry-no-creation',
          creationTime: Date.parse('2026-01-01T12:00:00.000Z'),
        }),
      ]),
    );

    deps.platform.get.mockRejectedValueOnce(new Error('entry sync failed'));
    await expect(entries._syncData()).rejects.toThrow('entry sync failed');
    deps.platform.get.mockImplementationOnce(async () => {
      deps.auth.ownerId = 'owner-after-entry-sync';
      throw new Error('entry owner changed');
    });
    await expect(entries._syncData()).resolves.toBeUndefined();
    deps.auth.ownerId = 'owner-id';

    entries._syncPromise = Promise.resolve({
      store: {},
      syncInfo: { syncToken: 'pending-entry-token' },
    });
    await expect(entries.fetchData()).resolves.toEqual({
      store: {},
      syncInfo: { syncToken: 'pending-entry-token' },
    });
    entries._syncPromise = null;
    deps.tabManager.active = false;
    await expect(entries._sync()).resolves.toBeUndefined();
    deps.tabManager.active = true;

    entries.lastReadTimeMap = {
      'thread-1': Date.parse('2026-01-01T13:00:00.000Z'),
      stale: Date.parse('2026-01-01T09:00:00.000Z'),
    };
    entries.updateReadTimeMap([
      createEntry({
        direction: 'Outbound',
        creationTime: '2026-01-01T12:00:00.000Z',
      }),
      createEntry({
        direction: 'Inbound',
        creationTime: '2026-01-01T14:00:00.000Z',
      }),
    ]);
    expect(entries.lastReadTimeMap['thread-1']).toBe(
      Date.parse('2026-01-01T13:00:00.000Z'),
    );
    entries.clearReadTimeMap(['thread-1']);
    expect(entries.lastReadTimeMap.stale).toBeUndefined();
    entries.sync = jest.fn();
    entries.triggerSyncWithTimeout();
    entries.triggerSyncWithTimeout();
    jest.advanceTimersByTime(5000);
    expect(entries.sync).toHaveBeenCalledTimes(1);

    entries.saveNewMessages([
      createEntry({
        id: 'saved-message',
        direction: 'Inbound',
      }),
    ]);
    expect(deps.dataFetcherV2.getData(source).store['thread-1']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'saved-message' }),
      ]),
    );
    await entries.deleteNote('missing-thread', 'missing-note');
    expect(deps.dataFetcherV2.getData(source).store['missing-thread']).toEqual([]);

    const entityHandler = jest.fn();
    expect(() => entries.onEntityUpdated(null)).not.toThrow();
    entries.onEntityUpdated(entityHandler);
    entries._dispatchEntityHandlers([createEntry({ id: 'entity-branch' })]);
    expect(entityHandler).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'entity-branch' }),
    );
    const stopWatching = jest.fn();
    entries._stopWatching = stopWatching;
    entries.onReset();
    expect(stopWatching).toHaveBeenCalled();
    expect(entries._stopWatching).toBeNull();
  });

  it('formats threads with entries, unread counts, assignment state, and permissions', () => {
    const deps = createBaseDeps();
    const entries = createEntryModule(deps);
    const threads = createThreadsModule(deps, entries);
    const entrySource = deps.dataFetcherV2.register.mock.calls[0][0];
    const threadSource = deps.dataFetcherV2.register.mock.calls[1][0];
    deps.dataFetcherV2.setData(entrySource, {
      store: {
        'thread-1': [
          createEntry({
            id: 'message-1',
            creationTime: Date.parse('2026-01-01T10:00:00.000Z'),
            lastModifiedTime: Date.parse('2026-01-01T10:00:00.000Z'),
          }),
          createEntry({
            id: 'note-1',
            recordType: 'AliveNote',
            text: 'internal note',
            creationTime: Date.parse('2026-01-01T10:01:00.000Z'),
            lastModifiedTime: Date.parse('2026-01-01T10:01:00.000Z'),
          }),
        ],
      },
      syncInfo: {},
    });
    entries.lastReadTimeMap = {
      'thread-1': Date.parse('2026-01-01T09:00:00.000Z'),
    };
    deps.dataFetcherV2.setData(threadSource, {
      records: [createThread()],
      syncInfo: {},
    });

    expect(threads.hasPermission).toBe(true);
    expect(threads.threads[0]).toEqual(
      expect.objectContaining({
        id: 'thread-1',
        direction: 'Inbound',
        from: expect.objectContaining({ phoneNumber: '+16505550123' }),
        isAssignedToMe: true,
        notes: [expect.objectContaining({ id: 'note-1' })],
        subject: 'hello',
        unreadCounts: 2,
      }),
    );
    expect(threads.unreadCounts).toBe(2);

    const noPermissionDeps = createBaseDeps();
    noPermissionDeps.grantExtensions.smsRecipients = [];
    const noPermissionEntries = createEntryModule(noPermissionDeps);
    const noPermissionThreads = createThreadsModule(
      noPermissionDeps,
      noPermissionEntries,
    );
    expect(noPermissionThreads.unreadCounts).toBe(0);
  });

  it('syncs, assigns, resolves, loads, sends, notes, and marks message threads', async () => {
    const deps = createBaseDeps();
    const entries = createEntryModule(deps);
    const threads = createThreadsModule(deps, entries);
    const threadSource = deps.dataFetcherV2.register.mock.calls[1][0];
    deps.dataFetcherV2.setData(threadSource, {
      records: [createThread()],
      syncInfo: { syncToken: 'thread-token' },
    });
    const handler = jest.fn();
    threads.onThreadUpdated(handler);

    deps.platform.get
      .mockRejectedValueOnce({ response: { status: 400 } })
      .mockResolvedValueOnce(createResponse({
        records: [createThread({ id: 'thread-2' })],
        syncInfo: { syncToken: 'fresh-thread-token' },
      }));
    await threads.fetchData();
    expect(deps.platform.get).toHaveBeenNthCalledWith(
      1,
      '/restapi/v1.0/account/~/message-threads/sync',
      { syncType: 'ISync', syncToken: 'thread-token' },
    );
    expect(deps.platform.get).toHaveBeenNthCalledWith(
      2,
      '/restapi/v1.0/account/~/message-threads/sync',
      { syncType: 'FSync' },
    );
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: 'thread-2' }));

    deps.platform.post.mockResolvedValueOnce(createResponse(createThread({
      id: 'thread-1',
      assignee: { extensionId: 'other-id' },
      lastModifiedTime: '2026-01-01T11:00:00.000Z',
    })));
    await expect(
      threads.assign('thread-1', { extensionId: 'other-id' }),
    ).resolves.toEqual(expect.objectContaining({ id: 'thread-1' }));
    expect(deps.platform.post).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/message-threads/thread-1/assign',
      { assignee: { extensionId: 'other-id' } },
    );

    deps.platform.post.mockResolvedValueOnce(createResponse(createThread({
      id: 'thread-1',
      status: 'Closed',
      lastModifiedTime: '2026-01-01T12:00:00.000Z',
    })));
    await threads.resolve('thread-1');
    expect(deps.platform.post).toHaveBeenCalledWith(
      '/restapi/v1.0/account/~/message-threads/thread-1/resolve',
    );

    deps.platform.post.mockResolvedValueOnce(createResponse({
      id: 'entry-new',
      text: 'new message',
    }));
    await expect(
      threads.sendMessage({
        threadId: 'thread-1',
        text: 'new message',
        from: { phoneNumber: '+16505550100' },
        to: [{ phoneNumber: '+16505550123' }],
      }),
    ).resolves.toEqual(expect.objectContaining({
      id: 'entry-new',
      recordType: 'AliveMessage',
    }));

    deps.platform.get.mockResolvedValueOnce(createResponse(createThread({
      id: 'loaded-thread',
    })));
    await expect(threads.loadThread('loaded-thread')).resolves.toEqual(
      expect.objectContaining({ id: 'loaded-thread' }),
    );

    entries.createNote = jest.fn(async () => ({ id: 'note-created' }));
    entries.updateNote = jest.fn(async () => ({ id: 'note-updated' }));
    entries.deleteNote = jest.fn(async () => {});
    await expect(threads.createNote('thread-1', 'note')).resolves.toEqual({
      id: 'note-created',
    });
    await expect(threads.updateNote('note-1', 'note')).resolves.toEqual({
      id: 'note-updated',
    });
    await expect(threads.deleteNote('thread-1', 'note-1')).resolves.toBeUndefined();

    entries.markAsUnread = jest.fn();
    deps.dataFetcherV2.setData(threadSource, {
      records: [createThread({ assignee: null })],
      syncInfo: {},
    });
    deps.dataFetcherV2.setData(deps.dataFetcherV2.register.mock.calls[0][0], {
      store: {
        'thread-1': [createEntry({
          direction: 'Inbound',
          creationTime: Date.parse('2026-01-01T10:00:00.000Z'),
          lastModifiedTime: Date.parse('2026-01-01T10:00:00.000Z'),
        })],
      },
    });
    entries.lastReadTimeMap = {
      'thread-1': Date.parse('2026-01-01T11:00:00.000Z'),
    };
    threads.markAsUnread('thread-1');
    expect(entries.markAsUnread).toHaveBeenCalledWith(
      'thread-1',
      Date.parse('2026-01-01T10:00:00.000Z'),
    );
  });

  it('covers alternate thread lifecycle, sync, formatting, and failure branches', async () => {
    const deps = createBaseDeps();
    const entries = createEntryModule(deps);
    const threads = createThreadsModule(deps, entries);
    const entrySource = deps.dataFetcherV2.register.mock.calls[0][0];
    const threadSource = deps.dataFetcherV2.register.mock.calls[1][0];

    threads._handleSubscription(null);
    threads._handleSubscription({ event: '/presence' });
    threads.sync = jest.fn();
    threads._handleSubscription({ event: '/restapi/v1.0/account/~/message-threads/sync' });
    expect(threads.sync).toHaveBeenCalled();

    const noSubscriptionDeps = createBaseDeps();
    noSubscriptionDeps.subscription = undefined;
    const noSubscriptionEntries = createEntryModule(noSubscriptionDeps);
    const noSubscriptionThreads = createThreadsModule(
      noSubscriptionDeps,
      noSubscriptionEntries,
    );
    expect(() => noSubscriptionThreads.onInit()).not.toThrow();

    const noPermissionDeps = createBaseDeps();
    noPermissionDeps.appFeatures.hasMessageThreadsPermission = false;
    const noPermissionEntries = createEntryModule(noPermissionDeps);
    const noPermissionThreads = createThreadsModule(
      noPermissionDeps,
      noPermissionEntries,
    );
    noPermissionThreads.sync = jest.fn();
    noPermissionThreads.onInit();
    await noPermissionThreads._sync();
    expect(noPermissionThreads.sync).not.toHaveBeenCalled();

    deps.dataFetcherV2.setData(threadSource, {
      records: [createThread({
        id: 'thread-1',
        lastModifiedTime: Date.parse('2026-01-01T10:00:00.000Z'),
      })],
      syncInfo: {},
    });
    expect(threads._mergeData([], false)).toEqual([
      expect.objectContaining({ id: 'thread-1' }),
    ]);
    expect(threads._mergeData([
      createThread({
        id: 'missing-delete',
        availability: 'Deleted',
      }),
      createThread({
        id: 'thread-1',
        lastModifiedTime: '2026-01-01T09:00:00.000Z',
      }),
    ], false)).toEqual([
      expect.objectContaining({ id: 'thread-1' }),
    ]);

    deps.platform.get.mockRejectedValueOnce(new Error('sync failed'));
    await expect(threads._syncData()).rejects.toThrow('sync failed');
    deps.platform.get.mockImplementationOnce(async () => {
      deps.auth.ownerId = 'owner-id-after';
      throw new Error('owner changed');
    });
    await expect(threads._syncData()).resolves.toBeUndefined();
    deps.auth.ownerId = 'owner-id';

    threads._syncPromise = Promise.resolve({
      records: [],
      syncInfo: { syncToken: 'pending-token' },
    });
    await expect(threads.fetchData()).resolves.toEqual({
      records: [],
      syncInfo: { syncToken: 'pending-token' },
    });
    threads._syncPromise = null;
    deps.tabManager.active = false;
    await expect(threads._sync()).resolves.toBeUndefined();
    deps.tabManager.active = true;

    deps.dataFetcherV2.setData(entrySource, {
      store: {
        'closed-thread': [
          createEntry({
            id: 'outbound-message',
            direction: 'Outbound',
            creationTime: Date.parse('2026-01-01T10:00:00.000Z'),
            lastModifiedTime: Date.parse('2026-01-01T10:00:00.000Z'),
          }),
        ],
        'unassigned-thread': [],
        'assigned-other-thread': [],
      },
      syncInfo: {},
    });
    entries.lastReadTimeMap = {
      'closed-thread': Date.parse('2026-01-01T09:00:00.000Z'),
      'unassigned-thread': Date.parse('2026-01-01T09:00:00.000Z'),
      'assigned-other-thread': Date.parse('2026-01-01T09:00:00.000Z'),
    };
    deps.dataFetcherV2.setData(threadSource, {
      records: [
        createThread({
          id: 'closed-thread',
          status: 'Closed',
          label: 'Closed label',
        }),
        createThread({
          id: 'unassigned-thread',
          assignee: null,
          lastModifiedTime: Date.parse('2026-01-01T10:05:00.000Z'),
        }),
        createThread({
          id: 'assigned-other-thread',
          assignee: { extensionId: 'other-owner' },
          lastModifiedTime: Date.parse('2026-01-01T10:06:00.000Z'),
        }),
      ],
      syncInfo: {},
    });
    const formattedThreads = threads.threads;
    expect(formattedThreads.find((thread) => thread.id === 'closed-thread')).toEqual(
      expect.objectContaining({
        direction: 'Outbound',
        subject: 'Closed label',
        unreadCounts: 0,
      }),
    );
    expect(formattedThreads.find((thread) => thread.id === 'unassigned-thread')).toEqual(
      expect.objectContaining({
        unreadCounts: 1,
      }),
    );

    threads.setBusy(true);
    await expect(threads.assign('thread-1', null)).resolves.toBeNull();
    await expect(threads.resolve('thread-1')).resolves.toBeNull();
    await expect(threads.createNote('thread-1', 'note')).resolves.toBeUndefined();
    await expect(threads.updateNote('note-1', 'note')).resolves.toBeUndefined();
    await expect(threads.deleteNote('thread-1', 'note-1')).resolves.toBeUndefined();
    threads.setBusy(false);

    deps.platform.post.mockRejectedValueOnce(new Error('assign failed'));
    await expect(threads.assign('thread-1', null)).resolves.toBeNull();
    expect(threads._deps.alert.warning).toHaveBeenCalledWith({
      message: 'messageThreadAssignFailed',
    });
    deps.platform.post.mockRejectedValueOnce(new Error('resolve failed'));
    await expect(threads.resolve('thread-1')).resolves.toBeNull();
    expect(threads._deps.alert.warning).toHaveBeenCalledWith({
      message: 'messageThreadResolveFailed',
    });

    deps.platform.post.mockResolvedValueOnce(createResponse({ id: 'new-thread-message' }));
    await threads.sendMessage({
      text: 'new thread',
      from: { phoneNumber: '+16505550100' },
      to: [{ phoneNumber: '+16505550123' }],
    });
    expect(deps.platform.post).toHaveBeenLastCalledWith(
      '/restapi/v1.0/account/~/message-threads/messages',
      {
        text: 'new thread',
        from: { phoneNumber: '+16505550100' },
        to: [{ phoneNumber: '+16505550123' }],
      },
    );
    deps.platform.post.mockResolvedValueOnce(createResponse({ id: 'closed-message' }));
    await threads.sendMessage({
      threadId: 'closed-thread',
      text: 'closed thread',
      from: { phoneNumber: '+16505550100' },
      to: [{ phoneNumber: '+16505550123' }],
    });
    expect(deps.platform.post).toHaveBeenLastCalledWith(
      '/restapi/v1.0/account/~/message-threads/messages',
      expect.not.objectContaining({ threadId: 'closed-thread' }),
    );

    await expect(threads.loadThread('closed-thread')).resolves.toEqual(
      expect.objectContaining({ id: 'closed-thread' }),
    );
    deps.platform.get.mockRejectedValueOnce(new Error('load failed'));
    await expect(threads.loadThread('missing-thread')).resolves.toBeNull();

    entries.createNote = jest.fn(async () => {
      throw new Error('create note failed');
    });
    entries.updateNote = jest.fn(async () => {
      throw new Error('update note failed');
    });
    entries.deleteNote = jest.fn(async () => {
      throw new Error('delete note failed');
    });
    await expect(threads.createNote('thread-1', 'note')).resolves.toBeNull();
    await expect(threads.updateNote('note-1', 'note')).resolves.toBeNull();
    await expect(threads.deleteNote('thread-1', 'note-1')).resolves.toBeNull();
    expect(threads._deps.alert.warning).toHaveBeenCalledWith({
      message: 'messageThreadCreateNoteFailed',
    });
    expect(threads._deps.alert.warning).toHaveBeenCalledWith({
      message: 'messageThreadUpdateNoteFailed',
    });
    expect(threads._deps.alert.warning).toHaveBeenCalledWith({
      message: 'messageThreadDeleteNoteFailed',
    });

    entries.markAsUnread = jest.fn();
    entries.lastReadTimeMap = {
      ...entries.lastReadTimeMap,
      'unassigned-thread': Date.parse('2026-01-01T11:00:00.000Z'),
    };
    threads.markAsUnread('unassigned-thread');
    expect(entries.markAsUnread).toHaveBeenCalledWith(
      'unassigned-thread',
      Date.parse('2026-01-01T10:05:00.000Z'),
    );
    threads.markAsUnread('assigned-other-thread');
    expect(threads._deps.alert.warning).toHaveBeenCalledWith({
      message: 'messageThreadMarkAsUnreadFailed',
    });
    expect(() => threads.onThreadUpdated(null)).not.toThrow();
  });
});
