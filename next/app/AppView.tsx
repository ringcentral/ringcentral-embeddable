import React, { ReactNode } from 'react';
import {
  ConnectivityView,
  EnvironmentView,
  LoginView,
} from '@ringcentral-integration/micro-auth/src/app/views';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import {
  AppAnnouncementRender,
  useAppFooter,
} from '@ringcentral-integration/micro-core/src/app/components';
import {
  HeaderView,
  SpringAppRootView,
  VIEW_TRANSITION_DETAIL_IDENTIFY,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  PersonalMeetingSettingsViewSpring,
} from '@ringcentral-integration/micro-meeting/src/app/views';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';
import {
  ContactListView,
  ContactDetailsView,
} from '@ringcentral-integration/micro-contacts/src/app/views';
import { MeetingView } from './views/MeetingView';
import {
  ComposeTextViewSpring,
  ConversationsViewSpring,
  ConversationViewSpring,
  FaxSendView,
  VoicemailView,
} from '@ringcentral-integration/micro-message/src/app/views';
import {
  CallDetailView,
  CallView,
  DialerPadView,
} from '@ringcentral-integration/micro-phone/src/app/views';
import {
  AudioSettingsView,
  AutoCallLogICSettingsView,
  CallingSettingsView,
  CallQueueManagementView,
  FeedbackView,
  IssuesTrackingView,
  RegionSettingsView,
  SettingsView,
  ThemeSwitchView,
  WelcomeView,
  CallLoggingSettingsView,
  RecordMatchingSettingsView,
} from '@ringcentral-integration/micro-setting/src/app/views';
import {
  autobind,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  Route as RouterRoute,
  Switch,
  useConnector,
} from '@ringcentral-integration/next-core';
import type { AppViewOptions } from './AppView.interface';
import { ExpandedView } from './views/ExpandedView';
import { HeaderNavViewSpring } from './views/HeaderNavView';
import { GenericMeetingView } from './views/MeetingView/GenericMeetingView';
@injectable({
  name: 'AppView',
})
export class AppView extends RcViewModule {
  @autobind
  private Text() {
    return <this._conversationsView.component typeFilter="Text" />;
  }

  @autobind
  private Fax() {
    return <this._conversationsView.component typeFilter="Fax" />;
  }

  @autobind
  Footer() {
    const { footer } = useAppFooter({
      defaultFooter: <this._headerNavView.component />,
    });

    return footer;
  }

  @autobind
  private MeetingEntry({ ...props }) {
    const isRCV = useConnector(() => Boolean(this._genericMeeting.isRCV));

    if (isRCV && this._meetingView) {
      return <this._meetingView.component {...props} />;
    }

    if (this._genericMeetingView) {
      return <this._genericMeetingView.component {...props} isTab />;
    }

    return this._meetingView ? <this._meetingView.component {...props} /> : null;
  }

  private routes = [
    {
      path: '/welcome',
      component: this._welcomeView.component,
    },
    {
      path: '/calling',
      component: this._callView.component,
    },
    {
      path: '/',
      component: this._loginView.component,
      exact: true,
    },
    ...(this._appViewOptions?.routes || []),
    {
      path: '/dialer/:tabId',
      component: this._dialerPadView.component,
      authentication: true,
    },
    {
      path: '/dialer',
      component: this._dialerPadView.component,
      authentication: true,
    },
    {
      path: '/history/:callLogId',
      component: this._callDetailView.component,
      authentication: true,
    },
    {
      path: '/composeText',
      component: this._composeTextView.component,
      authentication: true,
    },
    {
      path: '/composeFax',
      component: this._faxSendView.component,
      authentication: true,
    },
    {
      path: '/conversations/:conversationId',
      component: this._conversationView.component,
      authentication: true,
    },
    {
      path: '/voicemails/:conversationId',
      component: this._voicemailView.component,
      authentication: true,
    },
    {
      path: '/messages',
      component: this.Text,
      authentication: true,
    },
    {
      path: '/fax',
      component: this.Fax,
      authentication: true,
    },
    {
      path: '/settings',
      component: this._settingsView.component,
      authentication: true,
      exact: true,
    },
    {
      path: '/settings/calling',
      component: this._callingSettingsView.component,
      authentication: true,
    },
    {
      path: '/settings/region',
      component: this._regionSettingsView.component,
      authentication: true,
    },
    {
      path: '/settings/audio',
      component: this._audioSettingsView.component,
      authentication: true,
    },
    {
      path: '/settings/feedback',
      component: this._feedbackView.component,
      authentication: true,
    },
    {
      path: '/settings/issuesTracking',
      component: this._issuesTrackingView.component,
      authentication: true,
    },
    {
      path: '/settings/callQueueManagement',
      component: this._callQueueManagementView.component,
      authentication: true,
    },
    {
      path: '/settings/theme',
      component: this._themeSwitchView.component,
      authentication: true,
    },
    {
      path: '/settings/autoCallLogSettings/callLogging',
      component: this._callLoggingSettingsView.component,
      authentication: true,
    },
    {
      path: '/settings/autoCallLogSettings/recordMatching',
      component: this._recordMatchingSettingsView.component,
      authentication: true,
    },
    {
      path: '/settings/autoCallLogSettings',
      component: this._autoCallLogICSettingsView.component,
      authentication: true,
    },
    {
      path: '/meeting',
      component: this.MeetingEntry,
      authentication: true,
      exact: true,
    },
    {
      path: '/meeting/schedule',
      component: this._genericMeetingView?.component,
      authentication: true,
    },
    {
      path: '/meeting/personalMeetingSettings',
      component: this._personalMeetingSettingsViewSpring?.component,
      authentication: true,
    },
    {
      path: '/contacts',
      component: this._contactListView.component,
      authentication: true,
      exact: true,
    },
    {
      path: '/contacts/:contactType/:contactId',
      component: this._contactDetailsView.component,
      authentication: true,
    }
  ];

  private routesMap = this.routes.reduce(
    (acc, curr) => {
      const target = curr.authentication ? acc.authentication : acc.default;
      target.push(
        <RouterRoute
          key={curr.path}
          path={curr.path}
          exact={curr.exact}
          component={curr.component}
        />,
      );

      return acc;
    },
    {
      default: [] as ReactNode[],
      authentication: [] as ReactNode[],
    },
  );

  constructor(
    private _router: RouterPlugin,
    private _appRootView: SpringAppRootView,
    private _callDetailView: CallDetailView,
    private _connectivityView: ConnectivityView,
    private _conversationsView: ConversationsViewSpring,
    private _conversationView: ConversationViewSpring,
    private _voicemailView: VoicemailView,
    private _settingsView: SettingsView,
    private _dialerPadView: DialerPadView,
    private _callingSettingsView: CallingSettingsView,
    private _regionSettingsView: RegionSettingsView,
    private _audioSettingsView: AudioSettingsView,
    private _feedbackView: FeedbackView,
    private _issuesTrackingView: IssuesTrackingView,
    private _callQueueManagementView: CallQueueManagementView,
    private _autoCallLogICSettingsView: AutoCallLogICSettingsView,
    private _callLoggingSettingsView: CallLoggingSettingsView,
    private _recordMatchingSettingsView: RecordMatchingSettingsView,
    private _themeSwitchView: ThemeSwitchView,
    private _callView: CallView,
    private _environmentView: EnvironmentView,
    private _welcomeView: WelcomeView,
    private _composeTextView: ComposeTextViewSpring,
    private _loginView: LoginView,
    private _headerView: HeaderView,
    private _faxSendView: FaxSendView,
    private _headerNavView: HeaderNavViewSpring,
    private _expandedView: ExpandedView,
    private _genericMeeting?: GenericMeeting,
    @optional()
    private _genericMeetingView?: GenericMeetingView,
    @optional()
    private _personalMeetingSettingsViewSpring?: PersonalMeetingSettingsViewSpring,
    @optional()
    private _meetingView?: MeetingView,
    private _contactListView?: ContactListView,
    private _contactDetailsView?: ContactDetailsView,
    @optional('AppViewOptions')
    private _appViewOptions?: AppViewOptions,
  ) {
    super();
  }

  @autobind
  private MainContent() {
    return (
      <Switch>
        {this.routesMap.default}
        <RouterRoute
          path="/"
          component={() => (
            <>
              <this._headerView.component
                standAlone
                ContactAvatar={ContactAvatar}
              >
                <main className="flex flex-col flex-auto overflow-y-auto h-full overflow-x-hidden">
                  <Switch>{this.routesMap.authentication}</Switch>
                </main>
              </this._headerView.component>
              <this.Footer />
            </>
          )}
        />
      </Switch>
    );
  }

  component() {
    return (
      <this._appRootView.component
        header={
          <div className="flex-none">
            <AppAnnouncementRender>
              <this._connectivityView.component />
              {this._appViewOptions?.headers}
              <this._callView.Announcement />
            </AppAnnouncementRender>
          </div>
        }
      >
        <div
          className="flex flex-col h-full flex-auto overflow-hidden bg-neutral-base"
          id={VIEW_TRANSITION_DETAIL_IDENTIFY}
        >
          <this.MainContent />
          <this._callView.IncomingCallList />
          <this._expandedView.component />
          <this._environmentView.component />
        </div>
      </this._appRootView.component>
    );
  }
}
