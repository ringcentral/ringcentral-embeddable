const { conversationsStatus } = require('@ringcentral-integration/commons/modules/Conversations/conversationsStatus');
const { messageTypes } = require('@ringcentral-integration/commons/enums/messageTypes');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

const { Conversations } = require('../../src/modules/Conversations');

function setValue(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: true,
    writable: true,
    value,
  });
}

function createClient(records = []) {
  const list = jest.fn(async () => ({ records }));
  return {
    list,
    client: {
      account: jest.fn(() => ({
        extension: jest.fn(() => ({
          messageStore: jest.fn(() => ({
            list,
          })),
        })),
      })),
    },
  };
}

function createConversations(overrides = {}) {
  const {
    effectiveSearchString,
    filteredConversations,
    loadingOldConversations = false,
    records,
    ...directOverrides
  } = overrides;
  const { list, client } = createClient(records || []);
  const conversations = Object.create(Conversations.prototype);
  Object.assign(conversations, {
    _daySpan: 7,
    _olderDataExisted: true,
    _olderMessagesExisted: true,
    _perPage: 2,
    currentConversationId: null,
    currentPage: 1,
    fetchConversationsStatus: conversationsStatus.idle,
    ownerFilter: 'Personal',
    searchFilter: 'All',
    typeFilter: messageTypes.text,
    _deps: {
      client,
      contactMatcher: {
        dataMapping: {
          '+16505550100': [{ id: 'self-contact', name: 'Agent Smith' }],
          '+16505550101': [{ id: 'ada-contact', name: 'Ada Lovelace' }],
        },
      },
      conversationLogger: {
        dataMapping: {
          'thread-log-1': [{ id: 'logged-entity' }],
        },
        getLastMatchedCorrespondentEntity: jest.fn(() => ({ id: 'last-entity' })),
        getMessageThreadLogId: jest.fn((thread) => `thread-log-${thread.id.split('-')[1]}`),
        loggingMap: {
          'thread-log-1': true,
        },
      },
      messageStore: {
        hasSharedAccess: true,
        sharedSmsConversations: [{ id: 'shared-source' }],
      },
      messageThreadEntries: {
        saveNewMessages: jest.fn(),
        sync: jest.fn(),
      },
      messageThreads: {
        hasPermission: true,
        sendMessage: jest.fn(async () => ({ id: 'new-message' })),
        sync: jest.fn(),
        threads: [],
      },
    },
    _fetchOldConversationsSuccess: jest.fn(function fetchSuccess(records, increasePage) {
      this.fetchedRecords = records;
      if (increasePage) {
        this.currentPage += 1;
      }
    }),
    _onReplyError: jest.fn(),
    _removeInputContent: jest.fn(),
    _updateConversationStatus: jest.fn(function updateConversationStatus(status) {
      this.conversationStatus = status;
    }),
    _updateFetchConversationsStatus: jest.fn(function updateFetchStatus(status) {
      this.fetchConversationsStatus = status;
      this.loadingOldConversations = status === conversationsStatus.fetching;
    }),
    _updateFetchMessagesStatus: jest.fn(function updateMessageFetchStatus(status) {
      this.fetchMessagesStatus = status;
    }),
    _updateTypeFilter: jest.fn(function updateTypeFilter(type) {
      this.typeFilter = type;
    }),
    loadNextPage: jest.fn(),
    ...directOverrides,
  });
  setValue(conversations, 'filteredConversations', filteredConversations || [
    {
      id: 'personal-unread',
      owner: null,
      unreadCounts: 1,
      conversationMatches: [],
    },
    {
      id: 'shared-logged',
      owner: { id: 'owner-1' },
      unreadCounts: 0,
      conversationMatches: [{ id: 'log-1' }],
    },
    {
      id: 'shared-unlogged',
      owner: { id: 'owner-2' },
      unreadCounts: 0,
      conversationMatches: [],
    },
  ]);
  setValue(conversations, 'effectiveSearchString', effectiveSearchString || '');
  setValue(conversations, 'earliestTime', Date.parse('2026-01-10T00:00:00.000Z'));
  setValue(conversations, 'loadingOldConversations', loadingOldConversations);
  conversations._testList = list;
  return conversations;
}

function createThread(overrides = {}) {
  return {
    id: 'thread-1',
    ownerParty: {
      name: 'Agent',
      phoneNumber: '+16505550100',
    },
    guestParty: {
      name: 'Guest User',
      phoneNumber: '+16505550101',
    },
    messages: [
      { id: 'message-1', subject: 'Body includes renewal' },
    ],
    status: 'Open',
    subject: 'Contract question',
    assignee: null,
    isAssignedToMe: false,
    unreadCounts: 0,
    ...overrides,
  };
}

describe('Conversations module', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('updates type, owner, and search filters while triggering required reloads', async () => {
    const conversations = createConversations();

    await conversations.updateTypeFilter(messageTypes.voiceMail);
    expect(conversations._updateTypeFilter).toHaveBeenCalledWith(messageTypes.voiceMail);
    expect(conversations.searchFilter).toBe('All');
    expect(conversations.fetchConversationsStatus).toBe(conversationsStatus.idle);
    expect(conversations._olderDataExisted).toBe(true);
    expect(conversations._olderMessagesExisted).toBe(true);
    expect(conversations.loadNextPage).toHaveBeenCalled();

    conversations.loadNextPage.mockClear();
    await conversations.updateTypeFilter(messageTypes.voiceMail);
    expect(conversations.loadNextPage).not.toHaveBeenCalled();

    conversations.updateOwnerFilter('Threads');
    expect(conversations.ownerFilter).toBe('Threads');
    expect(conversations.currentPage).toBe(1);
    expect(conversations._deps.messageThreads.sync).toHaveBeenCalled();
    expect(conversations._deps.messageThreadEntries.sync).toHaveBeenCalled();

    conversations.ownerFilter = 'Personal';
    conversations.searchFilter = 'All';
    conversations.loadNextPage.mockClear();
    conversations.updateSearchFilter('UnLogged');
    expect(conversations.searchFilter).toBe('UnLogged');
    expect(conversations.loadNextPage).not.toHaveBeenCalled();

    conversations.searchFilter = 'Unread';
    conversations.loadNextPage.mockClear();
    conversations.updateSearchFilter('All');
    expect(conversations.loadNextPage).toHaveBeenCalled();
  });

  it('filters paging conversations by owner, read state, logging, and thread assignment', () => {
    const conversations = createConversations();

    conversations.ownerFilter = 'Personal';
    conversations.searchFilter = 'All';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'personal-unread',
    ]);

    conversations.ownerFilter = 'Shared';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'shared-logged',
      'shared-unlogged',
    ]);

    conversations.searchFilter = 'Unread';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([]);

    conversations.searchFilter = 'UnLogged';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'shared-unlogged',
    ]);

    setValue(conversations, 'filteredMessageThreads', [
      createThread({
        id: 'thread-open-me',
        assignee: { id: 'agent' },
        isAssignedToMe: true,
      }),
      createThread({
        id: 'thread-open-unassigned',
        assignee: null,
      }),
      createThread({
        id: 'thread-open-other',
        assignee: { id: 'other' },
        isAssignedToMe: false,
      }),
      createThread({
        id: 'thread-resolved',
        status: 'Resolved',
      }),
    ]);
    conversations.ownerFilter = 'Threads';
    conversations.typeFilter = messageTypes.text;
    conversations.searchFilter = 'All';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'thread-open-me',
      'thread-open-unassigned',
    ]);

    conversations.searchFilter = 'Assigned to me';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'thread-open-me',
    ]);
    conversations.searchFilter = 'Unassigned';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'thread-open-unassigned',
    ]);
    conversations.searchFilter = 'Assigned to others';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'thread-open-other',
    ]);
    conversations.searchFilter = 'Resolved';
    expect(conversations.pagingConversations.map((item) => item.id)).toEqual([
      'thread-resolved',
    ]);
  });

  it('builds fetch-old-conversations params and handles success, stale, and error responses', async () => {
    const conversations = createConversations({
      records: [{ id: 'old-1' }, { id: 'old-2' }],
      filteredConversations: [{ id: 'current-1' }],
    });
    conversations.ownerFilter = 'Shared';
    conversations.searchFilter = 'Unread';

    await conversations.fetchOldConversations();

    expect(conversations._testList).toHaveBeenCalledWith(expect.objectContaining({
      distinctConversations: true,
      messageType: [messageTypes.sms, messageTypes.pager],
      owner: 'Shared',
      perPage: 2,
      readStatus: ['Unread'],
    }));
    expect(conversations._olderDataExisted).toBe(true);
    expect(conversations._fetchOldConversationsSuccess).toHaveBeenCalledWith(
      [{ id: 'old-1' }, { id: 'old-2' }],
      true,
    );

    const noMoreConversations = createConversations({ _olderDataExisted: false });
    await noMoreConversations.fetchOldConversations();
    expect(noMoreConversations._testList).not.toHaveBeenCalled();

    const loadingConversations = createConversations({ loadingOldConversations: true });
    await loadingConversations.fetchOldConversations();
    expect(loadingConversations._testList).not.toHaveBeenCalled();

    const threadConversations = createConversations({ ownerFilter: 'Threads' });
    await threadConversations.fetchOldConversations();
    expect(threadConversations._testList).not.toHaveBeenCalled();

    const errorConversations = createConversations();
    errorConversations._testList.mockRejectedValueOnce(new Error('network'));
    await errorConversations.fetchOldConversations();
    expect(errorConversations.fetchConversationsStatus).toBe(conversationsStatus.idle);
  });

  it('formats, searches, and opens message threads', () => {
    const conversations = createConversations();
    conversations._deps.messageThreads.threads = [
      createThread(),
      createThread({
        id: 'thread-2',
        guestParty: {
          name: 'Support Team',
          phoneNumber: '+16505550102',
        },
        messages: [{ id: 'message-2', subject: 'Escalation body' }],
        subject: 'Escalation subject',
      }),
    ];

    const formatted = conversations.formattedMessageThreads;
    expect(formatted[0]).toEqual(expect.objectContaining({
      conversationId: 'thread-1',
      conversationLogId: 'thread-log-1',
      conversationLogMatches: [{ id: 'logged-entity' }],
      correspondentMatches: [{ id: 'ada-contact', name: 'Ada Lovelace' }],
      isLogging: true,
      lastMatchedCorrespondentEntity: { id: 'last-entity' },
      selfMatches: [{ id: 'self-contact', name: 'Agent Smith' }],
      type: 'Thread',
    }));
    expect(conversations.hasSharedSmsAccess).toBe(true);
    expect(conversations.hasMessageThreadsPermission).toBe(true);

    setValue(conversations, 'effectiveSearchString', '');
    expect(conversations.filteredMessageThreads).toHaveLength(2);

    setValue(conversations, 'effectiveSearchString', '+16505550101');
    expect(conversations.filteredMessageThreads.map((item) => item.id)).toEqual(['thread-1']);

    setValue(conversations, 'effectiveSearchString', 'ada');
    expect(conversations.filteredMessageThreads.map((item) => item.id)).toEqual(['thread-1']);

    conversations._deps.contactMatcher.dataMapping = {};
    setValue(conversations, 'effectiveSearchString', 'support');
    expect(conversations.filteredMessageThreads.map((item) => item.id)).toEqual(['thread-2']);

    setValue(conversations, 'effectiveSearchString', 'escalation subject');
    expect(conversations.filteredMessageThreads[0]).toEqual(expect.objectContaining({
      id: 'thread-2',
      matchOrder: 1,
    }));

    setValue(conversations, 'effectiveSearchString', 'renewal');
    expect(conversations.filteredMessageThreads[0]).toEqual(expect.objectContaining({
      id: 'thread-1',
      matchedMessage: { id: 'message-1', subject: 'Body includes renewal' },
    }));

    conversations.currentConversationId = 'thread-1';
    expect(conversations.currentMessageThread).toEqual(expect.objectContaining({
      id: 'thread-1',
      conversationMatches: [{ id: 'logged-entity' }],
      recipients: [expect.objectContaining({ phoneNumber: '+16505550101' })],
      senderNumber: '+16505550100',
    }));

    conversations.currentConversationId = 'missing-thread';
    expect(conversations.currentMessageThread).toBeNull();
  });

  it('resets input and replies to message threads', async () => {
    const conversations = createConversations();
    conversations._deps.messageThreads.threads = [createThread()];
    conversations.currentConversationId = 'thread-1';

    conversations.resetInput();
    expect(conversations._updateConversationStatus).toHaveBeenCalledWith(
      conversationsStatus.idle,
    );
    expect(conversations._removeInputContent).toHaveBeenCalledWith('thread-1');

    await expect(conversations.replyToThread('hello')).resolves.toEqual({
      id: 'new-message',
    });
    expect(conversations._deps.messageThreads.sendMessage).toHaveBeenCalledWith({
      threadId: 'thread-1',
      text: 'hello',
      from: { name: 'Agent', phoneNumber: '+16505550100' },
      to: [{ name: 'Guest User', phoneNumber: '+16505550101' }],
    });
    expect(conversations._deps.messageThreadEntries.saveNewMessages).toHaveBeenCalledWith([
      { id: 'new-message' },
    ]);
    expect(conversations._removeInputContent).toHaveBeenCalledWith('thread-1');

    conversations._deps.messageThreads.sendMessage.mockRejectedValueOnce(new Error('send failed'));
    await expect(conversations.replyToThread('fail')).rejects.toThrow('send failed');
    expect(conversations._onReplyError).toHaveBeenCalled();

    conversations.currentConversationId = 'missing-thread';
    await expect(conversations.replyToThread('ignored')).resolves.toBeUndefined();
  });
});
