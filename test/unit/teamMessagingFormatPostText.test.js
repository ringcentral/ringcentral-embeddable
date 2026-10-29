import {
  AT_TEAM_TOKEN,
  getPostAbstract,
  isPicture,
  replaceAtTeamText,
  replaceEmojiText,
} from '../../src/app/views/TeamMessagingView/formatPostText';

// The services index pulls in data fetcher modules the next-core mock lacks.
jest.mock('../../src/app/services/TeamMessaging', () => ({
  ...jest.requireActual('../../src/app/services/TeamMessaging/getChatItems'),
  ...jest.requireActual('../../src/app/services/TeamMessaging/taskPosts'),
  getNoteAttachments: jest.requireActual(
    '../../src/app/services/TeamMessaging/TeamMessagingNotes',
  ).getNoteAttachments,
}));

jest.mock('../../src/app/views/TeamMessagingView/i18n', () => {
  const enUS = jest.requireActual(
    '../../src/app/views/TeamMessagingView/i18n/en-US',
  ).default;
  return {
    __esModule: true,
    default: {},
    t: (key, options = {}) =>
      (enUS[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => options[name]),
  };
});

const AT_TEAM_ANCHOR = "<a class='at_mention_compose' rel='{\"id\":-1}'>@Team</a>";

describe('isPicture', () => {
  test('detects pictures by URI or name', () => {
    expect(isPicture('https://example.com/a.PNG?token=1')).toBe(true);
    expect(isPicture('https://example.com/a.webp?x')).toBe(true);
    expect(isPicture(undefined, 'Photo.JPEG')).toBe(true);
    expect(isPicture('https://example.com/file', 'icon.svg')).toBe(true);
  });

  test('does not treat other files as pictures', () => {
    expect(isPicture('https://example.com/a.png')).toBe(false);
    expect(isPicture('https://example.com/a.pdf?x', 'a.pdf')).toBe(false);
    expect(isPicture(undefined, 'png')).toBe(false);
    expect(isPicture()).toBe(false);
  });
});

describe('replaceEmojiText', () => {
  test('replaces known shortcodes and keeps unknown ones', () => {
    const lookup = (code) => ({ smile: '😄', '+1': '👍' })[code];
    expect(replaceEmojiText('hi :smile: :+1: :unknown:', lookup)).toBe(
      'hi 😄 👍 :unknown:',
    );
  });

  test('returns the text unchanged without a lookup', () => {
    expect(replaceEmojiText('hi :smile:')).toBe('hi :smile:');
  });
});

describe('replaceAtTeamText', () => {
  test('turns the @Team anchor into a mention token', () => {
    expect(replaceAtTeamText(`hello ${AT_TEAM_ANCHOR}!`)).toBe(
      'hello ![:All](@Team)!',
    );
  });

  test('turns the @Team anchor into plain text for a preview', () => {
    expect(replaceAtTeamText(`${AT_TEAM_ANCHOR} ${AT_TEAM_ANCHOR}`, true)).toBe(
      '@Team @Team',
    );
  });

  test('leaves other anchors alone', () => {
    const text = "<a class='other' rel='{\"id\":1}'>@Ada</a>";
    expect(replaceAtTeamText(text)).toBe(text);
  });

  test('exports the @Team token', () => {
    expect(AT_TEAM_TOKEN).toBe('![:Team](-1)');
  });
});

describe('getPostAbstract', () => {
  const members = [
    { id: 'ada', firstName: 'Ada', lastName: 'Lovelace' },
    { id: 'bob', email: 'bob@example.com' },
  ];
  const abstract = (post, emojiLookup) =>
    getPostAbstract({ post, members, emojiLookup });

  test('describes join and add posts', () => {
    expect(abstract({ type: 'PersonJoined' })).toBe('joined the team');
    expect(
      abstract({ type: 'PersonsAdded', addedPersonIds: ['ada', 'bob', 'x'] }),
    ).toBe('added @Ada Lovelace @bob@example.com @x to the team');
  });

  test('describes task activities by status', () => {
    const task = {
      type: 'Task',
      id: 't',
      subject: 'Ship',
      creationTime: '2026-01-01T00:00:00.000Z',
    };
    const later = '2026-01-01T00:01:00.000Z';
    const activity = (status) =>
      abstract({ creationTime: later, attachments: [{ ...task, status }] });
    expect(activity('Completed')).toBe('Completed task: Ship');
    expect(activity('Pending')).toBe('Reopened task: Ship');
    expect(activity('InProgress')).toBe('Updated task: Ship');
    expect(abstract({ mentions: [{ type: 'Task', id: 't' }] })).toBe(
      'Updated task: ',
    );
  });

  test('describes task and note posts', () => {
    expect(
      abstract({
        creationTime: '2026-01-01T00:00:00.000Z',
        attachments: [
          { type: 'Task', id: 't', subject: 'Ship', creationTime: '2026-01-01T00:00:00.000Z' },
        ],
      }),
    ).toBe('Task: Ship');
    expect(abstract({ attachments: [{ type: 'Note', id: 'n', title: 'Plan' }] })).toBe(
      'Note: Plan',
    );
    expect(abstract({ attachments: [{ type: 'Note', id: 'n' }] })).toBe('Note: ');
  });

  test('describes shared files without text', () => {
    expect(
      abstract({ attachments: [{ type: 'File', name: 'photo.png' }] }),
    ).toBe('shared a picture');
    expect(
      abstract({ attachments: [{ type: 'File', contentUri: 'https://x/a.gif?y' }] }),
    ).toBe('shared a picture');
    expect(abstract({ attachments: [{ type: 'File', name: 'doc.pdf' }] })).toBe(
      'shared a file',
    );
    expect(
      abstract({ text: 'see this', attachments: [{ type: 'File', name: 'doc.pdf' }] }),
    ).toBe('see this');
  });

  test('shows the first line with mentions and emojis', () => {
    const lookup = (code) => (code === 'wave' ? '👋' : undefined);
    expect(
      abstract(
        {
          text: `![:Person](ada) ${AT_TEAM_TOKEN} ${AT_TEAM_ANCHOR} :wave:\nsecond line`,
          mentions: [{ type: 'Person', id: 'ada', name: 'Ada' }],
        },
        lookup,
      ),
    ).toBe('@Ada @Team @Team 👋');
  });

  test('shows an unsupported message for an empty post', () => {
    expect(abstract({})).toBe('Unsupported message');
    expect(abstract({ text: '\nonly second line' })).toBe('Unsupported message');
  });
});
