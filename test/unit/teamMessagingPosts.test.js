import { Subject } from 'rxjs';

import { TeamMessagingPosts } from '../../src/app/services/TeamMessaging/TeamMessagingPosts';
import { TeamMessagingThreads } from '../../src/app/services/TeamMessaging/TeamMessagingThreads';

const MY_ID = 'me';
const API = '/team-messaging/v1';
const TEXT_FILE = 'data:text/plain;base64,aGVsbG8=';

const jsonResponse = (body) => ({ json: jest.fn(async () => body) });

const post = (id, minute, extra = {}) => ({
  id,
  chatId: 'chat-1',
  creatorId: 'other',
  type: 'TextMessage',
  text: id,
  creationTime: new Date(Date.UTC(2026, 9, 1, 0, minute)).toISOString(),
  ...extra,
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createSubscription() {
  const message$ = new Subject();
  return {
    message$,
    ready: true,
    filters: [],
    subscribe: jest.fn(async () => {}),
    unsubscribe: jest.fn(async () => {}),
    fromMessage$: jest.fn(() => message$),
  };
}

function createPosts({
  hasGlipPermission = true,
  teamMessagingAvailable = true,
  subscription,
  options,
} = {}) {
  const platform = {
    get: jest.fn(async () => jsonResponse({ records: [] })),
    post: jest.fn(async () => jsonResponse({})),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  const client = { service: { platform: () => platform } };
  const appFeatures = { hasGlipPermission };
  const persons = { loadPersons: jest.fn(async () => {}) };
  const threads = new TeamMessagingThreads(client, appFeatures, persons);
  jest.spyOn(threads, 'upsertReplies');
  jest.spyOn(threads, 'removeReply');
  jest.spyOn(threads, 'removePost');
  jest.spyOn(threads, 'setReplySendStatus');
  jest.spyOn(threads, 'updateParent');
  const deps = {
    auth: { ownerId: MY_ID },
    client,
    appFeatures,
    extensionFeatures: {
      features: { TeamMessaging: { available: teamMessagingAvailable } },
    },
    persons,
    threads,
    tasks: { saveFromPosts: jest.fn() },
    notes: { saveFromPosts: jest.fn() },
    storage: { enable: jest.fn() },
  };
  const service = new TeamMessagingPosts(
    deps.auth,
    deps.client,
    deps.appFeatures,
    deps.extensionFeatures,
    deps.persons,
    deps.threads,
    deps.tasks,
    deps.notes,
    deps.storage,
    subscription,
    options,
  );
  return { service, platform, ...deps };
}

const ids = (posts = []) => posts.map(({ id }) => id);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TeamMessagingPosts fetching', () => {
  it('enables storage on construction', () => {
    const { storage, service } = createPosts();
    expect(storage.enable).toHaveBeenCalledWith(service);
  });

  it('loads the first page newest first and keeps the older page token', async () => {
    const { service, platform, tasks, notes, persons } = createPosts();
    const records = [
      post('p1', 1),
      post('p3', 3, { addedPersonIds: ['added'] }),
      post('p2', 2),
    ];
    platform.get.mockResolvedValueOnce(
      jsonResponse({ records, navigation: { prevPageToken: 'older-1' } }),
    );

    await service.fetchPosts('chat-1');

    expect(platform.get).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      recordCount: 20,
    });
    expect(ids(service.postsMap['chat-1'])).toEqual(['p3', 'p2', 'p1']);
    expect(service.olderPageTokens['chat-1']).toBe('older-1');
    expect(service.fetchTimes['chat-1']).toEqual(expect.any(Number));
    expect(service.loadingChatIds['chat-1']).toBe(false);
    expect(tasks.saveFromPosts).toHaveBeenCalledWith(records);
    expect(notes.saveFromPosts).toHaveBeenCalledWith(records);
    expect(persons.loadPersons).toHaveBeenCalledWith([
      'other',
      'other',
      'added',
      'other',
    ]);
  });

  it('uses the posts per page option', async () => {
    const { service, platform } = createPosts({ options: { postsPerPage: 5 } });

    await service.fetchPosts('chat-1');

    expect(platform.get).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      recordCount: 5,
    });
  });

  it('marks the chat as loading while the request runs', async () => {
    const { service, platform } = createPosts();
    const request = deferred();
    platform.get.mockReturnValueOnce(request.promise);

    const fetching = service.fetchPosts('chat-1');
    expect(service.loadingChatIds['chat-1']).toBe(true);

    request.resolve(jsonResponse({ records: [] }));
    await fetching;
    expect(service.loadingChatIds['chat-1']).toBe(false);
  });

  it('stores a null older page token when there is no previous page', async () => {
    const { service, platform } = createPosts();
    platform.get.mockResolvedValueOnce(jsonResponse({ records: [post('p1', 1)] }));

    await service.fetchPosts('chat-1');

    expect(service.olderPageTokens['chat-1']).toBeNull();
  });

  it('replaces loaded posts with the first page but keeps local unsent posts', async () => {
    const { service, platform } = createPosts();
    service.postsMap['chat-1'] = [
      post('local-1', 9, { sendStatus: 'failed' }),
      post('stale', 4),
    ];
    platform.get.mockResolvedValueOnce(
      jsonResponse({ records: [post('p1', 1), post('p2', 2)] }),
    );

    await service.fetchPosts('chat-1');

    expect(ids(service.postsMap['chat-1'])).toEqual(['local-1', 'p2', 'p1']);
  });

  it('appends an older page and moves the token to the next older page', async () => {
    const { service, platform } = createPosts();
    service.postsMap['chat-1'] = [post('p3', 3), post('p2', 2)];
    service.olderPageTokens['chat-1'] = 'older-1';
    service.fetchTimes['chat-1'] = 123;
    platform.get.mockResolvedValueOnce(
      jsonResponse({
        records: [post('p1', 1), post('p0', 0)],
        navigation: { prevPageToken: 'older-2' },
      }),
    );

    await expect(service.loadOlderPosts('chat-1')).resolves.toBe(true);

    expect(platform.get).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      recordCount: 20,
      pageToken: 'older-1',
    });
    expect(ids(service.postsMap['chat-1'])).toEqual(['p3', 'p2', 'p1', 'p0']);
    expect(service.olderPageTokens['chat-1']).toBe('older-2');
    // Only the first page refreshes the fetch time.
    expect(service.fetchTimes['chat-1']).toBe(123);
  });

  it('resolves false without a request when there is no older page', async () => {
    const { service, platform } = createPosts();
    service.olderPageTokens['chat-1'] = null;

    await expect(service.loadOlderPosts('chat-1')).resolves.toBe(false);
    await expect(service.loadOlderPosts('chat-2')).resolves.toBe(false);
    expect(platform.get).not.toHaveBeenCalled();
  });

  it('skips loading posts fetched within the TTL and refetches stale ones', async () => {
    const { service, platform } = createPosts({ options: { ttl: 1000 } });
    const now = jest.spyOn(Date, 'now').mockReturnValue(10_000);

    await service.loadPosts('chat-1');
    expect(platform.get).toHaveBeenCalledTimes(1);

    now.mockReturnValue(10_500);
    await service.loadPosts('chat-1');
    expect(platform.get).toHaveBeenCalledTimes(1);

    now.mockReturnValue(11_001);
    await service.loadPosts('chat-1');
    expect(platform.get).toHaveBeenCalledTimes(2);
  });

  it('shares one request between concurrent fetches of a chat', async () => {
    const { service, platform } = createPosts();
    const request = deferred();
    platform.get.mockReturnValueOnce(request.promise);

    const first = service.fetchPosts('chat-1');
    const second = service.fetchPosts('chat-1');
    expect(second).toBe(first);
    request.resolve(jsonResponse({ records: [] }));
    await Promise.all([first, second]);
    expect(platform.get).toHaveBeenCalledTimes(1);

    await service.fetchPosts('chat-1');
    expect(platform.get).toHaveBeenCalledTimes(2);
  });

  it('does not request posts without the Glip permission', async () => {
    const { service, platform } = createPosts({ hasGlipPermission: false });

    await service.fetchPosts('chat-1');

    expect(platform.get).not.toHaveBeenCalled();
    expect(service.postsMap['chat-1']).toBeUndefined();
  });

  it('logs a failed request and keeps the loaded posts', async () => {
    const { service, platform, tasks } = createPosts();
    service.postsMap['chat-1'] = [post('p1', 1)];
    platform.get.mockRejectedValueOnce(new Error('network'));

    await service.fetchPosts('chat-1');

    expect(service.logger.error).toHaveBeenCalledWith(
      'load team messaging posts failed',
      expect.any(Error),
    );
    expect(ids(service.postsMap['chat-1'])).toEqual(['p1']);
    expect(service.loadingChatIds['chat-1']).toBe(false);
    expect(tasks.saveFromPosts).not.toHaveBeenCalled();
  });

  it('clears posts on reset', async () => {
    const { service, platform } = createPosts();
    platform.get.mockResolvedValueOnce(
      jsonResponse({
        records: [post('p1', 1)],
        navigation: { prevPageToken: 'older' },
      }),
    );
    await service.fetchPosts('chat-1');
    service.readTimeMap['chat-1'] = 5;

    service.onReset();

    expect(service.postsMap).toEqual({});
    expect(service.olderPageTokens).toEqual({});
    expect(service.fetchTimes).toEqual({});
    expect(service.loadingChatIds).toEqual({});
    // The read times are kept in storage across sessions.
    expect(service.readTimeMap).toEqual({ 'chat-1': 5 });
  });
});

describe('TeamMessagingPosts read times', () => {
  it('marks a chat read now', async () => {
    const { service } = createPosts();
    jest.spyOn(Date, 'now').mockReturnValue(42);

    await service.markRead('chat-1');

    expect(service.readTimeMap['chat-1']).toBe(42);
  });

  it('seeds a read time only for a chat that has none', () => {
    const { service } = createPosts();

    service.seedReadTime('chat-1', 10);
    service.seedReadTime('chat-1', 20);

    expect(service.readTimeMap['chat-1']).toBe(10);
  });
});

describe('TeamMessagingPosts sendPost', () => {
  it('shows a sending local post, then replaces it with the sent post', async () => {
    const { service, platform } = createPosts();
    service.postsMap['chat-1'] = [post('p1', 1)];
    const request = deferred();
    platform.post.mockReturnValueOnce(request.promise);

    const sending = service.sendPost({ chatId: 'chat-1', text: 'hello' });

    const [localPost] = service.postsMap['chat-1'];
    expect(localPost).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^local-/),
        groupId: 'chat-1',
        creatorId: MY_ID,
        text: 'hello',
        type: 'TextMessage',
        attachments: [],
        sendStatus: 'sending',
      }),
    );

    jest.spyOn(Date, 'now').mockReturnValue(777);
    request.resolve(
      jsonResponse(
        post('sent', 5, { chatId: 'chat-1', creatorId: MY_ID, text: 'hello' }),
      ),
    );
    await expect(sending).resolves.toEqual({ ok: true, id: 'sent' });

    expect(platform.post).toHaveBeenCalledTimes(1);
    expect(platform.post).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      text: 'hello',
    });
    expect(ids(service.postsMap['chat-1'])).toEqual(['sent', 'p1']);
    expect(service.readTimeMap['chat-1']).toBe(777);
  });

  it('uploads files without a chat, then attaches them to the post', async () => {
    const { service, platform } = createPosts();
    platform.post
      .mockResolvedValueOnce(
        jsonResponse([{ id: 'file-1', name: 'a.txt', contentUri: 'uri-1' }]),
      )
      .mockResolvedValueOnce(
        jsonResponse([{ id: 'file-2', name: 'b.txt', contentUri: 'uri-2' }]),
      )
      .mockResolvedValueOnce(jsonResponse(post('sent', 5)));

    const sending = service.sendPost({
      chatId: 'chat-1',
      files: [
        { name: 'a.txt', base64Url: TEXT_FILE },
        { name: 'b.txt', base64Url: TEXT_FILE },
      ],
    });

    expect(service.postsMap['chat-1'][0]).toEqual(
      expect.objectContaining({
        text: '',
        attachments: [
          { type: 'File', name: 'a.txt' },
          { type: 'File', name: 'b.txt' },
        ],
        sendStatus: 'sending',
      }),
    );
    await expect(sending).resolves.toEqual({ ok: true, id: 'sent' });

    expect(platform.post).toHaveBeenCalledTimes(3);
    const [uploadPath, formData, query] = platform.post.mock.calls[0];
    expect(uploadPath).toBe(`${API}/files`);
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('body').name).toBe('a.txt');
    expect(query).toEqual({ name: 'a.txt' });
    expect(query).not.toHaveProperty('groupId');
    expect(platform.post.mock.calls[1][2]).toEqual({ name: 'b.txt' });
    expect(platform.post).toHaveBeenLastCalledWith(
      `${API}/chats/chat-1/posts`,
      {
        attachments: [
          { id: 'file-1', type: 'File' },
          { id: 'file-2', type: 'File' },
        ],
      },
    );
    expect(ids(service.postsMap['chat-1'])).toEqual(['sent']);
  });

  it('sends text and files in one post', async () => {
    const { service, platform } = createPosts();
    platform.post
      .mockResolvedValueOnce(jsonResponse([{ id: 'file-1' }]))
      .mockResolvedValueOnce(jsonResponse(post('sent', 5)));

    await service.sendPost({
      chatId: 'chat-1',
      text: 'see file',
      files: [{ name: 'a.txt', base64Url: TEXT_FILE }],
    });

    expect(platform.post).toHaveBeenLastCalledWith(
      `${API}/chats/chat-1/posts`,
      { text: 'see file', attachments: [{ id: 'file-1', type: 'File' }] },
    );
  });

  it('marks the local post failed when an upload fails', async () => {
    const { service, platform } = createPosts();
    platform.post.mockRejectedValueOnce(new Error('upload failed'));

    await expect(
      service.sendPost({
        chatId: 'chat-1',
        files: [{ name: 'a.txt', base64Url: TEXT_FILE }],
      }),
    ).resolves.toEqual({ ok: false });

    expect(platform.post).toHaveBeenCalledTimes(1);
    expect(service.postsMap['chat-1'][0].sendStatus).toBe('failed');
    expect(service.logger.error).toHaveBeenCalledWith(
      'upload team messaging file failed',
      expect.any(Error),
    );
  });

  it('treats an uploaded file without an id as a failed upload', async () => {
    const { service, platform } = createPosts();
    platform.post.mockResolvedValueOnce(jsonResponse([]));

    await expect(
      service.sendPost({
        chatId: 'chat-1',
        files: [{ name: 'a.txt', base64Url: TEXT_FILE }],
      }),
    ).resolves.toEqual({ ok: false });

    expect(platform.post).toHaveBeenCalledTimes(1);
    expect(service.postsMap['chat-1'][0].sendStatus).toBe('failed');
  });

  it('keeps a failed post in the list as failed', async () => {
    const { service, platform, threads } = createPosts();
    platform.post.mockRejectedValueOnce(new Error('send failed'));

    await expect(
      service.sendPost({ chatId: 'chat-1', text: 'hello' }),
    ).resolves.toEqual({ ok: false });

    expect(service.postsMap['chat-1']).toHaveLength(1);
    expect(service.postsMap['chat-1'][0]).toEqual(
      expect.objectContaining({ text: 'hello', sendStatus: 'failed' }),
    );
    expect(threads.setReplySendStatus).not.toHaveBeenCalled();
    expect(service.logger.error).toHaveBeenCalledWith(
      'send team messaging post failed',
      expect.any(Error),
    );
  });

  it('sends a reply in a thread and replaces its local copy there', async () => {
    const { service, platform, threads } = createPosts();
    platform.post.mockResolvedValueOnce(
      jsonResponse(
        post('reply', 5, { chatId: 'chat-1', threadId: 'thread-1' }),
      ),
    );

    const sending = service.sendPost({
      chatId: 'chat-1',
      text: 'reply',
      threadId: 'thread-1',
    });

    const localReply = threads.repliesMap['thread-1'][0];
    expect(localReply).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^local-/),
        threadId: 'thread-1',
        sendStatus: 'sending',
      }),
    );
    await expect(sending).resolves.toEqual({ ok: true, id: 'reply' });

    expect(platform.post).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      text: 'reply',
      threadId: 'thread-1',
    });
    expect(threads.removeReply).toHaveBeenCalledWith('thread-1', localReply.id);
    expect(ids(threads.repliesMap['thread-1'])).toEqual(['reply']);
    expect(ids(service.postsMap['chat-1'])).toEqual(['reply']);
  });

  it('marks a failed thread reply failed in its thread too', async () => {
    const { service, platform, threads } = createPosts();
    platform.post.mockRejectedValueOnce(new Error('send failed'));

    await service.sendPost({
      chatId: 'chat-1',
      text: 'reply',
      threadId: 'thread-1',
    });

    const [localReply] = threads.repliesMap['thread-1'];
    expect(threads.setReplySendStatus).toHaveBeenCalledWith(
      'thread-1',
      localReply.id,
      'failed',
    );
    expect(localReply.sendStatus).toBe('failed');
    expect(service.postsMap['chat-1'][0].sendStatus).toBe('failed');
  });

  it('starts a thread with the first reply to a post', async () => {
    const { service, platform, threads } = createPosts();
    service.postsMap['chat-1'] = [post('parent', 1)];
    threads.parentsMap.parent = post('parent', 1);
    platform.post.mockResolvedValueOnce(
      jsonResponse(
        post('reply', 5, {
          chatId: 'chat-1',
          threadId: 'thread-1',
          parentPostId: 'parent',
        }),
      ),
    );

    await expect(
      service.sendPost({
        chatId: 'chat-1',
        text: 'first reply',
        parentPostId: 'parent',
      }),
    ).resolves.toEqual({ ok: true, id: 'reply' });

    expect(platform.post).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      text: 'first reply',
      parentPostId: 'parent',
    });
    const parent = service.postsMap['chat-1'].find(({ id }) => id === 'parent');
    expect(parent).toEqual(
      expect.objectContaining({ isParent: true, threadId: 'thread-1' }),
    );
    expect(threads.updateParent).toHaveBeenCalledWith('parent', {
      isParent: true,
      threadId: 'thread-1',
    });
    expect(threads.parentsMap.parent).toEqual(
      expect.objectContaining({ isParent: true, threadId: 'thread-1' }),
    );
    expect(ids(threads.repliesMap['thread-1'])).toEqual(['reply']);
  });

  it('prefers the thread id over the parent post id', async () => {
    const { service, platform } = createPosts();
    platform.post.mockResolvedValueOnce(jsonResponse(post('reply', 5)));

    await service.sendPost({
      chatId: 'chat-1',
      text: 'reply',
      threadId: 'thread-1',
      parentPostId: 'parent',
    });

    expect(platform.post).toHaveBeenCalledWith(`${API}/chats/chat-1/posts`, {
      text: 'reply',
      threadId: 'thread-1',
    });
  });
});

describe('TeamMessagingPosts post events', () => {
  it('adds another person’s new post and announces it', () => {
    const { service, tasks, notes, persons } = createPosts();
    const newPosts = [];
    service.newPost$.subscribe((item) => newPosts.push(item));
    const event = {
      eventType: 'PostAdded',
      ...post('p1', 1, { chatId: undefined, groupId: 'chat-1' }),
    };
    const { eventType, ...saved } = event;

    service._handlePostEvent(event);

    expect(service.postsMap['chat-1']).toEqual([saved]);
    expect(tasks.saveFromPosts).toHaveBeenCalledWith([saved]);
    expect(notes.saveFromPosts).toHaveBeenCalledWith([saved]);
    expect(persons.loadPersons).toHaveBeenCalledWith(['other']);
    expect(newPosts).toEqual([{ ...saved, groupId: 'chat-1' }]);
    expect(service.readTimeMap['chat-1']).toBe(
      new Date(saved.creationTime).getTime() - 1,
    );
  });

  it('keeps the read time of a chat that has one', () => {
    const { service } = createPosts();
    service.readTimeMap['chat-1'] = 5;

    service._handlePostEvent({ eventType: 'PostAdded', ...post('p1', 1) });

    expect(service.readTimeMap['chat-1']).toBe(5);
  });

  it('does not announce the user’s own new post', () => {
    const { service } = createPosts();
    const listener = jest.fn();
    service.newPost$.subscribe(listener);

    service._handlePostEvent({
      eventType: 'PostAdded',
      ...post('p1', 1, { creatorId: MY_ID }),
    });

    expect(ids(service.postsMap['chat-1'])).toEqual(['p1']);
    expect(listener).not.toHaveBeenCalled();
    expect(service.readTimeMap['chat-1']).toBeUndefined();
  });

  it('replaces a changed post without announcing it', () => {
    const { service, tasks } = createPosts();
    const listener = jest.fn();
    service.newPost$.subscribe(listener);
    service.postsMap['chat-1'] = [post('p2', 2), post('p1', 1)];

    service._handlePostEvent({
      eventType: 'PostChanged',
      ...post('p1', 1, { text: 'edited' }),
    });

    expect(ids(service.postsMap['chat-1'])).toEqual(['p2', 'p1']);
    expect(service.postsMap['chat-1'][1].text).toBe('edited');
    expect(tasks.saveFromPosts).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'p1', text: 'edited' }),
    ]);
    expect(listener).not.toHaveBeenCalled();
  });

  it('removes a post by its id alone from every chat and thread', () => {
    const { service, threads, tasks } = createPosts();
    service.postsMap = {
      'chat-1': [post('p2', 2), post('gone', 1)],
      'chat-2': [post('gone', 1, { chatId: 'chat-2' }), post('p3', 0)],
      'chat-3': [post('p4', 0)],
    };
    threads.repliesMap = {
      'thread-1': [post('gone', 1), post('r1', 0)],
      'thread-2': [post('r2', 0)],
    };

    service._handlePostEvent({ eventType: 'PostRemoved', id: 'gone' });

    expect(ids(service.postsMap['chat-1'])).toEqual(['p2']);
    expect(ids(service.postsMap['chat-2'])).toEqual(['p3']);
    expect(ids(service.postsMap['chat-3'])).toEqual(['p4']);
    expect(threads.removePost).toHaveBeenCalledWith('gone');
    expect(ids(threads.repliesMap['thread-1'])).toEqual(['r1']);
    expect(ids(threads.repliesMap['thread-2'])).toEqual(['r2']);
    expect(tasks.saveFromPosts).not.toHaveBeenCalled();
  });

  it('ignores a removed post event without an id', () => {
    const { service, threads } = createPosts();
    service.postsMap = { 'chat-1': [post('p1', 1)] };

    service._handlePostEvent({ eventType: 'PostRemoved' });

    expect(ids(service.postsMap['chat-1'])).toEqual(['p1']);
    expect(threads.removePost).not.toHaveBeenCalled();
  });

  it('ignores a post event without a chat or an id', () => {
    const { service, tasks } = createPosts();

    service._handlePostEvent({
      eventType: 'PostAdded',
      ...post('p1', 1, { chatId: undefined }),
    });
    service._handlePostEvent({
      eventType: 'PostAdded',
      ...post(undefined, 1),
    });

    expect(service.postsMap).toEqual({});
    expect(tasks.saveFromPosts).not.toHaveBeenCalled();
  });

  it('adds a reply event to its thread', () => {
    const { service, threads } = createPosts();

    service._handlePostEvent({
      eventType: 'PostAdded',
      ...post('reply', 1, { threadId: 'thread-1', parentPostId: 'parent' }),
    });

    expect(threads.upsertReplies).toHaveBeenCalledWith('thread-1', [
      expect.objectContaining({ id: 'reply' }),
    ]);
    expect(ids(threads.repliesMap['thread-1'])).toEqual(['reply']);
  });

  it('updates a thread parent from its changed post', () => {
    const { service, threads } = createPosts();
    threads.parentsMap.parent = post('parent', 1);

    service._handlePostEvent({
      eventType: 'PostChanged',
      ...post('parent', 1, { isParent: true, threadId: 'thread-1' }),
    });

    expect(threads.upsertReplies).not.toHaveBeenCalled();
    expect(threads.updateParent).toHaveBeenCalledWith(
      'parent',
      expect.objectContaining({ id: 'parent', isParent: true }),
    );
    expect(threads.parentsMap.parent.threadId).toBe('thread-1');
  });

  it('handles post events from the subscription with the event permission', () => {
    const subscription = createSubscription();
    const { service } = createPosts({ subscription });
    service.onInitOnce();
    service.status = 'ready';

    expect(subscription.fromMessage$).toHaveBeenCalledWith(
      /\/team-messaging\/v1\/posts$/,
    );
    expect(subscription.subscribe).toHaveBeenCalledWith([
      '/team-messaging/v1/posts',
    ]);
    subscription.message$.next({ eventType: 'PostAdded', ...post('p1', 1) });

    expect(ids(service.postsMap['chat-1'])).toEqual(['p1']);
  });

  it('ignores post events before ready or without the TeamMessaging feature', () => {
    const subscription = createSubscription();
    const { service } = createPosts({
      subscription,
      teamMessagingAvailable: false,
    });
    service.onInitOnce();

    expect(subscription.subscribe).not.toHaveBeenCalled();
    service.status = 'ready';
    subscription.message$.next({ eventType: 'PostAdded', ...post('p1', 1) });
    expect(service.postsMap).toEqual({});

    const enabled = createSubscription();
    const { service: notReady } = createPosts({ subscription: enabled });
    notReady.onInitOnce();
    enabled.message$.next({ eventType: 'PostAdded', ...post('p1', 1) });
    expect(notReady.postsMap).toEqual({});
  });

  it('does nothing on init without a subscription', () => {
    const { service } = createPosts();
    expect(() => service.onInitOnce()).not.toThrow();
  });
});

describe('TeamMessagingPosts removeAttachmentPosts', () => {
  it('removes the posts carrying the attachment from chats and threads', async () => {
    const { service, threads } = createPosts();
    const taskPost = (id, chatId) =>
      post(id, 1, { chatId, attachments: [{ id: 'task-1', type: 'Task' }] });
    service.postsMap = {
      'chat-1': [taskPost('t1', 'chat-1'), post('p1', 0)],
      'chat-2': [
        taskPost('t2', 'chat-2'),
        post('p2', 0, { attachments: [{ id: 'task-2', type: 'Task' }] }),
      ],
    };
    threads.repliesMap = { 'thread-1': [taskPost('t1', 'chat-1')] };

    await service.removeAttachmentPosts('task-1');

    expect(ids(service.postsMap['chat-1'])).toEqual(['p1']);
    expect(ids(service.postsMap['chat-2'])).toEqual(['p2']);
    expect(threads.removePost).toHaveBeenCalledWith('t1');
    expect(threads.removePost).toHaveBeenCalledWith('t2');
    expect(threads.repliesMap['thread-1']).toEqual([]);
  });

  it('keeps every post when none carries the attachment', async () => {
    const { service, threads } = createPosts();
    service.postsMap = { 'chat-1': [post('p1', 0)] };

    await service.removeAttachmentPosts('task-1');

    expect(ids(service.postsMap['chat-1'])).toEqual(['p1']);
    expect(threads.removePost).not.toHaveBeenCalled();
  });
});
