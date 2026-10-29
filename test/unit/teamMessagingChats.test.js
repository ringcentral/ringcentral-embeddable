import { Subject } from 'rxjs';

import { TeamMessagingChats } from '../../src/app/services/TeamMessaging/TeamMessagingChats';

// Every micro-* services path maps to one mock module, so this factory serves
// them all; it adds a minimal data fetcher consumer backed by the stub
// `DataFetcher` each test passes in.
jest.mock('@ringcentral-integration/micro-auth/src/app/services', () =>
  mockMicroServices(),
);

function mockMicroServices() {
  const { RcModule } = require('@ringcentral-integration/next-core');
  class DataFetcherConsumer extends RcModule {
    constructor(dataFetcher) {
      super();
      this._dataFetcher = dataFetcher;
    }

    get data() {
      return this._dataFetcher.getData(this._source);
    }

    updateData(data) {
      this._dataFetcher.updateData(this._source, data, Date.now());
    }

    onInitOnce() {}
  }
  class DataSource {
    constructor(props) {
      this.props = props;
      this.key = props.key;
    }
  }
  return {
    ...jest.requireActual(
      '@ringcentral-integration/micro-auth/src/app/services',
    ),
    DataFetcherConsumer,
    DataSource,
  };
}

const MY_ID = 'me';
const API = '/team-messaging/v1';
const NOW = Date.UTC(2026, 9, 1, 12);
const HOUR = 60 * 60 * 1000;

const jsonResponse = (body) => ({ json: jest.fn(async () => body) });

const chat = (id, extra = {}) => ({
  id,
  type: 'Team',
  name: `Team ${id}`,
  lastModifiedTime: new Date(NOW - HOUR).toISOString(),
  ...extra,
});

const post = (id, time, extra = {}) => ({
  id,
  creatorId: 'other',
  text: id,
  creationTime: new Date(time).toISOString(),
  ...extra,
});

const flush = async (times = 10) => {
  for (let i = 0; i < times; i += 1) {
    // Let timers and promise chains settle.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

function createChats({
  hasGlipPermission = true,
  teamMessagingAvailable = true,
  chats = null,
  favoriteChats = [],
  subscription,
  options = { preloadPostsDelay: 0 },
} = {}) {
  const calls = [];
  const platform = {
    get: jest.fn(async () => jsonResponse({ records: [] })),
    post: jest.fn(async () => jsonResponse({})),
  };
  const dataFetcher = {
    data: chats,
    register: jest.fn(),
    getData: jest.fn(() => dataFetcher.data),
    updateData: jest.fn((_source, data) => {
      dataFetcher.data = data;
    }),
    fetchData: jest.fn(async () => {}),
  };
  const persons = {
    personsMap: {},
    loadPersons: jest.fn(async () => {
      calls.push('loadPersons');
    }),
  };
  const posts = {
    postsMap: {},
    readTimeMap: {},
    newPost$: new Subject(),
    loadPosts: jest.fn(async (chatId) => {
      calls.push(`loadPosts:${chatId}`);
    }),
    fetchPosts: jest.fn(async (chatId) => {
      calls.push(`fetchPosts:${chatId}`);
    }),
    markRead: jest.fn(async (chatId) => {
      calls.push(`markRead:${chatId}`);
    }),
    seedReadTime: jest.fn(),
  };
  const favorites = {
    favoriteChats,
    fetchFavorites: jest.fn(async () => {}),
    isFavorite: jest.fn((chatId) =>
      favorites.favoriteChats.some(({ id }) => id === chatId),
    ),
    setFavorite: jest.fn(async ({ chat: { id } }) => ({ ok: true, id })),
  };
  platform.get.mockImplementation(async (path) => {
    calls.push(`get:${path}`);
    return jsonResponse({ records: [] });
  });
  const service = new TeamMessagingChats(
    { ownerId: MY_ID },
    { service: { platform: () => platform } },
    dataFetcher,
    { hasGlipPermission, ready: true },
    { features: { TeamMessaging: { available: teamMessagingAvailable } } },
    persons,
    posts,
    favorites,
    undefined,
    subscription,
    options,
  );
  return {
    service,
    platform,
    dataFetcher,
    persons,
    posts,
    favorites,
    calls,
  };
}

const ids = (items) => items.map(({ id }) => id);

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TeamMessagingChats data source', () => {
  it('registers a chat data source checked by the Glip permission', () => {
    const { service, dataFetcher } = createChats({
      options: { ttl: 1234 },
    });

    expect(dataFetcher.register).toHaveBeenCalledWith(service._source);
    expect(service._source.props).toEqual(
      expect.objectContaining({
        key: 'teamMessagingChats',
        cleanOnReset: true,
        ttl: 1234,
      }),
    );
    expect(service._source.props.permissionCheckFunction()).toBe(true);
    expect(service._source.props.readyCheckFunction()).toBe(true);
  });

  it('fetches recent chats, then preloads members and posts', async () => {
    const { service, platform, persons, posts, favorites } = createChats({
      options: { preloadChatCount: 2, preloadPostsDelay: 0 },
    });
    const records = [
      chat('c1', { type: 'Direct', members: [{ id: MY_ID }, { id: 'u1' }] }),
      chat('c2', { type: 'Team', members: [{ id: 'u2' }] }),
      chat('c3', { type: 'Group', members: [{ id: 'u3' }] }),
    ];
    platform.get.mockResolvedValueOnce(jsonResponse({ records }));

    await expect(service._source.props.fetchFunction()).resolves.toEqual(
      records,
    );
    expect(platform.get).toHaveBeenCalledWith(`${API}/recent/chats`, {
      recordCount: 250,
    });
    await flush();

    expect(favorites.fetchFavorites).toHaveBeenCalled();
    // Team members are not preloaded with the list.
    expect(persons.loadPersons).toHaveBeenCalledWith([
      MY_ID,
      MY_ID,
      'u1',
      'u3',
    ]);
    expect(posts.seedReadTime).toHaveBeenCalledWith('c1', NOW - 2 * HOUR);
    expect(posts.loadPosts.mock.calls.map(([id]) => id)).toEqual(['c1', 'c2']);
    expect(posts.fetchPosts).not.toHaveBeenCalled();
  });

  it('treats an account without a team messaging company as no chats', async () => {
    const { service, platform } = createChats();
    platform.get.mockRejectedValueOnce(
      new Error('Company associated with RC account is not found'),
    );

    await expect(service._source.props.fetchFunction()).resolves.toEqual([]);
    await flush();
  });

  it('rethrows other chat list errors', async () => {
    const { service, platform } = createChats();
    platform.get.mockRejectedValueOnce(new Error('network'));

    await expect(service._source.props.fetchFunction()).rejects.toThrow(
      'network',
    );
  });

  it('refetches preloaded posts when forced', async () => {
    const { service, dataFetcher, platform, posts } = createChats({
      options: { preloadChatCount: 1, preloadPostsDelay: 0 },
    });
    dataFetcher.fetchData.mockImplementation(() =>
      service._source.props.fetchFunction(),
    );
    platform.get.mockResolvedValueOnce(
      jsonResponse({ records: [chat('c1'), chat('c2')] }),
    );

    await service.fetchChats({ forcePreload: true });
    await flush();

    expect(dataFetcher.fetchData).toHaveBeenCalledWith(service._source);
    expect(posts.fetchPosts).toHaveBeenCalledWith('c1');
    expect(posts.loadPosts).not.toHaveBeenCalled();
  });

  it('logs a failed chat list fetch', async () => {
    const { service, dataFetcher } = createChats();
    dataFetcher.fetchData.mockRejectedValueOnce(new Error('network'));

    await service.fetchChats();

    expect(service.logger.error).toHaveBeenCalledWith(
      'load team messaging chats failed',
      expect.any(Error),
    );
  });

  it('preloads a cached list on init once per session', async () => {
    const { service, posts } = createChats({
      chats: [chat('c1')],
    });

    service.onInit();
    await flush();
    service.onInit();
    await flush();

    expect(posts.loadPosts).toHaveBeenCalledTimes(1);

    service.onReset();
    service.onInit();
    await flush();
    expect(posts.loadPosts).toHaveBeenCalledTimes(2);
  });
});

describe('TeamMessagingChats setCurrentChat', () => {
  it('only clears the current chat with null', async () => {
    const { service, posts } = createChats();
    service.currentChatId = 'c1';

    await service.setCurrentChat(null);

    expect(service.currentChatId).toBeNull();
    expect(posts.loadPosts).not.toHaveBeenCalled();
  });

  it('loads posts and marks read before loading Team members from the legacy group', async () => {
    const { service, platform, persons, calls, dataFetcher } = createChats({
      chats: [chat('c1'), chat('c2')],
    });
    platform.get.mockImplementationOnce(async (path) => {
      calls.push(`get:${path}`);
      return jsonResponse({ id: 'c2', members: ['u1', 'u2'] });
    });

    await service.setCurrentChat('c2');

    expect(service.currentChatId).toBe('c2');
    expect(calls).toEqual([
      'loadPosts:c2',
      'markRead:c2',
      'get:/restapi/v1.0/glip/groups/c2',
      'loadPersons',
    ]);
    expect(persons.loadPersons).toHaveBeenCalledWith(['u1', 'u2']);
    // The members stay on the chat until the list reloads.
    expect(dataFetcher.data[0]).toEqual({
      ...chat('c2'),
      members: [{ id: 'u1' }, { id: 'u2' }],
    });
  });

  it('caps the member profiles loaded for a large chat', async () => {
    const { service, platform, persons } = createChats({
      chats: [chat('everyone', { type: 'Everyone' })],
    });
    const members = Array.from({ length: 450 }, (_, i) => `u${i}`);
    platform.get.mockResolvedValueOnce(jsonResponse({ members }));

    await service.setCurrentChat('everyone');

    expect(persons.loadPersons).toHaveBeenCalledWith(members.slice(0, 300));
  });

  it('uses the members a chat already has', async () => {
    const { service, platform, persons } = createChats({
      chats: [chat('c1', { type: 'Direct', members: [{ id: 'u1' }] })],
    });

    await service.setCurrentChat('c1');

    expect(platform.get).not.toHaveBeenCalled();
    expect(persons.loadPersons).toHaveBeenCalledWith(['u1']);
  });

  it('uses the members of a favorite chat that is not recent', async () => {
    const { service, platform, persons } = createChats({
      chats: [],
      favoriteChats: [chat('fav', { members: [{ id: 'u9' }] })],
    });

    await service.setCurrentChat('fav');

    expect(platform.get).not.toHaveBeenCalled();
    expect(persons.loadPersons).toHaveBeenCalledWith(['u9']);
  });

  it('does not save members of a chat missing from the list', async () => {
    const { service, platform, persons, dataFetcher } = createChats({
      chats: [],
    });
    platform.get.mockResolvedValueOnce(jsonResponse({ members: ['u1'] }));

    await service.setCurrentChat('unknown');

    expect(persons.loadPersons).toHaveBeenCalledWith(['u1']);
    expect(dataFetcher.updateData).not.toHaveBeenCalled();
  });

  it('logs a failed member request and loads no members', async () => {
    const { service, platform, persons } = createChats({ chats: [chat('c1')] });
    platform.get.mockRejectedValueOnce(new Error('network'));

    await service.setCurrentChat('c1');

    expect(service.logger.error).toHaveBeenCalledWith(
      'load team messaging chat members failed',
      expect.any(Error),
    );
    expect(persons.loadPersons).toHaveBeenCalledWith([]);
  });

  it('marks a new post in the open chat read', () => {
    const { service, posts } = createChats();
    service.onInitOnce();
    service.currentChatId = 'c1';

    posts.newPost$.next(post('p1', NOW, { groupId: 'c2' }));
    expect(posts.markRead).not.toHaveBeenCalled();

    posts.newPost$.next(post('p2', NOW, { groupId: 'c1' }));
    expect(posts.markRead).toHaveBeenCalledWith('c1');
  });

  it('clears the current chat on reset', () => {
    const { service } = createChats();
    service.currentChatId = 'c1';

    service.onReset();

    expect(service.currentChatId).toBeNull();
  });
});

describe('TeamMessagingChats conversations and teams', () => {
  it('opens a conversation and puts it first in the list', async () => {
    const { service, platform, persons, dataFetcher } = createChats({
      chats: [chat('c1')],
    });
    const conversation = {
      id: 'conv',
      type: 'Group',
      members: [{ id: MY_ID }, { id: 'u1' }, { id: 'u2' }],
    };
    platform.post.mockResolvedValueOnce(jsonResponse(conversation));

    await expect(service.openConversation(['u1', 'u2'])).resolves.toEqual({
      ok: true,
      id: 'conv',
    });

    expect(platform.post).toHaveBeenCalledWith(`${API}/conversations`, {
      members: [{ id: 'u1' }, { id: 'u2' }],
    });
    expect(ids(dataFetcher.data)).toEqual(['conv', 'c1']);
    expect(persons.loadPersons).toHaveBeenCalledWith([MY_ID, 'u1', 'u2']);
  });

  it('moves an existing conversation first, merged', async () => {
    const { service, platform, dataFetcher } = createChats({
      chats: [chat('c1'), chat('conv', { name: 'Old' })],
    });
    platform.post.mockResolvedValueOnce(
      jsonResponse({ id: 'conv', type: 'Direct' }),
    );

    await service.openConversation(['u1']);

    expect(ids(dataFetcher.data)).toEqual(['conv', 'c1']);
    expect(dataFetcher.data[0]).toEqual(
      expect.objectContaining({ name: 'Old', type: 'Direct' }),
    );
  });

  it('reports a failed conversation', async () => {
    const { service, platform } = createChats({ chats: [] });
    platform.post.mockRejectedValueOnce(new Error('network'));

    await expect(service.openConversation(['u1'])).resolves.toEqual({
      ok: false,
    });
    expect(service.logger.error).toHaveBeenCalledWith(
      'open team messaging conversation failed',
      expect.any(Error),
    );
  });

  it('creates a public team with members by email', async () => {
    const { service, platform, dataFetcher } = createChats({ chats: [] });
    platform.post.mockResolvedValueOnce(jsonResponse(chat('team')));

    await expect(
      service.createTeam({
        name: 'New team',
        emails: ['a@example.com', 'b@example.com'],
      }),
    ).resolves.toEqual({ ok: true, id: 'team' });

    expect(platform.post).toHaveBeenCalledWith(`${API}/teams`, {
      name: 'New team',
      public: true,
      members: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
    });
    expect(ids(dataFetcher.data)).toEqual(['team']);
  });

  it('reports a failed team', async () => {
    const { service, platform, dataFetcher } = createChats({ chats: [] });
    platform.post.mockRejectedValueOnce(new Error('network'));

    await expect(
      service.createTeam({ name: 'x', emails: [] }),
    ).resolves.toEqual({ ok: false });
    expect(dataFetcher.updateData).not.toHaveBeenCalled();
    expect(service.logger.error).toHaveBeenCalledWith(
      'create team failed',
      expect.any(Error),
    );
  });
});

describe('TeamMessagingChats toggleFavorite', () => {
  it('adds a recent chat that is not a favorite', async () => {
    const recent = chat('c1');
    const { service, favorites } = createChats({ chats: [recent] });

    await expect(service.toggleFavorite('c1')).resolves.toEqual({
      ok: true,
      id: 'c1',
    });

    expect(favorites.setFavorite).toHaveBeenCalledWith({
      chat: recent,
      favorite: true,
    });
  });

  it('removes a favorite chat that is not recent', async () => {
    const favorite = chat('fav');
    const { service, favorites } = createChats({
      chats: [],
      favoriteChats: [favorite],
    });

    await service.toggleFavorite('fav');

    expect(favorites.setFavorite).toHaveBeenCalledWith({
      chat: favorite,
      favorite: false,
    });
  });

  it('falls back to a chat with the id alone', async () => {
    const { service, favorites } = createChats({ chats: [] });

    await service.toggleFavorite('unknown');

    expect(favorites.setFavorite).toHaveBeenCalledWith({
      chat: { id: 'unknown' },
      favorite: true,
    });
  });
});

describe('TeamMessagingChats chat items', () => {
  function createWithPosts() {
    const created = createChats({
      chats: [
        chat('read', { name: 'Design' }),
        chat('unread', { name: 'Support' }),
        chat('mine', { name: 'Notes' }),
      ],
      favoriteChats: [
        chat('fav', {
          name: 'Old favorite',
          lastModifiedTime: new Date(NOW - 24 * HOUR).toISOString(),
        }),
      ],
    });
    const { posts } = created;
    posts.readTimeMap = {
      read: NOW - HOUR,
      unread: NOW - HOUR,
      mine: NOW - HOUR,
    };
    posts.postsMap = {
      read: [post('r1', NOW - 2 * HOUR, { text: 'budget review' })],
      unread: [
        post('u2', NOW - 10 * 60 * 1000, { text: 'hi ![:Person](me)' }),
        post('u1', NOW - 20 * 60 * 1000),
        post('u0', NOW - 30 * 60 * 1000, { sendStatus: 'failed' }),
      ],
      mine: [post('m1', NOW - 5 * 60 * 1000, { creatorId: MY_ID })],
    };
    return created;
  }

  it('builds chat items with unread counts, newest activity first', () => {
    const { service } = createWithPosts();

    const items = service.chatItems;

    expect(ids(items)).toEqual(['mine', 'unread', 'read', 'fav']);
    expect(service.getChatItem('unread')).toEqual(
      expect.objectContaining({
        name: 'Support',
        unreadCount: 2,
        unreadMention: 'me',
        isFavorite: false,
      }),
    );
    expect(service.getChatItem('mine').unreadCount).toBe(0);
    expect(service.getChatItem('read').unreadCount).toBe(0);
    expect(service.getChatItem('fav').isFavorite).toBe(true);
    expect(service.getChatItem('missing')).toBeUndefined();
    expect(service.totalUnreadCount).toBe(2);
  });

  it('shows only unread chats with the Unread filter', () => {
    const { service } = createWithPosts();
    expect(service.readStatusFilter).toBe('All');

    service.setReadStatusFilter('Unread');

    expect(ids(service.filteredChatItems)).toEqual(['unread']);

    service.setReadStatusFilter('All');
    expect(service.filteredChatItems).toHaveLength(4);
  });

  it('searches chat names and loaded post text', () => {
    const { service } = createWithPosts();

    service.setSearchFilter('  SUPP ');
    expect(ids(service.filteredChatItems)).toEqual(['unread']);

    service.setSearchFilter('budget');
    expect(ids(service.filteredChatItems)).toEqual(['read']);

    service.setSearchFilter('budget');
    service.setReadStatusFilter('Unread');
    expect(service.filteredChatItems).toEqual([]);
  });

  it('has no chats before the list loads', () => {
    const { service } = createChats();

    expect(service.chats).toEqual([]);
    expect(service.chatItems).toEqual([]);
    expect(service.totalUnreadCount).toBe(0);
  });
});

describe('TeamMessagingChats chat events', () => {
  function createWithSubscription(extra = {}) {
    const message$ = new Subject();
    const subscription = {
      ready: true,
      filters: ['/team-messaging/v1/chats'],
      subscribe: jest.fn(async () => {}),
      unsubscribe: jest.fn(async () => {}),
      fromMessage$: jest.fn(() => message$),
    };
    const created = createChats({ subscription, ...extra });
    created.service.onInitOnce();
    created.service.status = 'ready';
    return { ...created, message$, subscription };
  }

  it('subscribes to chat events with the TeamMessaging feature', () => {
    const { subscription } = createWithSubscription({ chats: [] });

    expect(subscription.subscribe).toHaveBeenCalledWith([
      '/team-messaging/v1/chats',
    ]);
    expect(subscription.fromMessage$).toHaveBeenCalledWith(
      /\/team-messaging\/v1\/chats$/,
    );
  });

  it('unsubscribes chat events without the TeamMessaging feature', () => {
    const { subscription, message$, dataFetcher } = createWithSubscription({
      chats: [],
      teamMessagingAvailable: false,
    });

    expect(subscription.subscribe).not.toHaveBeenCalled();
    expect(subscription.unsubscribe).toHaveBeenCalledWith([
      '/team-messaging/v1/chats',
    ]);
    message$.next({ eventType: 'GroupJoined', id: 'c9' });
    expect(dataFetcher.updateData).not.toHaveBeenCalled();
  });

  it('adds a joined chat and loads its members and posts', () => {
    const { message$, dataFetcher, persons, posts } = createWithSubscription({
      chats: [chat('c1')],
    });

    message$.next({
      eventType: 'GroupJoined',
      id: 'c9',
      type: 'Group',
      members: ['u1', 'u2'],
    });

    expect(ids(dataFetcher.data)).toEqual(['c9', 'c1']);
    expect(dataFetcher.data[0].members).toEqual([{ id: 'u1' }, { id: 'u2' }]);
    expect(posts.seedReadTime).toHaveBeenCalledWith('c9', NOW - 2 * HOUR);
    expect(persons.loadPersons).toHaveBeenCalledWith(['u1', 'u2']);
    expect(posts.loadPosts).toHaveBeenCalledWith('c9');
  });

  it('removes a chat the user left', () => {
    const { message$, dataFetcher, posts } = createWithSubscription({
      chats: [chat('c1'), chat('c2')],
    });

    message$.next({ eventType: 'GroupLeft', id: 'c1' });
    message$.next({ eventType: 'GroupJoined' });

    expect(ids(dataFetcher.data)).toEqual(['c2']);
    expect(posts.loadPosts).not.toHaveBeenCalled();
  });
});
