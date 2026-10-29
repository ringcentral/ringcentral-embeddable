import { TeamMessagingFavorites } from '../../src/app/services/TeamMessaging/TeamMessagingFavorites';

const API = '/team-messaging/v1';

const jsonResponse = (body) => ({ json: jest.fn(async () => body) });

const chat = (id) => ({ id, type: 'Team', name: `Team ${id}` });

function createFavorites({ hasGlipPermission = true } = {}) {
  const platform = {
    get: jest.fn(async () => jsonResponse({ records: [] })),
    post: jest.fn(async () => jsonResponse({})),
  };
  const client = { service: { platform: () => platform } };
  const storage = { enable: jest.fn() };
  const service = new TeamMessagingFavorites(
    client,
    { hasGlipPermission },
    storage,
  );
  return { service, platform, storage };
}

const ids = (chats) => chats.map(({ id }) => id);

describe('TeamMessagingFavorites', () => {
  it('enables storage on construction', () => {
    const { service, storage } = createFavorites();
    expect(storage.enable).toHaveBeenCalledWith(service);
  });

  it('loads the favorite chats', async () => {
    const { service, platform } = createFavorites();
    platform.get.mockResolvedValueOnce(
      jsonResponse({ records: [chat('c1'), chat('c2')] }),
    );

    await service.fetchFavorites();

    expect(platform.get).toHaveBeenCalledWith(`${API}/favorites`, {
      recordCount: 250,
    });
    expect(ids(service.favoriteChats)).toEqual(['c1', 'c2']);
    expect(service.isFavorite('c1')).toBe(true);
    expect(service.isFavorite('c3')).toBe(false);
    expect(service.favoriteChatIds).toEqual(new Set(['c1', 'c2']));
  });

  it('treats a response without records as no favorites', async () => {
    const { service, platform } = createFavorites();
    service.favoriteChats = [chat('old')];
    platform.get.mockResolvedValueOnce(jsonResponse({}));

    await service.fetchFavorites();

    expect(service.favoriteChats).toEqual([]);
  });

  it('does not load favorites without the Glip permission', async () => {
    const { service, platform } = createFavorites({ hasGlipPermission: false });

    await service.fetchFavorites();

    expect(platform.get).not.toHaveBeenCalled();
  });

  it('keeps the favorites when loading them fails', async () => {
    const { service, platform } = createFavorites();
    service.favoriteChats = [chat('c1')];
    platform.get.mockRejectedValueOnce(new Error('network'));

    await service.fetchFavorites();

    expect(ids(service.favoriteChats)).toEqual(['c1']);
    expect(service.logger.error).toHaveBeenCalledWith(
      'load favorite chats failed',
      expect.any(Error),
    );
  });

  it('ignores chats without an id in the favorite ids', () => {
    const { service } = createFavorites();
    service.favoriteChats = [chat('c1'), { name: 'no id' }];

    expect(service.favoriteChatIds).toEqual(new Set(['c1']));
  });

  it('adds a favorite first, once', async () => {
    const { service, platform } = createFavorites();
    service.favoriteChats = [chat('c1')];

    await expect(
      service.setFavorite({ chat: chat('c2'), favorite: true }),
    ).resolves.toEqual({ ok: true, id: 'c2' });
    await service.setFavorite({ chat: chat('c2'), favorite: true });

    expect(platform.post).toHaveBeenCalledWith(`${API}/chats/c2/favorite`);
    expect(ids(service.favoriteChats)).toEqual(['c2', 'c1']);
  });

  it('removes a favorite', async () => {
    const { service, platform } = createFavorites();
    service.favoriteChats = [chat('c1'), chat('c2')];

    await expect(
      service.setFavorite({ chat: chat('c1'), favorite: false }),
    ).resolves.toEqual({ ok: true, id: 'c1' });

    expect(platform.post).toHaveBeenCalledWith(`${API}/chats/c1/unfavorite`);
    expect(ids(service.favoriteChats)).toEqual(['c2']);
  });

  it('restores the favorites when the request fails', async () => {
    const { service, platform } = createFavorites();
    service.favoriteChats = [chat('c1'), chat('c2')];
    platform.post.mockRejectedValueOnce(new Error('network'));

    await expect(
      service.setFavorite({ chat: chat('c1'), favorite: false }),
    ).resolves.toEqual({ ok: false });

    expect(ids(service.favoriteChats)).toEqual(['c1', 'c2']);
    expect(service.logger.error).toHaveBeenCalledWith(
      'update favorite chat failed',
      expect.any(Error),
    );
  });

  it('reports a failed add', async () => {
    const { service, platform } = createFavorites();
    platform.post.mockRejectedValueOnce(new Error('network'));

    await expect(
      service.setFavorite({ chat: chat('c1'), favorite: true }),
    ).resolves.toEqual({ ok: false });
    expect(service.logger.error).toHaveBeenCalled();
  });

  it('rejects a chat without an id', async () => {
    const { service, platform } = createFavorites();

    await expect(
      service.setFavorite({ chat: { name: 'x' }, favorite: true }),
    ).resolves.toEqual({ ok: false });

    expect(platform.post).not.toHaveBeenCalled();
    expect(service.favoriteChats).toEqual([]);
  });
});
