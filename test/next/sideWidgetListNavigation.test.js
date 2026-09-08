import { CallsListView } from '../../next/app/views/CallHistoryView/CallsList.view';
import { CallDetailView } from '../../next/app/views/CallHistoryView/CallDetail.view';
import { ConversationsView } from '../../next/app/views/ConversationsView';

jest.mock('@ringcentral-integration/next-core', () => ({
  // Build on the shared mock so newly imported decorators keep resolving.
  ...jest.requireActual('./mocks/nextCoreMock'),
  injectable: () => (target) => target,
  optional: () => () => undefined,
  PortManager: class PortManager {},
  RouterPlugin: class RouterPlugin {},
}));

jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  Auth: class Auth {},
  AppFeatures: class AppFeatures {},
  ConnectivityManager: class ConnectivityManager {},
  ConnectivityMonitor: class ConnectivityMonitor {},
  RateLimiter: class RateLimiter {},
  RegionSettings: class RegionSettings {},
}));

jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () => ({
  ContactMatcher: class ContactMatcher {},
}));

jest.mock('@ringcentral-integration/micro-core/src/app/services', () => ({
  Locale: class Locale {},
  Toast: class Toast {},
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
}));

jest.mock('@ringcentral-integration/micro-message/src/app/services', () => ({
  ComposeText: class ComposeText {},
  ConversationLogger: class ConversationLogger {},
  Conversations: class Conversations {},
  MessageStore: class MessageStore {},
  SmsConversations: class SmsConversations {},
  SmsOptOut: class SmsOptOut {},
  VoicemailAudio: class VoicemailAudio {},
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  Call: class Call {},
  CallHistory: class CallHistory {},
  CallLogger: class CallLogger {},
  CallLogTasks: class CallLogTasks {},
}));

jest.mock('../../next/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallDetailView',
  () => ({
    CallDetailView: class CallDetailView {
      component(props) {
        const ReactModule = require('react');
        const uiProps = this.getUIProps(props);
        return ReactModule.createElement('div', {
          ...uiProps,
          currentCallLog: uiProps.currentCallLog || {},
        });
      }

      getUIProps(props) {
        return { currentCallLog: props.currentCallLog };
      }

      getUIFunctions() {
        return { goBack: jest.fn() };
      }
    },
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallLogFormView',
  () => ({ CallLogFormView: class CallLogFormView {} }),
);

jest.mock('@ringcentral-integration/micro-phone/src/app/views/CallView', () => ({
  CallView: class CallView {},
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewState {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/DialerView',
  () => ({ DialerView: class DialerView {} }),
);

jest.mock('@ringcentral-integration/micro-setting/src/app/services', () => ({
  IntegrationConfig: class IntegrationConfig {},
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring',
  () => ({
    ConversationsViewSpring: class ConversationsViewSpring {
      getUIFunctions() {
        return {
          useActionsHandler: () => jest.fn(),
        };
      }
    },
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring',
  () => ({
    CallsListViewSpring: class CallsListViewSpring {
      getUIFunctions() {
        return {
          useActionsHandler: () => jest.fn(),
        };
      }

      component() {
        return null;
      }
    },
  }),
);

jest.mock('../../next/app/views/CallHistoryView/CallsListPage', () => ({
  CallsListPage: () => null,
}));

jest.mock('../../next/app/views/CallHistoryView/CallDetailPage', () => ({
  CallDetailPage: () => null,
}));

jest.mock('../../next/app/views/ConversationsView/ConversationsPage', () => ({
  ConversationsPage: () => null,
}));

describe('SideWidget list detail navigation', () => {
  test('shows CRM log status only when a call logger is registered', () => {
    const view = Object.create(CallsListView.prototype);
    view._thirdParty = { callLoggerRegistered: false };

    expect(view.displayCRMLog).toBe(false);

    view._thirdParty.callLoggerRegistered = true;
    expect(view.displayCRMLog).toBe(true);
  });

  test('opens an SMS route directly without the full-page transition', async () => {
    const router = { push: jest.fn(async () => undefined) };
    const checkDncStatusOfConversation = jest.fn(async () => undefined);
    const view = Object.create(ConversationsView.prototype);
    view._router = router;
    view._smsConversationsOptions = { checkDncStatusOfConversation };

    const handler = view
      .getUIFunctions({ typeFilter: 'Text' })
      .useActionsHandler(
        { conversationId: 'conversation-id' },
        { isTextMessage: true },
        'history',
      );

    await handler('viewDetail');

    expect(checkDncStatusOfConversation).toHaveBeenCalledWith(
      'conversation-id',
    );
    expect(router.push).toHaveBeenCalledWith(
      '/conversations/conversation-id',
    );
  });

  test('opens voicemail details directly without the full-page transition', async () => {
    const router = { push: jest.fn(async () => undefined) };
    const view = Object.create(ConversationsView.prototype);
    view._router = router;

    const handler = view
      .getUIFunctions({ typeFilter: 'VoiceMail' })
      .useActionsHandler(
        { conversationId: 'voicemail-id' },
        { isVoicemail: true },
        'Voicemail list',
      );

    await handler('viewDetail');

    expect(router.push).toHaveBeenCalledWith(
      '/voicemails/voicemail-id',
    );
  });

  test('opens fax details when the fax list item is clicked', async () => {
    const router = { push: jest.fn(async () => undefined) };
    const messageStore = { readMessages: jest.fn() };
    const view = Object.create(ConversationsView.prototype);
    view._messageStore = messageStore;
    view._router = router;

    const handler = view
      .getUIFunctions({ typeFilter: 'Fax' })
      .useActionsHandler(
        { conversationId: 'fax-id' },
        { isFax: true },
        'Fax list',
      );

    await handler('viewDetail');

    expect(messageStore.readMessages).toHaveBeenCalledWith('fax-id');
    expect(router.push).toHaveBeenCalledWith('/faxes/fax-id');
  });

  test('keeps the fax View action as a direct attachment preview', async () => {
    const router = { push: jest.fn(async () => undefined) };
    const view = Object.create(ConversationsView.prototype);
    view._router = router;

    const handler = view
      .getUIFunctions({ typeFilter: 'Fax' })
      .useActionsHandler(
        { conversationId: 'fax-id' },
        { isFax: true },
        'Fax list',
      );

    await handler('viewFax');

    expect(router.push).not.toHaveBeenCalled();
  });

  test('opens a call-detail route directly without the full-page transition', async () => {
    const router = { push: jest.fn(async () => undefined) };
    const callHistory = {
      getHistoryByTelephonySessionId: jest.fn(() => ({ id: 'call-log' })),
    };
    const view = Object.create(CallsListView.prototype);
    view._appCallHistory = callHistory;
    view._appRouter = router;

    const handler = view
      .getUIFunctions({})
      .useActionsHandler(
        { telephonySessionId: 'session-id' },
        {},
        'history',
      );

    await handler('viewDetail');

    expect(router.push).toHaveBeenCalledWith('/history/session-id');
  });

  test('closes call details directly without a view transition', async () => {
    const router = { push: jest.fn(async () => undefined) };
    const view = Object.create(CallDetailView.prototype);
    view._appRouter = router;

    await view.getUIFunctions({}).goBack();

    expect(router.push).toHaveBeenCalledWith('/dialer');
  });

  test('scrolls call metadata together with history details', () => {
    const view = Object.create(CallDetailView.prototype);
    view._auth = { accessToken: 'token' };

    const component = view.component({});

    expect(component.props.scrollCallInfoWithContent).toBe(true);
  });

  test('adds the current access token to the call recording URI', () => {
    const view = Object.create(CallDetailView.prototype);
    view._auth = { accessToken: 'current token' };

    const component = view.component({
      currentCallLog: {
        recording: {
          contentUri:
            'https://media.example.com/recording.wav?contentDisposition=Inline&access_token=expired',
        },
      },
    });

    expect(component.props.recordingUri).toBe(
      'https://media.example.com/recording.wav?contentDisposition=Inline&access_token=current+token',
    );
  });
});
