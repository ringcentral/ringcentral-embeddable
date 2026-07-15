/** @jest-environment jsdom */
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import postStatus from '@ringcentral-integration/commons/modules/GlipPosts/status';

import { GlipChatForm } from '../../src/components/GlipChatPanel/GlipChatForm';
import { GlipPostItem } from '../../src/components/GlipChatPanel/GlipPostItem';
import { MeetingHomePanel } from '../../src/components/MeetingHomePanel/MeetingHomePanel';
import { SmsTemplateDialog } from '../../src/components/SmsTemplateDialog';

const mockHandleCopy = jest.fn();

jest.mock('@ringcentral-integration/widgets/lib/handleCopy', () => ({
  handleCopy: (...args) => mockHandleCopy(...args),
}));

jest.mock('@emoji-mart/data', () => ({}));

jest.mock('@emoji-mart/react', () => (
  function MockPicker({ onEmojiSelect }) {
    return (
      <button
        data-sign="emoji-picker"
        type="button"
        onClick={() => onEmojiSelect({ shortcodes: ':wave:' })}
      >
        select-emoji
      </button>
    );
  }
));

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
    Attachment: createIcon('Attachment'),
    Copy: createIcon('Copy'),
    Delete: createIcon('Delete'),
    Edit: createIcon('Edit'),
    Emoji: createIcon('Emoji'),
    JoinMeeting: createIcon('JoinMeeting'),
    NewAction: createIcon('NewAction'),
    Previous: createIcon('Previous'),
    ScheduleMeeting: createIcon('ScheduleMeeting'),
    SendFilled: createIcon('SendFilled'),
    StartMeeting: createIcon('StartMeeting'),
    UserDefault: createIcon('UserDefault'),
  };
});

function mockCreateJunoMock() {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'anchorEl',
        'anchorOrigin',
        'color',
        'disableTypography',
        'draggableId',
        'droppableId',
        'fullScreen',
        'iconVariant',
        'index',
        'innerRef',
        'isEllipsis',
        'loading',
        'maxActions',
        'secondaryTypographyProps',
        'size',
        'symbol',
        'transformOrigin',
        'type',
        'variant',
      ].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag, testId) => React.forwardRef((props, ref) => (
    React.createElement(tag, {
      ...cleanProps(props),
      ref,
      'data-sign': props['data-sign'] || testId,
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, {
        ...cleanProps(props),
        ref,
        'data-sign': props['data-sign'] || `styled-${Component}`,
        'data-testid': props['data-testid'] || props['data-sign'] || `styled-${Component}`,
      }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div', 'styled-div');
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcAvatar: ({
      children,
      onClick,
      src,
    }) => (
      <button data-sign="avatar" type="button" onClick={onClick}>
        {src || children}
      </button>
    ),
    RcButton: ({
      children,
      disabled,
      onClick,
    }) => (
      <button disabled={disabled} type="button" onClick={onClick}>
        {children}
      </button>
    ),
    RcChip: ({ label }) => <span>{label}</span>,
    RcCircularProgress: ({ size }) => <span>{`progress:${size}`}</span>,
    RcDialog: ({
      children,
      onClose,
      open,
    }) => (
      open ? (
        <section role="dialog">
          <button type="button" onClick={onClose}>dialog-close</button>
          {children}
        </section>
      ) : null
    ),
    RcDialogContent: createComponent('div', 'dialog-content'),
    RcDialogTitle: createComponent('h2', 'dialog-title'),
    RcDragDropContext: ({ children, onDragEnd }) => (
      <section data-sign="drag-context">
        <button
          type="button"
          onClick={() => onDragEnd({
            destination: null,
            source: { index: 0 },
          })}
        >
          drag-none
        </button>
        <button
          type="button"
          onClick={() => onDragEnd({
            destination: { index: 0 },
            source: { index: 0 },
          })}
        >
          drag-same
        </button>
        <button
          type="button"
          onClick={() => onDragEnd({
            destination: { index: 1 },
            source: { index: 0 },
          })}
        >
          drag-move
        </button>
        {children}
      </section>
    ),
    RcDragHandle: createComponent('span', 'drag-handle'),
    RcDraggable: ({ children }) => children({
      dragHandleProps: {},
      draggableProps: {},
      innerRef: jest.fn(),
    }),
    RcDroppable: ({ children }) => children({
      droppableProps: {},
      innerRef: jest.fn(),
      placeholder: <span>placeholder</span>,
    }),
    RcIcon: ({ symbol }) => <span>{symbol?.displayName || 'icon'}</span>,
    RcIconButton: ({
      disabled,
      innerRef,
      loading,
      onClick,
      symbol,
      title,
      ...props
    }) => (
      <button
        data-sign={props['data-sign'] || title || symbol?.displayName || 'icon-button'}
        disabled={disabled || loading}
        ref={innerRef}
        type="button"
        onClick={onClick}
      >
        {title || symbol?.displayName || 'icon-button'}
      </button>
    ),
    RcList: createComponent('div', 'list'),
    RcListItem: createComponent('div', 'list-item'),
    RcListItemAvatar: createComponent('span', 'list-item-avatar'),
    RcListItemIcon: createComponent('span', 'list-item-icon'),
    RcListItemSecondaryAction: createComponent('span', 'list-item-secondary-action'),
    RcListItemText: ({
      onClick,
      primary,
      secondary,
    }) => (
      <button data-sign={`item-text-${primary || 'unknown'}`} type="button" onClick={onClick}>
        <span>{primary}</span>
        <span>{secondary}</span>
      </button>
    ),
    RcLoading: ({ children, loading }) => (
      <section>
        {loading ? <span>loading</span> : null}
        {children}
      </section>
    ),
    RcPopover: ({
      children,
      onClose,
      open,
    }) => (
      open ? (
        <section data-sign="popover">
          <button type="button" onClick={onClose}>close-popover</button>
          {children}
        </section>
      ) : null
    ),
    RcTooltip: ({ children }) => <>{children}</>,
    RcTypography: ({ children }) => <span>{children}</span>,
    palette2: jest.fn(() => '#000'),
    styled,
  };
}

jest.mock('@ringcentral/juno', () => mockCreateJunoMock());

jest.mock('../../src/components/ActionMenu', () => ({
  ActionMenu: ({
    actions = [],
    onMoreMenuOpen,
  }) => (
    <section data-sign="action-menu">
      <button type="button" onClick={() => onMoreMenuOpen?.(true)}>
        open-menu
      </button>
      {actions.map((action) => (
        <button
          disabled={action.disabled}
          key={action.title}
          type="button"
          onClick={action.onClick}
        >
          {action.title}
        </button>
      ))}
    </section>
  ),
}));

jest.mock('../../src/components/ConfirmDialog', () => ({
  ConfirmDialog: ({
    onClose,
    onConfirm,
    open,
    title,
  }) => (
    open ? (
      <section role="dialog">
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>confirm</button>
        <button type="button" onClick={onClose}>cancel</button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/SmsTemplateDialog/EditDialog', () => ({
  EditDialog: ({
    editingTemplate,
    onChange,
    onClose,
    onSave,
    open,
  }) => (
    open ? (
      <section role="dialog">
        <span>{`edit:${editingTemplate.displayName || 'new'}`}</span>
        <button
          type="button"
          onClick={() => onChange({
            ...editingTemplate,
            displayName: 'Edited template',
            body: { text: 'Edited text' },
          })}
        >
          change-edit
        </button>
        <button type="button" onClick={onSave}>save-edit</button>
        <button type="button" onClick={onClose}>close-edit</button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/GlipChatPanel/GlipTextInput', () => {
  const React = require('react');
  const GlipTextInput = React.forwardRef(({
    disabled,
    onChange,
    placeholder,
    value,
  }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getSelection: () => ({ index: value ? value.length : 0 }),
      insertText: (position, text) => onChange({
        target: {
          value: `${value || ''}${text}@${position}`,
        },
      }),
    }));
    return (
      <input
        aria-label="glip-text"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    );
  });
  return {
    GlipTextInput,
  };
});

jest.mock('../../src/components/GlipChatPanel/GlipPostContent', () => ({
  GlipPostContent: ({ post }) => <span>{`content:${post.text || 'none'}`}</span>,
}));

jest.mock('../../src/components/UpcomingMeetingList', () => ({
  __esModule: true,
  default: ({ meetings, onJoin }) => (
    <section data-sign="upcoming-meetings">
      {meetings.map((meeting) => (
        <button key={meeting.id} type="button" onClick={() => onJoin(meeting.id)}>
          {`meeting:${meeting.id}`}
        </button>
      ))}
    </section>
  ),
}));

jest.mock('../../src/components/MeetingHomePanel/JoinDialog', () => ({
  JoinDialog: ({
    meetingId,
    onClose,
    onJoin,
    onMeetingIdChange,
    open,
  }) => (
    open ? (
      <section role="dialog">
        <input
          aria-label="meeting-id"
          value={meetingId}
          onChange={onMeetingIdChange}
        />
        <button type="button" onClick={onJoin}>join-meeting</button>
        <button type="button" onClick={onClose}>close-join</button>
      </section>
    ) : null
  ),
}));

jest.mock('../../src/components/MeetingHomePanel/noResult.svg', () => (
  function NoResultSvg() {
    return <span>no-result-svg</span>;
  }
));

jest.mock('../../src/components/MeetingHomePanel/i18n', () => ({
  getString: jest.fn((key) => key),
}));

function createTemplates() {
  return [
    {
      body: { text: 'First body' },
      displayName: 'First template',
      id: 'template-1',
      scope: 'Personal',
    },
    {
      body: { text: 'Second body' },
      displayName: 'Second template',
      id: 'template-2',
      scope: 'Personal',
    },
    {
      body: { text: 'Company body' },
      displayName: 'Company template',
      id: 'template-3',
      scope: 'Company',
    },
  ];
}

describe('template, chat, and meeting flow components', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('runs sms template apply, copy, edit, delete, add, and sort flows', async () => {
    const props = {
      createOrUpdateTemplate: jest.fn(async () => {}),
      deleteTemplate: jest.fn(async () => {}),
      loadTemplates: jest.fn(),
      onApply: jest.fn(),
      onClose: jest.fn(),
      open: true,
      showTemplateManagement: true,
      sortTemplates: jest.fn(),
      templates: createTemplates(),
    };
    render(<SmsTemplateDialog {...props} />);

    expect(props.loadTemplates).toHaveBeenCalled();
    fireEvent.click(screen.getAllByText('Apply')[0]);
    expect(props.onApply).toHaveBeenCalledWith('First body');

    fireEvent.click(screen.getAllByText('Copy')[0]);
    expect(mockHandleCopy).toHaveBeenCalledWith('First body');

    fireEvent.click(screen.getByText('drag-none'));
    fireEvent.click(screen.getByText('drag-same'));
    fireEvent.click(screen.getByText('drag-move'));
    expect(props.sortTemplates).toHaveBeenCalledWith([
      'template-2',
      'template-1',
      'template-3',
    ]);

    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(screen.getByText('edit:First template')).toBeTruthy();
    fireEvent.click(screen.getByText('change-edit'));
    fireEvent.click(screen.getByText('save-edit'));
    await waitFor(() => {
      expect(props.createOrUpdateTemplate).toHaveBeenCalledWith(expect.objectContaining({
        displayName: 'Edited template',
      }));
    });

    fireEvent.click(screen.getByText('New template'));
    expect(screen.getByText('edit:new')).toBeTruthy();
    fireEvent.click(screen.getByText('save-edit'));
    await waitFor(() => {
      expect(props.createOrUpdateTemplate).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getAllByText('Delete')[0]);
    fireEvent.click(screen.getByText('confirm'));
    await waitFor(() => {
      expect(props.deleteTemplate).toHaveBeenCalledWith('template-1');
    });

    fireEvent.click(screen.getByText('Previous'));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('runs glip chat form emoji, upload, typing, and submit flows', async () => {
    const props = {
      disabled: false,
      members: [{ id: 'person-1', name: 'Ada' }],
      onSubmit: jest.fn(async () => {}),
      onTextChange: jest.fn(),
      onUploadFile: jest.fn(async () => {}),
      placeholder: 'Message team',
      textValue: 'hello',
    };
    render(<GlipChatForm {...props} />);

    fireEvent.change(screen.getByLabelText('glip-text'), {
      target: { value: 'typed' },
    });
    expect(props.onTextChange).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Emoji'));
    fireEvent.click(screen.getByText('select-emoji'));
    expect(props.onTextChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'hello :wave: @5' }),
    }));

    fireEvent.change(document.querySelector('input[type="file"]'), {
      target: {
        files: [new File(['upload'], 'team.txt', { type: 'text/plain' })],
      },
    });
    await waitFor(() => {
      expect(props.onUploadFile).toHaveBeenCalledWith('team.txt', expect.any(ArrayBuffer));
    });

    fireEvent.click(screen.getByText('SendFilled'));
    await waitFor(() => {
      expect(props.onSubmit).toHaveBeenCalled();
    });
  });

  it('renders glip post creator, status, text, and non-text variants', () => {
    const viewProfile = jest.fn();
    const atRender = jest.fn(({ id }) => `person-${id}`);
    const creator = {
      avatar: 'https://example.com/avatar.png',
      firstName: 'Ada',
      id: 'creator-1',
      lastName: 'Lovelace',
    };
    const { rerender } = render(
      <GlipPostItem
        atRender={atRender}
        creationTime="10:00"
        post={{
          creator,
          sendStatus: postStatus.creating,
          text: 'Hello',
          type: 'TextMessage',
        }}
        viewProfile={viewProfile}
      />,
    );

    fireEvent.click(screen.getByText('https://example.com/avatar.png'));
    fireEvent.click(screen.getByText('Ada Lovelace'));
    expect(viewProfile).toHaveBeenCalledWith('creator-1');
    expect(screen.getByText('Sending')).toBeTruthy();
    expect(screen.getByText('content:Hello')).toBeTruthy();

    rerender(
      <GlipPostItem
        atRender={atRender}
        post={{
          addedPersonIds: ['p1', 'p2'],
          creator: null,
          sendStatus: 'failed',
          type: 'PersonsAdded',
        }}
        viewProfile={viewProfile}
      />,
    );
    expect(screen.getByText('Send failed')).toBeTruthy();
    expect(screen.getByText('added')).toBeTruthy();
    expect(atRender).toHaveBeenCalledWith({ id: 'p1', type: 'Person' });

    rerender(
      <GlipPostItem
        atRender={atRender}
        post={{
          creator,
          type: 'PersonJoined',
        }}
        showCreator={false}
        viewProfile={viewProfile}
      />,
    );
    expect(screen.getByText('joined the team')).toBeTruthy();
  });

  it('runs meeting home start, schedule, join, upcoming, and empty states', async () => {
    const props = {
      currentLocale: 'en-US',
      fetchUpcomingMeetings: jest.fn(async () => {}),
      gotoSchedule: jest.fn(),
      onJoin: jest.fn(),
      onStart: jest.fn(),
      upcomingMeetings: [{ id: 'meeting-1' }],
    };
    const { rerender } = render(<MeetingHomePanel {...props} />);

    expect(screen.getByText('progress:35')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('meeting:meeting-1')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('StartMeeting'));
    fireEvent.click(screen.getByText('ScheduleMeeting'));
    fireEvent.click(screen.getByText('JoinMeeting'));
    fireEvent.change(screen.getByLabelText('meeting-id'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('join-meeting'));
    fireEvent.click(screen.getByText('meeting:meeting-1'));
    expect(props.onStart).toHaveBeenCalled();
    expect(props.gotoSchedule).toHaveBeenCalled();
    expect(props.onJoin).toHaveBeenCalledWith('123456');
    expect(props.onJoin).toHaveBeenCalledWith('meeting-1');

    rerender(
      <MeetingHomePanel
        {...props}
        fetchUpcomingMeetings={jest.fn(async () => {})}
        upcomingMeetings={[]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('noUpcomingMeeting')).toBeTruthy();
    });
  });
});
