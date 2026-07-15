/** @jest-environment jsdom */
import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { SideDrawerView } from '../../src/containers/SideDrawerContainer/SideDrawerView';

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    AiIndicator: createIcon('AiIndicator'),
    AiSparkle: createIcon('AiSparkle'),
    Apps: createIcon('Apps'),
    BubbleLines: createIcon('BubbleLines'),
    BubbleLinesBorder: createIcon('BubbleLinesBorder'),
    Close: createIcon('Close'),
    Contacts: createIcon('Contacts'),
    ContactsBorder: createIcon('ContactsBorder'),
    Fax: createIcon('Fax'),
    FaxBorder: createIcon('FaxBorder'),
    Note: createIcon('Note'),
    NoteBorder: createIcon('NoteBorder'),
    Phone: createIcon('Phone'),
    PhoneBorder: createIcon('PhoneBorder'),
    Sms: createIcon('Sms'),
    SmsBorder: createIcon('SmsBorder'),
    Voicemail: createIcon('Voicemail'),
    VoicemailBorder: createIcon('VoicemailBorder'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      ![
        'anchor',
        'color',
        'component',
        'direction',
        'disableRipple',
        'keepMounted',
        'MoreButtonProps',
        'open',
        'resizeThrottleTime',
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
      'data-sign': props['data-sign'],
      'data-testid': props['data-testid'] || props['data-sign'] || testId,
    }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div', 'styled-div');
  styled.img = () => createComponent('img', 'styled-img');
  styled.span = () => createComponent('span', 'styled-span');
  return {
    RcDrawer: ({ children, variant }) => (
      <section data-testid="drawer" data-variant={variant}>{children}</section>
    ),
    RcIcon: ({ symbol }) => {
      const Symbol = symbol;
      return typeof Symbol === 'function' ? <Symbol /> : <span data-icon={String(symbol)} />;
    },
    RcIconButton: ({ children, onClick, ...props }) => (
      <button
        {...cleanProps(props)}
        data-testid={props['data-testid'] || props['data-sign'] || 'icon-button'}
        type="button"
        onClick={(event) => onClick && onClick(event)}
      >
        {children || 'icon-button'}
      </button>
    ),
    RcTab: ({ icon, label, onClick, value }) => (
      <div data-value={value} role="button" tabIndex={0} onClick={onClick}>
        {icon}
        {label}
      </div>
    ),
    RcTabs: ({ children, onChange }) => (
      <div data-testid="tabs">
        {React.Children.map(children, (child) => (
          React.cloneElement(child, {
            onClick: () => onChange(null, child.props.value),
          })
        ))}
      </div>
    ),
    RcTypography: createComponent('span', 'typography'),
    css: jest.fn(() => ''),
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

jest.mock('../../src/containers/CallDetailsPage', () => ({
  CallDetailsPage: ({ params }) => <div>page:callDetails:{params?.id}</div>,
}));

jest.mock('../../src/containers/SmartNotesPage', () => ({
  SmartNotesPage: ({ showCloseButton }) => (
    <div>page:smartNotes:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/ContactDetailsPage', () => ({
  __esModule: true,
  default: ({ contactId, navigateTo, onClickMailTo }) => (
    <div>
      page:contactDetails:{contactId}
      <button type="button" onClick={() => onClickMailTo('ada@example.com')}>mailto</button>
      <button type="button" onClick={() => navigateTo('/contacts/company/1')}>navigate</button>
    </div>
  ),
}));

jest.mock('../../src/containers/MessageDetailsPage', () => ({
  MessageDetailsPage: ({ params }) => <div>page:messageDetails:{params?.type}</div>,
}));

jest.mock('../../src/containers/ComposeTextPage', () => ({
  __esModule: true,
  default: ({ hideBackButton, showCloseButton }) => (
    <div>page:composeText:{String(hideBackButton)}:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/ConversationPage', () => ({
  ConversationPage: ({ hideBackButton, showCloseButton }) => (
    <div>page:conversation:{String(hideBackButton)}:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/GlipChatPage', () => ({
  GlipChatPage: ({ hideBackButton, showCloseButton }) => (
    <div>page:glipChat:{String(hideBackButton)}:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/LogCallPage', () => ({
  __esModule: true,
  default: ({ hideBackButton, showCloseButton }) => (
    <div>page:logCall:{String(hideBackButton)}:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/LogMessagesPage', () => ({
  __esModule: true,
  default: ({ hideBackButton, showCloseButton }) => (
    <div>page:logConversation:{String(hideBackButton)}:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/WidgetAppsPage', () => ({
  WidgetAppsPage: ({ appId, showCloseButton }) => (
    <div>page:widgetApps:{appId || 'all'}:{String(showCloseButton)}</div>
  ),
}));

jest.mock('../../src/containers/VoicemailDropPage', () => ({
  VoicemailDropPage: ({ callSessionId, hideBackButton, showCloseButton }) => (
    <div>page:voicemailDrop:{callSessionId}:{String(hideBackButton)}:{String(showCloseButton)}</div>
  ),
}));

function createProps(overrides = {}) {
  return {
    closeWidget: jest.fn(),
    contact: { id: 'contact-1' },
    contactSourceRenderer: jest.fn(),
    currentWidgetId: null,
    extended: true,
    gotoWidget: jest.fn(),
    mainPath: '/messages',
    navigateTo: jest.fn(),
    onAttachmentDownload: jest.fn(),
    sourceIcons: {},
    variant: 'permanent',
    widgets: [],
    ...overrides,
  };
}

function getByExactTextContent(text) {
  return screen.getAllByText((_, node) => node?.textContent === text)[0];
}

describe('SideDrawerView', () => {
  beforeEach(() => {
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders nothing when the drawer has no temporary widget or no extension space', () => {
    const { container, rerender } = render(
      <SideDrawerView {...createProps({ extended: false })} />,
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <SideDrawerView {...createProps({ variant: 'temporary' })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders empty summaries by main path when no current widget is selected', () => {
    const { rerender } = render(
      <SideDrawerView {...createProps({ mainPath: '/contacts' })} />,
    );
    expect(screen.getByText('Select an item on the left for a more detailed look.')).toBeTruthy();

    rerender(
      <SideDrawerView {...createProps({ mainPath: '/messages/voicemail' })} />,
    );
    expect(screen.getByText('Voicemail summary')).toBeTruthy();
    rerender(
      <SideDrawerView {...createProps({ mainPath: '/messages/fax' })} />,
    );
    expect(screen.getByText('Fax summary')).toBeTruthy();
    rerender(
      <SideDrawerView {...createProps({ mainPath: '/history/recordings' })} />,
    );
    expect(screen.getByText('Recording details')).toBeTruthy();
    rerender(
      <SideDrawerView {...createProps({ mainPath: '/glip' })} />,
    );
    expect(screen.getByText('Chat details')).toBeTruthy();
  });

  it('renders each widget page branch with close, mail, navigate, and enter-key handling', () => {
    const closeWidget = jest.fn();
    const navigateTo = jest.fn();
    const { rerender } = render(
      <SideDrawerView
        {...createProps({
          closeWidget,
          currentWidgetId: 'callDetails',
          navigateTo,
          widgets: [{
            id: 'callDetails',
            name: 'Call',
            params: { id: 'call-1' },
            showCloseButton: true,
            showTitle: true,
          }],
        })}
      />,
    );
    expect(screen.getByText('Call')).toBeTruthy();
    expect(getByExactTextContent('page:callDetails:call-1')).toBeTruthy();
    fireEvent.click(screen.getByTestId('sideDrawerModalCloseButton'));
    expect(closeWidget).toHaveBeenCalledWith('callDetails');

    const cases = [
      {
        expected: 'page:smartNotes:true',
        widget: { id: 'smartNotes', name: 'Smart Notes' },
      },
      {
        expected: 'page:messageDetails:Fax',
        widget: { id: 'messageDetails', name: 'Fax', params: { type: 'Fax' } },
      },
      {
        expected: 'page:composeText:true:true',
        widget: { id: 'composeText', name: 'Compose' },
      },
      {
        expected: 'page:conversation:true:true',
        widget: { id: 'conversation', name: 'Conversation' },
      },
      {
        expected: 'page:glipChat:true:true',
        widget: { id: 'glipChat', name: 'Chat' },
      },
      {
        expected: 'page:logCall:true:true',
        widget: { id: 'logCall', name: 'Log Call' },
      },
      {
        expected: 'page:logConversation:true:true',
        widget: { id: 'logConversation', name: 'Log Message' },
      },
      {
        expected: 'page:widgetApps:all:true',
        widget: { id: 'widgetApps', name: 'Apps' },
      },
      {
        expected: 'page:widgetApps:crm:true',
        widget: { id: 'widgetApps-crm', name: 'CRM', params: { appId: 'crm' } },
      },
      {
        expected: 'page:voicemailDrop:session-1:true:true',
        widget: {
          id: 'voicemailDrop',
          name: 'Voicemail',
          params: { callSessionId: 'session-1' },
        },
      },
    ];

    cases.forEach(({ expected, widget }) => {
      rerender(
        <SideDrawerView
          {...createProps({
            closeWidget,
            currentWidgetId: widget.id,
            navigateTo,
            widgets: [widget],
          })}
        />,
      );
      expect(getByExactTextContent(expected)).toBeTruthy();
    });

    rerender(
      <SideDrawerView
        {...createProps({
          closeWidget,
          currentWidgetId: 'contactDetails',
          navigateTo,
          widgets: [{
            id: 'contactDetails',
            name: 'Contact',
            params: { contactId: 'contact-1' },
          }],
        })}
      />,
    );
    fireEvent.click(screen.getByText('mailto'));
    expect(window.open).toHaveBeenCalledWith('mailto:ada@example.com');
    fireEvent.click(screen.getByText('navigate'));
    expect(navigateTo).toHaveBeenCalledWith('/contacts/company/1');
    fireEvent.keyDown(screen.getByText(/page:contactDetails/).parentElement, {
      key: 'Enter',
      stopPropagation: jest.fn(),
    });
  });

  it('renders tabs, switches widgets, and closes the active tab without bubbling', () => {
    jest.useFakeTimers();
    const closeWidget = jest.fn();
    const gotoWidget = jest.fn();
    render(
      <SideDrawerView
        {...createProps({
          closeWidget,
          currentWidgetId: 'messageDetails',
          gotoWidget,
          widgets: [
            { id: 'contactDetails', name: 'Contact', params: { contactId: 'contact-1' } },
            { id: 'callDetails', name: 'Call', params: { id: 'call-1' } },
            { id: 'smartNotes', name: 'Smart Notes' },
            { id: 'messageDetails', name: 'Voicemail', params: { type: 'VoiceMail' } },
            { id: 'messageDetails-fax', icon: 'https://example.com/fax.png', name: 'Fax' },
            { id: 'composeText', name: 'Compose' },
            { id: 'conversation', name: 'Conversation' },
            { id: 'glipChat', name: 'Chat' },
            { id: 'logCall', name: 'Log Call' },
            { id: 'logConversation', name: 'Log Message' },
            { id: 'widgetApps', name: 'Apps' },
            { id: 'voicemailDrop', name: 'Voicemail Drop', params: { callSessionId: 's1' } },
          ],
        })}
      />,
    );
    act(() => {
      jest.runOnlyPendingTimers();
    });

    fireEvent.click(screen.getByText('Contact'));
    expect(gotoWidget).toHaveBeenCalledWith('contactDetails');
    fireEvent.click(screen.getByText('icon-button'));
    expect(closeWidget).toHaveBeenCalledWith('messageDetails');
    expect(screen.getByText('page:messageDetails:VoiceMail')).toBeTruthy();
  });
});
