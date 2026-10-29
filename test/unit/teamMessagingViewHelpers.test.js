import {
  CHAT_TAB_IDS,
  CHAT_TABS_ID,
  isChatInTab,
} from '../../src/app/views/TeamMessagingView/chatTabs';
import {
  CHATS_PATH,
  getChatPath,
} from '../../src/app/views/TeamMessagingView/getChatPath';
import { getChatTabLabel } from '../../src/app/views/TeamMessagingView/getChatTabLabel';
import { getUnreadBadgeColor } from '../../src/app/views/TeamMessagingView/getUnreadBadgeColor';
import {
  getMentionQuery,
  insertMention,
  serializeMentions,
} from '../../src/app/views/TeamMessagingView/mentionText';
import { getTaskColorClass } from '../../src/app/views/TeamMessagingView/components/tasks/taskColors';

describe('getUnreadBadgeColor', () => {
  test('maps mentions to badge colors', () => {
    expect(getUnreadBadgeColor('me')).toBe('warning');
    expect(getUnreadBadgeColor('team')).toBe('primary');
    expect(getUnreadBadgeColor(null)).toBe('secondary');
  });
});

describe('getChatTabLabel', () => {
  test('shows a tab without unread posts by its name', () => {
    expect(getChatTabLabel('All', 0)).toBe('All');
  });

  test('adds the unread count to the name', () => {
    expect(getChatTabLabel('All', 9)).toBe('All (9)');
    expect(getChatTabLabel('Team', 99)).toBe('Team (99)');
  });

  test('caps a large count at 99+', () => {
    expect(getChatTabLabel('All', 100)).toBe('All (99+)');
  });
});

describe('chat tabs', () => {
  test('exports the tab group and ids', () => {
    expect(CHAT_TABS_ID).toBe('teamMessagingChatTabs');
    expect(CHAT_TAB_IDS).toEqual(['All', 'Direct', 'Team', 'Favorites']);
  });

  test('puts chats in tabs by type and favorite', () => {
    const team = { type: 'Team', isFavorite: false };
    const everyone = { type: 'Everyone', isFavorite: true };
    const direct = { type: 'Direct', isFavorite: false };
    const group = { type: 'Group', isFavorite: false };
    const untyped = { isFavorite: false };

    [team, everyone, direct, group, untyped].forEach((chat) => {
      expect(isChatInTab(chat, 'All')).toBe(true);
    });
    expect([team, everyone, direct, group, untyped].map((chat) => isChatInTab(chat, 'Team'))).toEqual(
      [true, true, false, false, false],
    );
    expect(
      [team, everyone, direct, group, untyped].map((chat) => isChatInTab(chat, 'Direct')),
    ).toEqual([false, false, true, true, true]);
    expect(
      [team, everyone, direct].map((chat) => isChatInTab(chat, 'Favorites')),
    ).toEqual([false, true, false]);
  });
});

describe('getChatPath', () => {
  test('builds the legacy chat path with an encoded id', () => {
    expect(CHATS_PATH).toBe('/glip');
    expect(getChatPath('123')).toBe('/glip/groups/123');
    expect(getChatPath('a/b c')).toBe('/glip/groups/a%2Fb%20c');
  });
});

describe('mention text', () => {
  test('finds the mention being typed before the caret', () => {
    expect(getMentionQuery('@', 1)).toEqual({ query: '', start: 0 });
    expect(getMentionQuery('hi @ad', 6)).toEqual({ query: 'ad', start: 3 });
    expect(getMentionQuery('hi @ada lovelace', 7)).toEqual({ query: 'ada', start: 3 });
    expect(getMentionQuery('line\n@bo', 8)).toEqual({ query: 'bo', start: 5 });
  });

  test('returns null when the caret is not in a mention', () => {
    expect(getMentionQuery('hi', 2)).toBeNull();
    expect(getMentionQuery('mail@ada', 8)).toBeNull();
    expect(getMentionQuery('hi @ada lovelace', 16)).toBeNull();
    expect(getMentionQuery('@@a', 3)).toBeNull();
  });

  test('inserts the mention and moves the caret after it', () => {
    expect(
      insertMention({ text: 'hi @ad there', start: 3, caret: 6, name: 'Ada Lovelace' }),
    ).toEqual({ text: 'hi @Ada Lovelace  there', caret: 17 });
    expect(insertMention({ text: '@', start: 0, caret: 1, name: 'Bob' })).toEqual({
      text: '@Bob ',
      caret: 5,
    });
  });

  test('serializes mentions still in the text', () => {
    expect(
      serializeMentions('@Ada Lovelace and @Bob, hi', [
        { id: '1', name: 'Ada Lovelace' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Removed' },
      ]),
    ).toBe('![:Person](1) and ![:Person](2), hi');
    expect(serializeMentions('@Bob @Bob', [{ id: '2', name: 'Bob' }])).toBe(
      '![:Person](2) @Bob',
    );
    expect(serializeMentions('plain', [])).toBe('plain');
  });
});

describe('getTaskColorClass', () => {
  test('maps task colors to border classes', () => {
    expect(getTaskColorClass('Black')).toBe('border-neutral-b0');
    expect(getTaskColorClass('Red')).toBe('border-danger');
    expect(getTaskColorClass('Orange')).toBe('border-extra-tangerine');
    expect(getTaskColorClass('Yellow')).toBe('border-extra-mango');
    expect(getTaskColorClass('Green')).toBe('border-success');
    expect(getTaskColorClass('Blue')).toBe('border-primary-b');
    expect(getTaskColorClass('Purple')).toBe('border-extra-amethyst');
    expect(getTaskColorClass('Magenta')).toBe('border-extra-wildberry');
  });

  test('falls back to a neutral border', () => {
    expect(getTaskColorClass()).toBe('border-neutral-b3');
    expect(getTaskColorClass('Unknown')).toBe('border-neutral-b3');
  });
});
