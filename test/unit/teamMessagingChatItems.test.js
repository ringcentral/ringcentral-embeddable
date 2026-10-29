import {
  getChatItems,
  getChatName,
  getMember,
  getPersonName,
  matchChatItem,
  toPostItem,
} from '../../src/app/services/TeamMessaging/getChatItems';

const personsMap = {
  me: { id: 'me', firstName: 'My', lastName: 'Self' },
  ada: { id: 'ada', firstName: 'Ada', lastName: 'Lovelace' },
  bob: { id: 'bob', email: 'bob@example.com' },
};

const READ_TIME = Date.UTC(2026, 0, 1, 12);
const before = '2026-01-01T11:00:00.000Z';
const after = '2026-01-01T13:00:00.000Z';

describe('getPersonName', () => {
  test('uses the full name, then email, then id', () => {
    expect(getPersonName({ id: '1', firstName: 'Ada', lastName: 'Lovelace' })).toBe(
      'Ada Lovelace',
    );
    expect(getPersonName({ id: '1', firstName: 'Ada' })).toBe('Ada');
    expect(getPersonName({ id: '1', lastName: 'Lovelace' })).toBe('Lovelace');
    expect(getPersonName({ id: '1', email: 'ada@example.com' })).toBe(
      'ada@example.com',
    );
    expect(getPersonName({ id: '1' })).toBe('1');
    expect(getPersonName({})).toBe('');
    expect(getPersonName(undefined)).toBe('');
  });
});

describe('getMember', () => {
  test('merges the person and marks me', () => {
    expect(getMember({ id: 'ada', personsMap, myId: 'me' })).toEqual({
      ...personsMap.ada,
      isMe: false,
    });
    expect(getMember({ id: 'me', personsMap, myId: 'me' }).isMe).toBe(true);
    expect(getMember({ id: 'unknown', personsMap })).toEqual({
      id: 'unknown',
      isMe: false,
    });
  });
});

describe('getChatName', () => {
  const members = [
    { id: 'me', firstName: 'My', isMe: true },
    { id: 'ada', firstName: 'Ada', isMe: false },
    { id: 'bob', email: 'bob@example.com', isMe: false },
  ];

  test('uses the chat name when set', () => {
    expect(getChatName({ id: 'c', name: 'Sales' }, members)).toBe('Sales');
  });

  test('joins the names of other members', () => {
    expect(getChatName({ id: 'c' }, members)).toBe('Ada, bob@example.com');
  });

  test('falls back to my own name in a personal chat', () => {
    expect(getChatName({ id: 'c' }, [members[0]])).toBe('My');
    expect(getChatName({ id: 'c' }, [])).toBe('');
  });
});

describe('toPostItem', () => {
  test('adds the creator and whether I sent it', () => {
    const post = { id: 'p', creatorId: 'me', text: 'hi' };
    expect(toPostItem({ post, personsMap, myId: 'me' })).toEqual({
      ...post,
      creator: { ...personsMap.me, isMe: true },
      sentByMe: true,
    });
    const other = toPostItem({ post: { id: 'p', creatorId: 'ada' }, personsMap, myId: 'me' });
    expect(other.sentByMe).toBe(false);
    expect(other.creator.firstName).toBe('Ada');
  });

  test('has no creator without a creator id', () => {
    const item = toPostItem({ post: { id: 'p' }, personsMap });
    expect(item.creator).toBeUndefined();
    expect(item.sentByMe).toBe(false);
  });
});

describe('getChatItems', () => {
  function build(overrides = {}) {
    return getChatItems({
      chats: [],
      personsMap,
      postsMap: {},
      readTimeMap: {},
      myId: 'me',
      ...overrides,
    });
  }

  test('builds items sorted by latest post, then chat modified time', () => {
    const items = build({
      chats: [
        {
          id: 'old',
          type: 'Direct',
          members: [{ id: 'me' }, { id: 'ada' }],
          lastModifiedTime: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'team',
          type: 'Team',
          name: 'Sales',
          members: [{ id: 'me' }],
          lastModifiedTime: '2025-01-01T00:00:00.000Z',
        },
        { id: 'empty', type: 'Group' },
        { id: '', type: 'Direct' },
      ],
      postsMap: {
        team: [{ id: 'p1', creatorId: 'ada', text: 'hi', creationTime: after }],
      },
    });
    expect(items.map(({ id }) => id)).toEqual(['team', 'old', 'empty']);
    const [team, old, empty] = items;
    expect(team).toMatchObject({
      type: 'Team',
      name: 'Sales',
      isFavorite: false,
      unreadCount: 0,
      unreadMention: null,
      updatedTime: new Date(after).getTime(),
    });
    expect(team.latestPost).toMatchObject({ id: 'p1', sentByMe: false });
    expect(team.latestPost.creator.firstName).toBe('Ada');
    expect(old.name).toBe('Ada Lovelace');
    expect(old.members.map(({ id, isMe }) => [id, isMe])).toEqual([
      ['me', true],
      ['ada', false],
    ]);
    expect(old.latestPost).toBeUndefined();
    expect(old.updatedTime).toBe(Date.UTC(2026, 0, 1));
    expect(empty).toMatchObject({ members: [], name: '', updatedTime: 0 });
  });

  test('appends favorite chats that are not recent and marks favorites', () => {
    const items = build({
      chats: [{ id: 'a', name: 'A', lastModifiedTime: after }],
      favoriteChats: [
        { id: 'a', name: 'A stale' },
        { id: 'f', name: 'F', lastModifiedTime: before },
      ],
    });
    expect(items.map(({ id, name, isFavorite }) => [id, name, isFavorite])).toEqual([
      ['a', 'A', true],
      ['f', 'F', true],
    ]);
  });

  test('counts unread posts by others after the read time that were sent', () => {
    const [item] = build({
      chats: [{ id: 'c' }],
      postsMap: {
        c: [
          { id: '1', creatorId: 'ada', creationTime: after },
          { id: '2', creatorId: 'bob', creationTime: after },
          { id: '3', creatorId: 'me', creationTime: after },
          { id: '4', creatorId: 'ada', creationTime: after, sendStatus: 'Sending' },
          { id: '5', creatorId: 'ada', creationTime: before },
        ],
      },
      readTimeMap: { c: READ_TIME },
    });
    expect(item.unreadCount).toBe(2);
  });

  test('has no unread posts without a read time', () => {
    const [item] = build({
      chats: [{ id: 'c' }],
      postsMap: { c: [{ id: '1', creatorId: 'ada', creationTime: after }] },
    });
    expect(item.unreadCount).toBe(0);
    expect(item.unreadMention).toBeNull();
  });

  function getMention(post, myId = 'me') {
    return build({
      chats: [{ id: 'c' }],
      postsMap: { c: [{ id: '1', creatorId: 'ada', creationTime: after, ...post }] },
      readTimeMap: { c: READ_TIME },
      myId,
    })[0].unreadMention;
  }

  test('detects a mention of me', () => {
    expect(getMention({ mentions: [{ type: 'Person', id: 'me' }] })).toBe('me');
    expect(getMention({ text: 'hi ![:Person](me)' })).toBe('me');
    expect(getMention({ mentions: [{ type: 'Person', id: 'bob' }] })).toBeNull();
    expect(getMention({ text: '![:Person](me)' }, null)).toBeNull();
  });

  test('detects a mention of the team', () => {
    expect(
      getMention({
        text: "<a class='at_mention_compose' rel='{\"id\":-1}'>@Team</a>",
      }),
    ).toBe('team');
    expect(getMention({ text: '![:All](@Team)' })).toBe('team');
    expect(getMention({ text: '![:Team](-1) hi' })).toBe('team');
    expect(getMention({ mentions: [{ type: 'Team', id: 'c' }] })).toBe('team');
    expect(getMention({ mentions: [{ type: 'Team', id: 'other' }] })).toBeNull();
    expect(getMention({ text: 'plain' })).toBeNull();
  });

  test('prefers a mention of me over a team mention', () => {
    const [item] = build({
      chats: [{ id: 'c' }],
      postsMap: {
        c: [
          { id: '1', creatorId: 'ada', creationTime: after, text: '![:Team](-1)' },
          { id: '2', creatorId: 'ada', creationTime: after, text: '![:Person](me)' },
        ],
      },
      readTimeMap: { c: READ_TIME },
    });
    expect(item.unreadMention).toBe('me');
  });

  test('ignores mentions in read posts', () => {
    expect(getMention({ text: '![:Person](me)', creationTime: before })).toBeNull();
  });
});

describe('matchChatItem', () => {
  const item = { id: 'c', name: 'Sales Team' };

  test('matches the chat name', () => {
    expect(matchChatItem({ item, posts: [], searchText: 'sales' })).toBe(true);
  });

  test('matches a post text or a mentioned name', () => {
    expect(
      matchChatItem({ item, posts: [{ text: 'Quarterly REPORT' }], searchText: 'report' }),
    ).toBe(true);
    expect(
      matchChatItem({
        item,
        posts: [{ mentions: [{ name: 'Ada Lovelace' }] }],
        searchText: 'ada',
      }),
    ).toBe(true);
  });

  test('does not match otherwise', () => {
    expect(
      matchChatItem({
        item: { id: 'c' },
        posts: [{}, { text: 'hello', mentions: [{}] }],
        searchText: 'bye',
      }),
    ).toBe(false);
  });
});
