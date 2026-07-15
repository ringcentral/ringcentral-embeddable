/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import {
  formatFistLineWithMentions,
  getPostAbstract,
  replaceAtTeamText,
  replaceEmojiText,
} from '../../src/components/GlipChatPanel/formatPost';
import isPicture from '../../src/components/GlipChatPanel/formatPost';
import { NotesDialog } from '../../src/components/ConversationPanel/NotesDialog';

jest.mock('@emoji-mart/data', () => ({}));

jest.mock('emoji-mart', () => ({
  init: jest.fn(),
  SearchIndex: {
    get: jest.fn((code) => (
      code === 'smile'
        ? { skins: [{ native: 'SMILE' }] }
        : null
    )),
  },
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => {
    function MockIcon() {
      return <span data-icon={name} />;
    }
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    Close: createIcon('Close'),
    Delete: createIcon('Delete'),
    Edit: createIcon('Edit'),
    MoreVert: createIcon('MoreVert'),
    Notes: createIcon('Notes'),
    SaveDraft: createIcon('SaveDraft'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'anchorEl',
        'clearBtn',
        'color',
        'component',
        'disableTypography',
        'fullWidth',
        'helperText',
        'icon',
        'minRows',
        'multiline',
        'size',
        'symbol',
        'variant',
      ].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const getButtonText = (props) => (
    props.title ||
    props['aria-label'] ||
    props.symbol?.displayName ||
    'icon-button'
  );
  const createComponent = (tag, testId) => React.forwardRef((props, ref) => (
    React.createElement(tag, {
      ...cleanProps(props),
      ref,
      'data-testid': props['data-testid'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div', 'styled-div');
  return {
    RcDialog: ({ children, open }) => (open ? <div role="dialog">{children}</div> : null),
    RcDialogContent: createComponent('div', 'dialog-content'),
    RcDialogTitle: createComponent('div', 'dialog-title'),
    RcDivider: createComponent('hr', 'divider'),
    RcIcon: createComponent('span', 'icon'),
    RcIconButton: React.forwardRef((props, ref) => (
      <button
        {...cleanProps(props)}
        ref={ref}
        type="button"
        onClick={props.onClick}
      >
        {getButtonText(props)}
      </button>
    )),
    RcListItemText: ({ primary }) => <span>{primary}</span>,
    RcLoading: ({ children, loading }) => (
      <div>
        {loading ? <span>loading</span> : null}
        {children}
      </div>
    ),
    RcMenu: ({ children, open }) => (open ? <div role="menu">{children}</div> : null),
    RcMenuItem: ({ children, onClick }) => (
      <button type="button" role="menuitem" onClick={onClick}>
        {children}
      </button>
    ),
    RcTextField: React.forwardRef((props, ref) => (
      <textarea
        {...cleanProps(props)}
        ref={ref}
        aria-label={props.placeholder}
        onChange={props.onChange}
        onKeyDown={props.onKeyDown}
        placeholder={props.placeholder}
        value={props.value}
      />
    )),
    RcTypography: createComponent('span', 'typography'),
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

function createNote(overrides = {}) {
  return {
    author: {
      extensionId: '101',
      name: 'Ada Lovelace',
    },
    creationTime: 1000,
    id: 'note-1',
    text: 'First note',
    ...overrides,
  };
}

function createDialogProps(overrides = {}) {
  return {
    dateTimeFormatter: jest.fn(({ utcTimestamp }) => `time-${utcTimestamp}`),
    loading: false,
    myExtensionId: '101',
    notes: [
      createNote({
        creationTime: 1000,
        id: 'old-note',
        text: 'Old note',
      }),
      createNote({
        creationTime: '1970-01-01T00:00:02.000Z',
        id: 'new-note',
        text: 'New note',
      }),
    ],
    onClose: jest.fn(),
    onCreateNote: jest.fn(async () => {}),
    onDeleteNote: jest.fn(async () => {}),
    onUpdateNote: jest.fn(async () => {}),
    open: true,
    readOnly: false,
    ...overrides,
  };
}

describe('Glip chat post formatting', () => {
  it('detects pictures and formats post abstracts', () => {
    expect(isPicture('https://example.com/image.png?download=true')).toBe(true);
    expect(isPicture('https://example.com/file', 'diagram.svg')).toBe(true);
    expect(isPicture('https://example.com/file.pdf')).toBe(false);
    expect(formatFistLineWithMentions(
      'Hello ![:Person](member-1)\nsecond line',
      [{ id: 'member-1', name: 'Grace Hopper', type: 'Person' }],
    )).toBe('Hello @Grace Hopper');
    expect(getPostAbstract({
      attachments: [{ contentUri: 'https://example.com/photo.jpg?x=1' }],
    })).toBe('shared a picture');
    expect(getPostAbstract({
      attachments: [{ contentUri: 'https://example.com/document.pdf?x=1' }],
    })).toBe('shared a file');
    expect(getPostAbstract({ type: 'PersonJoined' })).toBe('joined the team');
    expect(getPostAbstract({
      addedPersonIds: ['member-1', 'missing-member'],
      type: 'PersonsAdded',
    }, [{
      firstName: 'Grace',
      id: 'member-1',
      lastName: 'Hopper',
    }])).toBe('added @Grace Hopper @missing-member to the team');
  });

  it('replaces emoji aliases and at-team markup', () => {
    const atTeamHtml = "Hi <a class='at_mention_compose' rel='{\"id\":-1}'>All Engineers</a>";
    expect(replaceEmojiText('Hello :smile: :unknown:')).toBe('Hello SMILE unknown');
    expect(replaceAtTeamText(atTeamHtml)).toBe('Hi ![:All](All Engineers)');
    expect(replaceAtTeamText(atTeamHtml, true)).toBe('Hi All Engineers');
    expect(getPostAbstract({
      mentions: [],
      text: `${atTeamHtml} :smile:\nIgnored`,
    })).toBe('Hi All Engineers SMILE');
    expect(getPostAbstract(null)).toBeNull();
    expect(formatFistLineWithMentions(null, [])).toBeNull();
  });
});

describe('NotesDialog', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('creates notes, sorts notes by newest first, edits, deletes, and closes', async () => {
    const props = createDialogProps();
    render(<NotesDialog {...props} />);

    const noteTexts = screen.getAllByText(/note$/).map((node) => node.textContent);
    expect(noteTexts).toEqual(['New note', 'Old note']);
    expect(props.dateTimeFormatter).toHaveBeenCalledWith({ utcTimestamp: 2000 });
    expect(props.dateTimeFormatter).toHaveBeenCalledWith({ utcTimestamp: 1000 });

    fireEvent.change(screen.getByLabelText('Add a note'), {
      target: { value: '  Created note  ' },
    });
    fireEvent.keyDown(screen.getByLabelText('Add a note'), {
      key: 'Enter',
      shiftKey: false,
    });
    await waitFor(() => {
      expect(props.onCreateNote).toHaveBeenCalledWith('Created note');
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'More options' })[0]);
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit note'), {
      target: { value: 'Updated note' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(props.onUpdateNote).toHaveBeenCalledWith('new-note', 'Updated note');
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'More options' })[0]);
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Delete' }));
    await waitFor(() => {
      expect(props.onDeleteNote).toHaveBeenCalledWith('new-note');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('supports edit cancel, submit guards, loading, empty, readonly, and error paths', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const updateError = new Error('update failed');
    const deleteError = new Error('delete failed');
    const props = createDialogProps({
      onCreateNote: jest.fn(async () => {
        throw new Error('create failed');
      }),
      onDeleteNote: jest.fn(async () => {
        throw deleteError;
      }),
      onUpdateNote: jest.fn(async () => {
        throw updateError;
      }),
    });
    const { rerender } = render(<NotesDialog {...props} />);

    fireEvent.keyDown(screen.getByLabelText('Add a note'), {
      key: 'Enter',
      shiftKey: false,
    });
    expect(props.onCreateNote).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Add a note'), {
      target: { value: 'Create fails' },
    });
    fireEvent.keyDown(screen.getByLabelText('Add a note'), {
      key: 'Enter',
      shiftKey: false,
    });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to create note:', expect.any(Error));
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'More options' })[0]);
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Edit note'), {
      target: { value: 'Update fails' },
    });
    fireEvent.keyDown(screen.getByLabelText('Edit note'), {
      key: 'Enter',
      shiftKey: false,
    });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to update note:', updateError);
    });

    fireEvent.keyDown(screen.getByLabelText('Edit note'), { key: 'Escape' });
    expect(screen.queryByLabelText('Edit note')).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: 'More options' })[0]);
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Delete' }));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to delete note:', deleteError);
    });

    rerender(<NotesDialog {...createDialogProps({
      loading: true,
      notes: [],
      readOnly: true,
    })} />);
    expect(screen.getByText('loading')).toBeTruthy();
    expect(screen.getByText('Track important info by attaching a note to this conversation.')).toBeTruthy();
    expect(screen.queryByLabelText('Add a note')).toBeNull();
    expect(screen.queryByRole('button', { name: 'More options' })).toBeNull();
  });
});
