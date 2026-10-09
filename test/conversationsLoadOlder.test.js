import { watch } from '@ringcentral-integration/next-core';

import { Conversations } from '../src/app/services/Conversations';

// Every micro-* services path maps to one mock module, so this factory serves
// them all; it only swaps in a base `Conversations` with the state the app
// subclass pages through.
jest.mock('@ringcentral-integration/micro-message/src/app/services', () =>
  mockMicroServices(),
);

function mockMicroServices() {
  class BaseConversations {
    constructor() {
      this._enableLoadOldMessages = true;
      this._hasPermission = true;
      this._perPage = 2;
      this._daySpan = 90;
      this._olderMessagesExisted = true;
      this.effectiveSearchString = '';
      this.readStatusFilterMap = { Text: 'All', VoiceMail: 'All', Fax: 'All' };
      this.typeFilteredConversationsMap = { Text: [], VoiceMail: [], Fax: [] };
      this.oldConversations = [];
      this.currentConversationId = null;
      this.loadingOldMessages = false;
      this.allConversationsMap = new Map();
      this.conversationStore = {};
      this.oldMessages = [];
      this._fetchOldConversationsSuccess = jest.fn();
      this._updateFetchMessagesStatus = jest.fn();
      this._fetchOldMessagesSuccess = jest.fn();
    }

    getMessages(conversationId, withOldMessages = false) {
      return [
        ...(this.conversationStore[conversationId] ?? []),
        ...(withOldMessages ? this.oldMessages : []),
      ];
    }

    onInitOnce() {}

    onReset() {}
  }
  return {
    ...jest.requireActual(
      '@ringcentral-integration/micro-message/src/app/services',
    ),
    Conversations: BaseConversations,
    conversationsStatus: { idle: 'idle', fetching: 'fetching' },
  };
}

const NOW = new Date('2026-10-01T00:00:00.000Z').getTime();
const DAY = 24 * 60 * 60 * 1000;
const iso = (time) => new Date(time).toISOString();

function createConversations({ loggedIn = true, options } = {}) {
  const list = jest.fn(async () => ({ records: [] }));
  const client = {
    account: () => ({ extension: () => ({ messageStore: () => ({ list }) }) }),
  };
  const auth = { loggedIn };
  const conversations = new Conversations(
    {},
    auth,
    client,
    {},
    {},
    {},
    {},
    {},
    undefined,
    undefined,
    options,
  );
  return { conversations, list };
}

const record = (id, daysAgo) => ({
  id,
  conversationId: `conversation-${id}`,
  creationTime: iso(NOW - daysAgo * DAY),
});

describe('Conversations older conversation paging', () => {
  let nowSpy;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('requests the page of text conversations before the oldest one listed', async () => {
    const { conversations, list } = createConversations();
    conversations.typeFilteredConversationsMap.Text = [
      record('1', 1),
      record('2', 5),
    ];
    const records = [record('3', 6), record('4', 8)];
    list.mockImplementation(async () => {
      expect(conversations.olderConversationsLoading.Text).toBe(true);
      return { records };
    });

    await conversations.fetchOlderConversations('Text');

    expect(list).toHaveBeenCalledWith({
      distinctConversations: true,
      perPage: 2,
      dateFrom: iso(NOW - 90 * DAY),
      dateTo: iso(NOW - 5 * DAY),
      messageType: ['SMS', 'Pager'],
    });
    expect(conversations._fetchOldConversationsSuccess).toHaveBeenCalledWith(
      records,
      false,
    );
    expect(conversations.olderConversationsLoading.Text).toBe(false);
  });

  test('pages each tab by its own type and read status filter', async () => {
    const { conversations, list } = createConversations();
    conversations.readStatusFilterMap.Fax = 'Unread';

    await conversations.fetchOlderConversations('Fax');

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        dateTo: iso(NOW),
        messageType: ['Fax'],
        readStatus: ['Unread'],
      }),
    );
  });

  test('looks one day back once the listed conversations pass the day span', async () => {
    const { conversations, list } = createConversations();
    conversations.typeFilteredConversationsMap.VoiceMail = [record('1', 100)];

    await conversations.fetchOlderConversations('VoiceMail');

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: iso(NOW - 101 * DAY),
        dateTo: iso(NOW - 100 * DAY),
      }),
    );
  });

  test('moves further back even when a page only repeats listed conversations', async () => {
    const { conversations, list } = createConversations();
    conversations.typeFilteredConversationsMap.Text = [record('1', 1)];
    list.mockResolvedValueOnce({ records: [record('1', 3), record('1', 4)] });

    await conversations.fetchOlderConversations('Text');
    await conversations.fetchOlderConversations('Text');

    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ dateTo: iso(NOW - 4 * DAY) }),
    );
  });

  test('stops once the server returns a short page', async () => {
    const { conversations, list } = createConversations();
    list.mockResolvedValueOnce({ records: [record('1', 3)] });

    await conversations.fetchOlderConversations('Text');
    await conversations.fetchOlderConversations('Text');

    expect(list).toHaveBeenCalledTimes(1);
  });

  test('keeps paging a read status filter that still has older conversations', async () => {
    const { conversations, list } = createConversations();
    list.mockResolvedValueOnce({ records: [] });

    await conversations.fetchOlderConversations('Text');
    conversations.readStatusFilterMap.Text = 'Unread';
    await conversations.fetchOlderConversations('Text');

    expect(list).toHaveBeenCalledTimes(2);
  });

  test.each([
    [
      'searching',
      ({ conversations }) => {
        conversations.effectiveSearchString = 'john';
      },
    ],
    [
      'loading old messages is disabled',
      ({ conversations }) => {
        conversations._enableLoadOldMessages = false;
      },
    ],
    [
      'messages cannot be read',
      ({ conversations }) => {
        conversations._hasPermission = false;
      },
    ],
    [
      'the tab is already loading',
      ({ conversations }) => {
        conversations.olderConversationsLoading.Text = true;
      },
    ],
  ])('does not request while %s', async (_, arrange) => {
    const context = createConversations();
    arrange(context);

    await context.conversations.fetchOlderConversations('Text');

    expect(context.list).not.toHaveBeenCalled();
  });

  test('does not request before login', async () => {
    const { conversations, list } = createConversations({ loggedIn: false });

    await conversations.fetchOlderConversations('Text');

    expect(list).not.toHaveBeenCalled();
  });

  test('waits before retrying a failed page', async () => {
    const { conversations, list } = createConversations();
    list.mockRejectedValueOnce(new Error('network'));

    await conversations.fetchOlderConversations('Text');
    expect(conversations.olderConversationsLoading.Text).toBe(false);

    await conversations.fetchOlderConversations('Text');
    expect(list).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(NOW + 30 * 1000);
    await conversations.fetchOlderConversations('Text');
    expect(list).toHaveBeenCalledTimes(2);
  });

  test('pages again after the fetched conversations are dropped', async () => {
    const { conversations, list } = createConversations();
    conversations.onInitOnce();
    const [, selectOldConversations, onOldConversationsChange] =
      watch.mock.calls[watch.mock.calls.length - 1];
    list.mockResolvedValueOnce({ records: [] });

    await conversations.fetchOlderConversations('Text');
    expect(selectOldConversations()).toBe(conversations.oldConversations);
    onOldConversationsChange([], [record('1', 3)]);
    await conversations.fetchOlderConversations('Text');

    expect(list).toHaveBeenCalledTimes(2);
  });

  test('clears paging and loading state on reset', async () => {
    const { conversations, list } = createConversations();
    list.mockResolvedValueOnce({ records: [] });
    await conversations.fetchOlderConversations('Text');
    conversations.olderConversationsLoading.Fax = true;

    conversations.onReset();
    await conversations.fetchOlderConversations('Text');

    expect(conversations.olderConversationsLoading).toEqual({
      Text: false,
    });
    expect(list).toHaveBeenCalledTimes(2);
  });
});

describe('Conversations older message paging', () => {
  let nowSpy;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function openConversation(conversations, latestDaysAgo = 120) {
    const conversationId = '9007199254740993';
    conversations.currentConversationId = conversationId;
    conversations.allConversationsMap.set(conversationId, {
      conversationId,
      creationTime: iso(NOW - latestDaysAgo * DAY),
    });
    return conversationId;
  }

  test('loads an empty thread back from its own latest message', async () => {
    const { conversations, list } = createConversations();
    const conversationId = openConversation(conversations);
    const records = [record('1', 120), record('2', 121)];
    list.mockResolvedValueOnce({ records });

    await conversations.fetchOlderMessages();

    const dateTo = NOW - 120 * DAY + 1000;
    expect(list).toHaveBeenCalledWith({
      // Passed as a string: a number loses precision on long ids.
      conversationId,
      perPage: 2,
      dateFrom: iso(dateTo - 90 * DAY),
      dateTo: iso(dateTo),
    });
    expect(conversations._updateFetchMessagesStatus).toHaveBeenCalledWith(
      'fetching',
    );
    expect(conversations._fetchOldMessagesSuccess).toHaveBeenCalledWith(
      records,
    );
    expect(conversations._olderMessagesExisted).toBe(true);
  });

  test('pages back from the oldest message shown', async () => {
    const { conversations, list } = createConversations();
    const conversationId = openConversation(conversations, 1);
    conversations.conversationStore[conversationId] = [record('1', 1)];
    conversations.oldMessages = [record('2', 10)];

    await conversations.fetchOlderMessages();

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ dateTo: iso(NOW - 10 * DAY) }),
    );
  });

  test('stops once the server returns a short page', async () => {
    const { conversations, list } = createConversations();
    openConversation(conversations);
    list.mockResolvedValueOnce({ records: [record('1', 120)] });

    await conversations.fetchOlderMessages();

    expect(conversations._olderMessagesExisted).toBe(false);
  });

  test('drops the page when another conversation opened meanwhile', async () => {
    const { conversations, list } = createConversations();
    openConversation(conversations);
    list.mockImplementationOnce(async () => {
      conversations.currentConversationId = 'other';
      return { records: [record('1', 120)] };
    });

    await conversations.fetchOlderMessages();

    expect(conversations._fetchOldMessagesSuccess).not.toHaveBeenCalled();
    expect(conversations._updateFetchMessagesStatus).toHaveBeenLastCalledWith(
      'idle',
    );
    expect(conversations._olderMessagesExisted).toBe(true);
  });

  test('waits before retrying a failed page', async () => {
    const { conversations, list } = createConversations();
    openConversation(conversations);
    list.mockRejectedValueOnce(new Error('network'));

    await conversations.fetchOlderMessages();
    expect(conversations._updateFetchMessagesStatus).toHaveBeenLastCalledWith(
      'idle',
    );

    await conversations.fetchOlderMessages();
    expect(list).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(NOW + 30 * 1000);
    await conversations.fetchOlderMessages();
    expect(list).toHaveBeenCalledTimes(2);
  });

  test.each([
    [
      'no conversation is open',
      (conversations) => {
        conversations.currentConversationId = null;
      },
    ],
    [
      'the open conversation is unknown',
      (conversations) => {
        conversations.allConversationsMap.clear();
      },
    ],
    [
      'the thread has no older messages',
      (conversations) => {
        conversations._olderMessagesExisted = false;
      },
    ],
    [
      'older messages are already loading',
      (conversations) => {
        conversations.loadingOldMessages = true;
      },
    ],
    [
      'loading old messages is disabled',
      (conversations) => {
        conversations._enableLoadOldMessages = false;
      },
    ],
  ])('does not request when %s', async (_, arrange) => {
    const { conversations, list } = createConversations();
    openConversation(conversations);
    arrange(conversations);

    await conversations.fetchOlderMessages();

    expect(list).not.toHaveBeenCalled();
  });
});
