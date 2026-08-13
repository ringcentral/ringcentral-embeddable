/** @jest-environment jsdom */
import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import RecipientsInput from '../../src/components/RecipientsInput';
import { ContactDropdownList } from '../../src/components/ContactDropdownList';
import {
  ConversationMessageList,
  Message,
  ThreadHintMessage,
} from '../../src/components/ConversationMessageList';

jest.mock('@ringcentral-integration/widgets/components/RecipientsInput/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/RecipientsInput/styles.scss', () => ({
  inputField: 'input-field',
  inputWrapper: 'input-wrapper',
  label: 'label',
  rcuiStyle: 'rcui-style',
  removeButton: 'remove-button',
  rightPanel: 'right-panel',
}));

jest.mock('@ringcentral-integration/widgets/components/ConversationMessageList/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral-integration/widgets/components/ConversationMessageList/SubjectRender', () => ({
  SubjectRender: ({ subject, onLinkClick }) => (
    <button type="button" onClick={onLinkClick}>
      {subject}
    </button>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/RemoveButton', () => ({
  RemoveButton: ({ onClick, visibility }) => (
    <button data-visible={visibility ? 'true' : 'false'} type="button" onClick={onClick}>
      clean
    </button>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/RecipientsInput/SelectedRecipients', () => ({
  SelectedRecipients: ({
    multiple,
    onRemove,
    recipient,
    recipients = [],
  }) => (
    <div data-multiple={multiple ? 'true' : 'false'}>
      {recipient ? <span>{recipient.phoneNumber}</span> : null}
      {recipients.map((item) => (
        <button
          key={item.phoneNumber}
          type="button"
          onClick={() => onRemove(item)}
        >
          {item.name || item.phoneNumber}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@ringcentral-integration/widgets/components/RecipientsInput/focusCampo', () => ({
  focusCampo: jest.fn((input) => input.focus()),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    Disposition: createIcon('Disposition'),
    DefaultFile: createIcon('DefaultFile'),
    Download: createIcon('Download'),
    Notes: createIcon('Notes'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'big',
        'color',
        'inbound',
        'size',
        'symbol',
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
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.a = () => createComponent('a', 'styled-link');
  styled.div = () => createComponent('div', 'styled-div');
  styled.img = () => createComponent('img', 'styled-img');
  styled.input = () => React.forwardRef((props, ref) => (
    <input
      {...cleanProps(props)}
      ref={ref}
      data-testid={props['data-testid'] || props['data-sign'] || 'styled-input'}
    />
  ));
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcCheckbox: ({ checked, onChange }) => (
      <input
        checked={checked}
        data-testid="messageSelectCheckbox"
        readOnly
        type="checkbox"
        onClick={() => onChange?.(null, !checked)}
      />
    ),
    RcIcon: createComponent('span', 'icon'),
    RcIconButton: ({ onClick, title, ...props }) => (
      <button
        data-testid={props['data-sign'] || 'icon-button'}
        title={title}
        type="button"
        onClick={onClick}
      >
        {title}
      </button>
    ),
    RcText: createComponent('span', 'text'),
    RcTypography: createComponent('span', 'typography'),
    css: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    setOpacity: jest.fn(() => '#000'),
    styled,
  };
});

jest.mock('react-virtuoso', () => {
  const React = require('react');
  return {
    Virtuoso: React.forwardRef(({
      data = [],
      itemContent,
      totalCount,
    }, ref) => {
      const scrollToIndex = jest.fn();
      React.useImperativeHandle(ref, () => ({ scrollToIndex }));
      global.__contactDropdownScrollToIndex = scrollToIndex;
      return (
        <div data-testid="virtuoso" data-total={totalCount}>
          {data.map((item, index) => (
            <div key={`${item.phoneNumber}-${index}`}>
              {itemContent(index, item)}
            </div>
          ))}
        </div>
      );
    }),
  };
});

jest.mock('../../src/components/ContactDropdownList/ContactItem', () => ({
  ContactItem: ({
    active,
    contact,
    getPresence,
    hiddenContactInfo,
    onClick,
    onHover,
  }) => (
    <button
      data-active={active ? 'true' : 'false'}
      data-hidden={hiddenContactInfo ? 'true' : 'false'}
      data-presence={getPresence ? getPresence().presenceStatus : 'none'}
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
    >
      {contact.name}:{contact.phoneNumber}
    </button>
  ),
}));

function createRecipientProps(overrides = {}) {
  return {
    addToRecipients: jest.fn(),
    currentLocale: 'en-US',
    detectPhoneNumbers: jest.fn(async () => false),
    formatContactPhone: jest.fn((phoneNumber) => `formatted-${phoneNumber}`),
    onChange: jest.fn(),
    onClean: jest.fn(),
    removeFromRecipients: jest.fn(),
    searchContact: jest.fn(),
    searchContactList: [
      {
        contactId: 'contact-1',
        entityType: 'personal',
        id: 'phone-1',
        name: 'Ada',
        phoneNumber: '+16505550100',
        phoneType: 'mobile',
        type: 'personal',
      },
      {
        contactId: 'contact-2',
        entityType: 'company',
        id: 'phone-2',
        name: 'Grace',
        phoneNumber: '+16505550101',
        phoneType: 'businessPhone',
        presence: { presenceStatus: 'Available' },
        type: 'company',
      },
    ],
    value: '',
    ...overrides,
  };
}

describe('recipient and conversation component flows', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    delete global.__contactDropdownScrollToIndex;
  });

  it('handles recipient typing, keyboard selection, paste fallback, cleaning, and prop sync', async () => {
    jest.useFakeTimers();
    const props = createRecipientProps({
      autoFocus: true,
      multiple: true,
      recipients: [{ name: 'Existing', phoneNumber: '+16505550000' }],
    });
    const inputRef = jest.fn();
    const { rerender } = render(
      <RecipientsInput
        {...props}
        inputRef={inputRef}
      />,
    );
    const input = screen.getByTestId('recipientsInput');

    expect(props.searchContact).toHaveBeenCalledWith('');
    expect(inputRef).toHaveBeenCalledWith(input);
    fireEvent.change(input, { target: { value: 'Ada' } });
    expect(props.onChange).toHaveBeenCalledWith('Ada');
    fireEvent.keyUp(input, { currentTarget: { value: 'Ada' } });
    expect(props.searchContact).toHaveBeenCalledWith('Ada');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(props.addToRecipients).toHaveBeenCalledWith({
      name: 'Ada',
      phoneNumber: '+16505550100',
    });
    fireEvent.change(input, { target: { value: '555' } });
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '123\n456',
      },
    });
    await waitFor(() => {
      expect(props.detectPhoneNumbers).toHaveBeenCalledWith('123\n456');
      expect(props.onChange).toHaveBeenCalledWith('555123 456');
    });
    fireEvent.click(screen.getByText('clean'));
    expect(props.onClean).toHaveBeenCalled();
    fireEvent.click(document.body);
    rerender(
      <RecipientsInput
        {...props}
        inputRef={inputRef}
        value="Synced"
      />,
    );
    expect(props.searchContact).toHaveBeenCalledWith('Synced');
    jest.advanceTimersByTime(300);
    expect(document.activeElement).toBe(screen.getByTestId('recipientsInput'));
  });

  it('renders and scrolls the contact dropdown list with grouped contact rows', () => {
    const addToRecipients = jest.fn();
    const setSelectedIndex = jest.fn();
    const items = [
      {
        contactId: 'contact-1',
        name: 'Ada',
        phoneNumber: '+1',
        type: 'personal',
      },
      {
        contactId: 'contact-1',
        name: 'Ada Work',
        phoneNumber: '+2',
        type: 'personal',
      },
      {
        contactId: 'contact-2',
        name: 'Grace',
        phoneNumber: '+3',
        presence: { presenceStatus: 'Available' },
        type: 'company',
      },
      {
        contactId: 'contact-3',
        name: 'Katherine',
        phoneNumber: '+4',
        type: 'personal',
      },
      {
        contactId: 'contact-4',
        name: 'Mary',
        phoneNumber: '+5',
        type: 'personal',
      },
      {
        contactId: 'contact-5',
        name: 'Dorothy',
        phoneNumber: '+6',
        type: 'personal',
      },
    ];
    const { rerender } = render(
      <ContactDropdownList
        addToRecipients={addToRecipients}
        currentLocale="en-US"
        formatContactPhone={(phoneNumber) => phoneNumber}
        getPresence={(item) => item.presence}
        items={items}
        scrollDirection="ArrowDown"
        selectedIndex={5}
        setSelectedIndex={setSelectedIndex}
        visibility
      />,
    );

    expect(global.__contactDropdownScrollToIndex).toHaveBeenCalledWith(5);
    expect(screen.getByText('Ada Work:+2').dataset.hidden).toBe('true');
    expect(screen.getByText('Grace:+3').dataset.presence).toBe('Available');
    fireEvent.mouseEnter(screen.getByText('Grace:+3'));
    expect(setSelectedIndex).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByText('Grace:+3'));
    expect(addToRecipients).toHaveBeenCalledWith(items[2]);

    rerender(
      <ContactDropdownList
        addToRecipients={addToRecipients}
        currentLocale="en-US"
        formatContactPhone={(phoneNumber) => phoneNumber}
        items={items}
        scrollDirection="ArrowUp"
        selectedIndex={1}
        setSelectedIndex={setSelectedIndex}
        visibility
      />,
    );
    expect(global.__contactDropdownScrollToIndex).toHaveBeenCalledWith(1);
  });

  it('renders message statuses, attachments, thread hints, notes, and top-scroll loading', () => {
    const onAttachmentDownload = jest.fn();
    const onLinkClick = jest.fn();
    const onViewNote = jest.fn();
    const loadPreviousMessages = jest.fn();
    const dateTimeFormatter = jest.fn(({ utcTimestamp, type }) => `${type}-${utcTimestamp}`);
    const baseTime = Date.UTC(2026, 0, 1, 12, 0, 0);
    const messages = [
      {
        creationTime: baseTime,
        direction: 'Outbound',
        from: { name: 'Agent', phoneNumber: '+16505550100' },
        id: 'message-1',
        messageStatus: 'Queued',
        mmsAttachments: [
          {
            contentType: 'image/png',
            id: 'image-1',
            uri: 'https://example.com/image.png',
          },
          {
            contentType: 'application/pdf',
            id: 'file-1',
            uri: 'https://example.com/file',
          },
        ],
        subject: 'Outbound text',
      },
      {
        creationTime: baseTime + 2 * 60 * 60 * 1000,
        direction: 'Outbound',
        from: { phoneNumber: '+16505550101' },
        id: 'message-2',
        messageStatus: 'DeliveryFailed',
        mmsAttachments: [],
        subject: '',
      },
      {
        assignee: { extensionId: '101', name: 'Ada' },
        creationTime: baseTime + 4 * 60 * 60 * 1000,
        from: { name: 'System' },
        id: 'hint-1',
        recordType: 'ThreadAssignedHint',
      },
      {
        author: { name: 'Grace' },
        creationTime: baseTime + 6 * 60 * 60 * 1000,
        from: { name: 'Grace' },
        id: 'note-1',
        recordType: 'AliveNote',
        text: 'Internal note',
      },
      {
        creationTime: baseTime + 8 * 60 * 60 * 1000,
        from: { name: 'System' },
        id: 'hint-2',
        recordType: 'ThreadResolvedHint',
      },
    ];
    const { container } = render(
      <ConversationMessageList
        className="ConversationMessageList"
        currentLocale="en-US"
        dateTimeFormatter={dateTimeFormatter}
        formatPhone={(phoneNumber) => `formatted-${phoneNumber}`}
        loadPreviousMessages={loadPreviousMessages}
        loadingNextPage
        messageSubjectRenderer={undefined}
        messages={messages}
        myExtensionId="101"
        onAttachmentDownload={onAttachmentDownload}
        onLinkClick={onLinkClick}
        onViewNote={onViewNote}
        showSender
        statusReason="ThreadExpired"
      />,
    );

    expect(screen.getByText('loading')).toBeTruthy();
    expect(screen.getByText('Sending')).toBeTruthy();
    expect(screen.getByText('Delivery failure')).toBeTruthy();
    fireEvent.click(screen.getByText('Outbound text'));
    expect(onLinkClick).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle('download'));
    expect(onAttachmentDownload).toHaveBeenCalledWith(
      'https://example.com/file',
      expect.any(Object),
    );
    expect(screen.getByText('Conversation has been assigned to you.')).toBeTruthy();
    expect(screen.getByText('Conversation resolved automatically.')).toBeTruthy();
    fireEvent.click(screen.getByText('Internal note'));
    expect(onViewNote).toHaveBeenCalled();

    const list = container.firstChild;
    Object.defineProperties(list, {
      clientHeight: {
        configurable: true,
        value: 100,
      },
      scrollHeight: {
        configurable: true,
        value: 500,
      },
    });
    list.scrollTop = 30;
    fireEvent.scroll(list);
    list.scrollTop = 10;
    fireEvent.scroll(list);
    expect(loadPreviousMessages).toHaveBeenCalled();
  });

  it('renders individual message and thread hint fallback branches', () => {
    const onAttachmentDownload = jest.fn();
    render(
      <>
        <Message
          currentLocale="en-US"
          direction="Inbound"
          messageStatus="SendingFailed"
          mmsAttachments={[{
            contentType: 'text/plain',
            fileName: 'named.txt',
            id: 'file-2',
            uri: 'https://example.com/named',
          }]}
          onAttachmentDownload={onAttachmentDownload}
          onLinkClick={jest.fn()}
          subject="Inbound text"
          time="10:00"
        />
        <ThreadHintMessage
          assignee={null}
          myExtensionId="101"
          statusReason=""
          time=""
          type="ThreadCreatedHint"
        />
        <ThreadHintMessage
          assignee={null}
          myExtensionId="101"
          statusReason=""
          time=""
          type="ThreadAssignedHint"
        />
        <ThreadHintMessage
          assignee={{ extensionId: '102', name: 'Grace' }}
          myExtensionId="101"
          statusReason=""
          time=""
          type="ThreadAssignedHint"
        />
        <ThreadHintMessage
          assignee={null}
          myExtensionId="101"
          statusReason=""
          time=""
          type="ThreadDeletedHint"
        />
      </>,
    );

    expect(screen.queryByText('Sending failure')).toBeNull();
    expect(screen.getByText('named.txt')).toBeTruthy();
    fireEvent.click(screen.getByTitle('download'));
    expect(onAttachmentDownload).toHaveBeenCalledWith(
      'https://example.com/named',
      expect.any(Object),
    );
    expect(screen.getByText('Conversation has been created.')).toBeTruthy();
    expect(screen.getByText('This conversation is unassigned.')).toBeTruthy();
    expect(screen.getByText('Conversation has been assigned to Grace.')).toBeTruthy();
    expect(screen.getByText('Conversation has been deleted.')).toBeTruthy();
  });

  it('hides selective SMS controls and logged icons when granular logging is disabled', () => {
    const messages = [{
      creationTime: Date.UTC(2024, 0, 1, 10, 0, 0),
      direction: 'Outbound',
      from: { phoneNumber: '+16505550100' },
      id: 'message-logged',
      messageStatus: 'Sent',
      mmsAttachments: [],
      subject: 'Logged text',
    }];
    const baseProps = {
      className: 'ConversationMessageList',
      currentLocale: 'en-US',
      dateTimeFormatter: jest.fn(() => 'date'),
      formatPhone: jest.fn((phoneNumber) => phoneNumber),
      loadPreviousMessages: jest.fn(),
      messageSubjectRenderer: undefined,
      messages,
      myExtensionId: '101',
      onAttachmentDownload: jest.fn(),
      onLinkClick: jest.fn(),
      onViewNote: jest.fn(),
      statusReason: '',
      messageLogStateMap: {
        'message-logged': { logId: 'crm-log-1' },
      },
    };
    const { rerender } = render(
      <ConversationMessageList
        {...baseProps}
        selectionEnabled
      />,
    );

    expect(screen.getByTestId('messageLoggedIcon')).toBeTruthy();

    rerender(
      <ConversationMessageList
        {...baseProps}
        selectionEnabled={false}
      />,
    );

    expect(screen.queryByTestId('messageLoggedIcon')).toBeNull();
    expect(screen.queryByTestId('messageSelectCheckbox')).toBeNull();
  });
});
