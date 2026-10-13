import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { createComposeTextPanel } from '../../src/app/views/ComposeTextView/createComposeTextPanel';
import { createConversationPanel } from '../../src/app/views/ConversationView/createConversationPanel';
import { useAdditionalMessageButtons } from '../../src/app/views/ConversationsView/useAdditionalMessageButtons';
import { useConversationActionButtons } from '../../src/app/views/ConversationsView/useConversationActionButtons';
import { FaxDetailsPanel } from '../../src/app/views/FaxDetailsView/FaxDetailsPanel';
import { VoicemailPage } from '../../src/app/views/VoicemailView';

jest.mock(
  '../../src/app/views/ConversationsView/useAdditionalMessageButtons',
  () => ({
    useAdditionalMessageButtons: jest.fn(() => [
      { actionType: 'msgBtn', label: 'Message action' },
    ]),
  }),
);

jest.mock('../../src/app/components/SmsToolbarButtons', () => ({
  SmsToolbarButtons: () => <span data-sign="smsToolbarButtons" />,
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  ActionMenuList: ({ buttons }) => (
    <div data-sign="actionMenuList">
      {buttons.map(({ actionType, label }) => (
        <button data-sign={actionType} key={actionType} type="button">
          {label}
        </button>
      ))}
    </div>
  ),
  PageHeader: () => null,
  useHistoryActionButtons: (actions) =>
    actions.map(({ type }) => ({ actionType: type, label: type })),
}));

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppFooterNav: () => null,
  AppHeaderNav: ({ children }) => <header>{children}</header>,
  CopyIconButtonSpring: () => null,
}));

jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  VoicemailPlayer: () => <div data-sign="voicemailPlayer" />,
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/VoicemailView/VoicemailPage/i18n',
  () => ({ __esModule: true, default: {} }),
);

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/ConversationsListItem/helpers',
  () => ({ getDetail: () => '1 page' }),
);

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/useConversationActionButtons',
  () => ({ ConversationLogPopover: () => null }),
);

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ComposeTextViewSpring/ComposeTextPanel',
  () => ({
    ComposeTextPanel: ({ toolbar }) => (
      <div data-sign="composeToolbar">{toolbar}</div>
    ),
  }),
);

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel',
  () => ({
    ConversationPanel: ({ toolbar }) => (
      <div data-sign="conversationToolbar">{toolbar}</div>
    ),
  }),
);

const info = {
  Avatar: () => null,
  DisplayName: () => null,
  creationTime: '10:00 AM',
  formattedPhoneNumber: '+16505550100',
  myCallerId: '+16505550200',
  myCallerIdTitle: 'To',
};

const useConversationItemInfo = () => ({
  actions: [{ type: 'call' }],
  info,
});

const useActionsHandler = () => jest.fn();

function ConversationButtonsHost({ conversation }) {
  return useConversationActionButtons({
    actions: [{ type: 'call' }],
    additionalButtons: [{ actionType: 'msgBtn', label: 'Message action' }],
    conversation,
    onAction: jest.fn(),
    refreshContactButton: null,
  });
}

function getButtonLabels() {
  return within(screen.getByTestId('actionMenuList'))
    .getAllByRole('button')
    .map((button) => button.textContent);
}

beforeEach(() => {
  useAdditionalMessageButtons.mockClear();
});

describe('third-party message actions', () => {
  test('follow the built-in buttons on a conversation row', () => {
    render(<ConversationButtonsHost conversation={{ conversationMatches: [] }} />);

    expect(getButtonLabels()).toEqual(['call', 'Message action']);
  });

  test('follow the built-in buttons on fax details', () => {
    const fax = { conversationId: 'fax-id', self: {} };

    render(
      <FaxDetailsPanel
        fax={fax}
        goBack={jest.fn()}
        useActionsHandler={useActionsHandler}
        useConversationItemInfo={useConversationItemInfo}
      />,
    );

    expect(getButtonLabels()).toEqual(['call', 'Message action']);
    expect(useAdditionalMessageButtons).toHaveBeenCalledWith(fax);
  });

  test('follow the built-in buttons on voicemail details', () => {
    const voicemail = { conversationId: 'voicemail-id' };

    render(
      <VoicemailPage
        currentVoicemail={voicemail}
        goBack={jest.fn()}
        onDownload={jest.fn()}
        onStartLoad={jest.fn()}
        updateAudioStatus={jest.fn()}
        useActionsHandler={useActionsHandler}
        useConversationItemInfo={useConversationItemInfo}
      />,
    );

    expect(getButtonLabels()).toEqual(['call', 'Message action']);
    expect(useAdditionalMessageButtons).toHaveBeenCalledWith(voicemail);
  });
});

describe('third-party SMS toolbar buttons', () => {
  test('follow the upstream toolbar in compose text', () => {
    const ComposeTextPanel = createComposeTextPanel(undefined);

    render(<ComposeTextPanel toolbar={<span data-sign="templateButton" />} />);

    const toolbar = screen.getByTestId('composeToolbar');
    expect(within(toolbar).getByTestId('templateButton')).toBeInTheDocument();
    expect(within(toolbar).getByTestId('smsToolbarButtons')).toBeInTheDocument();
  });

  test('follow the upstream toolbar in a conversation', () => {
    const ConversationPanel = createConversationPanel(
      { push: jest.fn() },
      undefined,
      undefined,
      {
        conversations: { loadConversation: jest.fn(async () => {}) },
        messageThread: {
          isThreadId: jest.fn(() => false),
          setInputValue: jest.fn(async () => {}),
        },
        queueConversations: {
          formattedConversationsMap: new Map(),
          loadConversation: jest.fn(async () => {}),
        },
        connectivityMonitor: { connectivity: true },
        rateLimiter: { restricted: false },
        thirdParty: {
          messageLoggerGranularSelectionEnabled: false,
          messageLoggerRegistered: false,
          messageLogStateMap: {},
          messageLoggerTitle: null,
          messageLogEntityMatcherRegistered: false,
        },
        conversationLogger: { autoLog: false },
      },
    );

    render(
      <ConversationPanel
        conversation={{ conversationId: 'conversation-id' }}
        toolbar={<span data-sign="templateButton" />}
      />,
    );

    const toolbar = screen.getByTestId('conversationToolbar');
    expect(within(toolbar).getByTestId('templateButton')).toBeInTheDocument();
    expect(within(toolbar).getByTestId('smsToolbarButtons')).toBeInTheDocument();
  });
});
