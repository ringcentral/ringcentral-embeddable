import { TeamMessagingThreads } from '../../src/app/services/TeamMessaging/TeamMessagingThreads';

const API = '/team-messaging/v1';

const jsonResponse = (body) => ({ json: jest.fn(async () => body) });

const post = (id, minute, extra = {}) => ({
  id,
  chatId: 'chat-1',
  creatorId: `creator-${id}`,
  text: id,
  creationTime: new Date(Date.UTC(2026, 9, 1, 0, minute)).toISOString(),
  ...extra,
});

const ids = (posts = []) => posts.map(({ id }) => id);

function createThreads({ hasGlipPermission = true } = {}) {
  const platform = {
    get: jest.fn(async () => jsonResponse({ records: [] })),
  };
  const client = { service: { platform: () => platform } };
  const appFeatures = { hasGlipPermission };
  const persons = { loadPersons: jest.fn(async () => {}) };
  const service = new TeamMessagingThreads(client, appFeatures, persons);
  return { service, platform, persons };
}

describe('TeamMessagingThreads replies', () => {
  it('upserts replies newest first, replacing by id', () => {
    const { service } = createThreads();

    service.upsertReplies('thread-1', [post('r1', 1), post('r3', 3)]);
    service.upsertReplies('thread-1', [
      post('r2', 2),
      post('r1', 1, { text: 'edited' }),
    ]);

    expect(ids(service.repliesMap['thread-1'])).toEqual(['r3', 'r2', 'r1']);
    expect(service.repliesMap['thread-1'][2].text).toBe('edited');
  });

  it('removes a reply from its thread', () => {
    const { service } = createThreads();
    service.upsertReplies('thread-1', [post('r1', 1), post('r2', 2)]);

    service.removeReply('thread-1', 'r1');
    service.removeReply('thread-unknown', 'r2');

    expect(ids(service.repliesMap['thread-1'])).toEqual(['r2']);
    expect(service.repliesMap['thread-unknown']).toBeUndefined();
  });

  it('removes a post from whichever thread loaded it', () => {
    const { service } = createThreads();
    service.upsertReplies('thread-1', [post('r1', 1), post('gone', 2)]);
    service.upsertReplies('thread-2', [post('r2', 1)]);
    const untouched = service.repliesMap['thread-2'];

    service.removePost('gone');

    expect(ids(service.repliesMap['thread-1'])).toEqual(['r1']);
    expect(service.repliesMap['thread-2']).toBe(untouched);
  });

  it('sets the send status of a loaded reply only', () => {
    const { service } = createThreads();
    service.upsertReplies('thread-1', [post('local-1', 1)]);

    service.setReplySendStatus('thread-1', 'local-1', 'failed');
    service.setReplySendStatus('thread-1', 'missing', 'failed');
    service.setReplySendStatus('thread-2', 'local-1', 'failed');

    expect(service.repliesMap['thread-1'][0].sendStatus).toBe('failed');
    expect(service.repliesMap['thread-2']).toBeUndefined();
  });

  it('updates only a parent that was fetched by id', () => {
    const { service } = createThreads();
    service.parentsMap.parent = post('parent', 1);

    service.updateParent('parent', { isParent: true, threadId: 'thread-1' });
    service.updateParent('other', { isParent: true });

    expect(service.parentsMap.parent).toEqual({
      ...post('parent', 1),
      isParent: true,
      threadId: 'thread-1',
    });
    expect(service.parentsMap.other).toBeUndefined();
  });

  it('clears everything on reset', () => {
    const { service } = createThreads();
    service.upsertReplies('thread-1', [post('r1', 1)]);
    service.olderPageTokens['thread-1'] = 'older';
    service.loadingThreadIds['thread-1'] = true;
    service.parentsMap.parent = post('parent', 1);

    service.onReset();

    expect(service.repliesMap).toEqual({});
    expect(service.olderPageTokens).toEqual({});
    expect(service.loadingThreadIds).toEqual({});
    expect(service.parentsMap).toEqual({});
  });
});

describe('TeamMessagingThreads loading', () => {
  it('loads a thread’s newest replies and its older page token', async () => {
    const { service, platform, persons } = createThreads();
    platform.get.mockResolvedValueOnce(
      jsonResponse({
        records: [post('r1', 1), post('r2', 2)],
        navigation: { prevPageToken: 'older-1' },
      }),
    );

    await service.loadThread('chat-1', 'thread-1');

    expect(platform.get).toHaveBeenCalledWith(
      `${API}/chats/chat-1/threads/thread-1/posts`,
      { recordCount: 20 },
    );
    expect(ids(service.repliesMap['thread-1'])).toEqual(['r2', 'r1']);
    expect(service.olderPageTokens['thread-1']).toBe('older-1');
    expect(service.loadingThreadIds['thread-1']).toBe(false);
    expect(persons.loadPersons).toHaveBeenCalledWith([
      'creator-r1',
      'creator-r2',
    ]);
  });

  it('marks the thread loading while the request runs', async () => {
    const { service, platform } = createThreads();
    let resolve;
    platform.get.mockReturnValueOnce(
      new Promise((res) => {
        resolve = res;
      }),
    );

    const loading = service.loadThread('chat-1', 'thread-1');
    expect(service.loadingThreadIds['thread-1']).toBe(true);
    resolve(jsonResponse({}));
    await loading;

    expect(service.loadingThreadIds['thread-1']).toBe(false);
    expect(service.repliesMap['thread-1']).toEqual([]);
    expect(service.olderPageTokens['thread-1']).toBeNull();
  });

  it('loads older replies with the page token and keeps the loaded ones', async () => {
    const { service, platform } = createThreads();
    service.upsertReplies('thread-1', [post('r3', 3)]);
    service.olderPageTokens['thread-1'] = 'older-1';
    platform.get.mockResolvedValueOnce(
      jsonResponse({ records: [post('r1', 1)], navigation: {} }),
    );

    await expect(service.loadOlderReplies('chat-1', 'thread-1')).resolves.toBe(
      true,
    );

    expect(platform.get).toHaveBeenCalledWith(
      `${API}/chats/chat-1/threads/thread-1/posts`,
      { recordCount: 20, pageToken: 'older-1' },
    );
    expect(ids(service.repliesMap['thread-1'])).toEqual(['r3', 'r1']);
    expect(service.olderPageTokens['thread-1']).toBeNull();
  });

  it('resolves false without a request when there are no older replies', async () => {
    const { service, platform } = createThreads();
    service.olderPageTokens['thread-1'] = null;

    await expect(service.loadOlderReplies('chat-1', 'thread-1')).resolves.toBe(
      false,
    );
    await expect(service.loadOlderReplies('chat-1', 'thread-2')).resolves.toBe(
      false,
    );
    expect(platform.get).not.toHaveBeenCalled();
  });

  it('does not load replies without the Glip permission', async () => {
    const { service, platform } = createThreads({ hasGlipPermission: false });

    await service.loadThread('chat-1', 'thread-1');

    expect(platform.get).not.toHaveBeenCalled();
    expect(service.loadingThreadIds['thread-1']).toBeUndefined();
  });

  it('logs a failed replies request', async () => {
    const { service, platform } = createThreads();
    platform.get.mockRejectedValueOnce(new Error('network'));

    await service.loadThread('chat-1', 'thread-1');

    expect(service.logger.error).toHaveBeenCalledWith(
      'load thread replies failed',
      expect.any(Error),
    );
    expect(service.loadingThreadIds['thread-1']).toBe(false);
    expect(service.repliesMap['thread-1']).toBeUndefined();
  });
});

describe('TeamMessagingThreads loadParent', () => {
  it('loads a parent post by id and its creator', async () => {
    const { service, platform, persons } = createThreads();
    platform.get.mockResolvedValueOnce(jsonResponse(post('parent', 1)));

    await service.loadParent('chat-1', 'parent');

    expect(platform.get).toHaveBeenCalledWith(
      `${API}/chats/chat-1/posts/parent`,
    );
    expect(service.parentsMap.parent).toEqual(post('parent', 1));
    expect(persons.loadPersons).toHaveBeenCalledWith(['creator-parent']);
  });

  it('loads a parent without a creator and no profile request', async () => {
    const { service, platform, persons } = createThreads();
    platform.get.mockResolvedValueOnce(
      jsonResponse(post('parent', 1, { creatorId: undefined })),
    );

    await service.loadParent('chat-1', 'parent');

    expect(service.parentsMap.parent.id).toBe('parent');
    expect(persons.loadPersons).not.toHaveBeenCalled();
  });

  it('skips a parent already loaded or without the Glip permission', async () => {
    const { service, platform } = createThreads();
    service.parentsMap.parent = post('parent', 1);
    await service.loadParent('chat-1', 'parent');
    expect(platform.get).not.toHaveBeenCalled();

    const { service: denied, platform: deniedPlatform } = createThreads({
      hasGlipPermission: false,
    });
    await denied.loadParent('chat-1', 'parent');
    expect(deniedPlatform.get).not.toHaveBeenCalled();
  });

  it('logs a failed parent request', async () => {
    const { service, platform } = createThreads();
    platform.get.mockRejectedValueOnce(new Error('not found'));

    await service.loadParent('chat-1', 'parent');

    expect(service.parentsMap).toEqual({});
    expect(service.logger.error).toHaveBeenCalledWith(
      'load thread parent failed',
      expect.any(Error),
    );
  });
});
