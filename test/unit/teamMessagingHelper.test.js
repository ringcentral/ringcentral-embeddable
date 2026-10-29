import { watch } from '@ringcentral-integration/next-core';

import {
  bindEventFilter,
  chunkIds,
  getPostChatId,
  getPostTime,
  isCompanyNotFoundError,
  isLocalPost,
  isThreadReply,
  normalizeChatEvent,
  sleep,
  upsertChat,
  upsertPosts,
} from '../../src/app/services/TeamMessaging/TeamMessaging.helper';

describe('TeamMessaging helpers', () => {
  test('detects the company not found error by its message', () => {
    expect(
      isCompanyNotFoundError({
        message: 'Company associated with RC account is not found',
      }),
    ).toBe(true);
    expect(
      isCompanyNotFoundError(
        new Error('Error: Company associated with RC account is not found.'),
      ),
    ).toBe(true);
    expect(isCompanyNotFoundError({ message: 'Forbidden' })).toBe(false);
    expect(isCompanyNotFoundError({})).toBe(false);
    expect(isCompanyNotFoundError(undefined)).toBe(false);
    expect(isCompanyNotFoundError(null)).toBe(false);
  });

  test('normalizes a chat event into the REST chat shape', () => {
    expect(
      normalizeChatEvent({
        id: 'chat-1',
        type: 'Team',
        name: 'Sales',
        description: 'Sales team',
        status: 'Active',
        isPublic: true,
        creationTime: '2026-01-01T00:00:00.000Z',
        lastModifiedTime: '2026-01-02T00:00:00.000Z',
        members: ['p1', 'p2'],
      }),
    ).toEqual({
      id: 'chat-1',
      type: 'Team',
      name: 'Sales',
      description: 'Sales team',
      status: 'Active',
      public: true,
      creationTime: '2026-01-01T00:00:00.000Z',
      lastModifiedTime: '2026-01-02T00:00:00.000Z',
      members: [{ id: 'p1' }, { id: 'p2' }],
    });
  });

  test('turns null event fields into undefined and missing members into an empty list', () => {
    const chat = normalizeChatEvent({
      id: 'chat-2',
      type: 'Direct',
      name: null,
      description: null,
      isPublic: null,
    });
    expect(chat.name).toBeUndefined();
    expect(chat.description).toBeUndefined();
    expect(chat.public).toBeUndefined();
    expect(chat.members).toEqual([]);
  });

  test('upserts a chat to the front, merging an existing one', () => {
    const chats = [
      { id: 'a', name: 'A', type: 'Team' },
      { id: 'b', name: 'B', type: 'Team' },
    ];
    const updated = upsertChat(chats, { id: 'b', name: 'B2' });
    expect(updated).toEqual([
      { id: 'b', name: 'B2', type: 'Team' },
      { id: 'a', name: 'A', type: 'Team' },
    ]);
    expect(chats[1].name).toBe('B');

    expect(upsertChat(chats, { id: 'c', name: 'C' }).map(({ id }) => id)).toEqual(
      ['c', 'a', 'b'],
    );
    expect(upsertChat([], { id: 'c' })).toEqual([{ id: 'c' }]);
  });

  test('upserts posts by id and sorts them newest first', () => {
    const posts = [
      { id: '2', text: 'old 2', creationTime: '2026-01-02T00:00:00.000Z' },
      { id: '1', text: 'old 1', creationTime: '2026-01-01T00:00:00.000Z' },
    ];
    const result = upsertPosts(posts, [
      { id: '1', text: 'new 1', creationTime: '2026-01-01T00:00:00.000Z' },
      { id: '3', text: 'new 3', creationTime: '2026-01-03T00:00:00.000Z' },
      { id: '0', text: 'no time' },
    ]);
    expect(result.map(({ id, text }) => [id, text])).toEqual([
      ['3', 'new 3'],
      ['2', 'old 2'],
      ['1', 'new 1'],
      ['0', 'no time'],
    ]);
  });

  test('gets the post time, or 0 without a creation time', () => {
    expect(getPostTime({ creationTime: '2026-01-01T00:00:00.000Z' })).toBe(
      Date.UTC(2026, 0, 1),
    );
    expect(getPostTime({})).toBe(0);
    expect(getPostTime(undefined)).toBe(0);
  });

  test('gets the chat id from groupId first, then chatId', () => {
    expect(getPostChatId({ groupId: 'g', chatId: 'c' })).toBe('g');
    expect(getPostChatId({ chatId: 'c' })).toBe('c');
    expect(getPostChatId({})).toBeUndefined();
  });

  test('detects thread replies', () => {
    expect(isThreadReply({ parentPostId: 'p' })).toBe(true);
    expect(isThreadReply({ threadId: 't' })).toBe(true);
    expect(isThreadReply({ threadId: 't', isParent: true })).toBe(false);
    expect(isThreadReply({})).toBe(false);
  });

  test('detects local posts by their id prefix', () => {
    expect(isLocalPost({ id: 'local-123' })).toBe(true);
    expect(isLocalPost({ id: '123-local-' })).toBe(false);
    expect(isLocalPost({})).toBe(false);
  });

  test('chunks ids', () => {
    expect(chunkIds(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
    expect(chunkIds(['a', 'b'], 2)).toEqual([['a', 'b']]);
    expect(chunkIds([], 30)).toEqual([]);
  });

  test('sleep resolves after the delay', async () => {
    jest.useFakeTimers();
    const resolved = jest.fn();
    const promise = sleep(1000).then(resolved);
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(resolved).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    await promise;
    expect(resolved).toHaveBeenCalled();
    jest.useRealTimers();
  });

  describe('bindEventFilter', () => {
    const filter = '/team-messaging/v1/posts';

    function createSubscription({ ready = true, filters = [] } = {}) {
      return {
        ready,
        filters,
        subscribe: jest.fn(async () => {}),
        unsubscribe: jest.fn(async () => {}),
      };
    }

    beforeEach(() => {
      watch.mockClear();
    });

    test('subscribes right away when ready and enabled, and returns the watch disposer', () => {
      const subscription = createSubscription();
      const module = {};
      const dispose = bindEventFilter({
        module,
        subscription,
        filter,
        isEnabled: () => true,
      });
      expect(subscription.subscribe).toHaveBeenCalledWith([filter]);
      expect(watch).toHaveBeenCalledWith(
        module,
        expect.any(Function),
        expect.any(Function),
        { multiple: true },
      );
      expect(dispose).toBe(watch.mock.results[0].value);
    });

    test('does nothing until the subscription is ready', () => {
      const subscription = createSubscription({ ready: false });
      bindEventFilter({
        module: {},
        subscription,
        filter,
        isEnabled: () => true,
      });
      expect(subscription.subscribe).not.toHaveBeenCalled();
      expect(subscription.unsubscribe).not.toHaveBeenCalled();
    });

    test('unsubscribes only a subscribed filter when disabled', () => {
      const subscribed = createSubscription({ filters: [filter] });
      bindEventFilter({
        module: {},
        subscription: subscribed,
        filter,
        isEnabled: () => false,
      });
      expect(subscribed.unsubscribe).toHaveBeenCalledWith([filter]);
      expect(subscribed.subscribe).not.toHaveBeenCalled();

      const notSubscribed = createSubscription();
      bindEventFilter({
        module: {},
        subscription: notSubscribed,
        filter,
        isEnabled: () => false,
      });
      expect(notSubscribed.unsubscribe).not.toHaveBeenCalled();
    });

    test('watches readiness and the enabled flag', () => {
      const subscription = createSubscription({ ready: false, filters: [filter] });
      let enabled = false;
      bindEventFilter({
        module: {},
        subscription,
        filter,
        isEnabled: () => enabled,
      });
      const [, getValues, onChange] = watch.mock.calls[0];

      subscription.ready = true;
      enabled = true;
      expect(getValues()).toEqual([true, true]);

      onChange([true, true]);
      expect(subscription.subscribe).toHaveBeenCalledWith([filter]);
      onChange([true, false]);
      expect(subscription.unsubscribe).toHaveBeenCalledWith([filter]);
      onChange([false, true]);
      expect(subscription.subscribe).toHaveBeenCalledTimes(1);
    });
  });
});
