import React, {
  createContext,
  ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
import {
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
  SmsConsentManagementView,
  VoicemailView,
} from '@ringcentral-integration/micro-message/src/app/views';
import {
  ComposeText,
  Conversations,
  MessageThread,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  CallDetailView,
  CallView,
  DialerPadView,
} from '@ringcentral-integration/micro-phone/src/app/views';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import {
  AudioSettingsView,
  AutoCallLogICSettingsView,
  CallingSettingsView,
  CallQueueManagementView,
  RegionSettingsView,
  ThemeSwitchView,
  WelcomeView,
  CallLoggingSettingsView,
  RecordMatchingSettingsView,
} from '@ringcentral-integration/micro-setting/src/app/views';
import { SettingsView } from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import {
  autobind,
  inject,
  injectable,
  optional,
  RcViewModule,
  Root,
  RouterPlugin,
  Route as RouterRoute,
  type RouteComponentProps,
  Switch,
  useConnector,
  useLocation,
} from '@ringcentral-integration/next-core';
import type { AppViewOptions, Route as AppRoute } from './AppView.interface';
import { resolveDetailViewTransitionId } from './AppView.helper';
import { t } from './i18n';
import {
  isSideWidgetRoutePath,
  resolveExpandedRouteBackgroundPath,
} from './ExpandedRouteNavigation.helper';
import { CustomizedPageView } from './views/CustomizedPageView';
import { ApplicationLogsView } from './views/ApplicationLogsView';
import { CxAgentSettingsView } from './views/CxAgentSettingsView';
import { CxAgentTabView } from './views/CxAgentTabView';
import { RingCX } from './services/RingCX';
import { AudioInitView } from './views/AudioInitView';
import { ConnectivityView } from './views/ConnectivityView';
import { ExpandedView } from './views/ExpandedView';
import { FaxDetailsView } from './views/FaxDetailsView';
import { HeaderNavViewSpring } from './views/HeaderNavView';
import { LogCallView } from './views/LogCallView';
import { LogMessageView } from './views/LogMessageView';
import { GenericMeetingView } from './views/MeetingView/GenericMeetingView';
import {
  getRoutedCallContact,
  getRoutedConversationContact,
  RoutedSideWidgetView,
} from './views/RoutedSideWidgetView';
import { ThirdPartyBannerView } from './views/ThirdPartyBannerView';
import {
  ThirdPartySettingSectionView,
} from './views/ThirdPartySettingSectionView';
import { VoicemailDropSettingsView } from './views/VoicemailDropSettingsView';
import { PhoneNumberFormatSettingView } from './views/PhoneNumberFormatSettingView';
import { TextSettingView } from './views/TextSettingView';
import type { ComposeText as EmbeddableComposeText } from './services/ComposeText';
import type { ThirdPartyWidgetContact } from './services/ThirdParty';

type RouteComponent = Exclude<React.ElementType, string>;

type InternalRoute = Omit<AppRoute, 'component' | 'backgroundComponent'> & {
  component?: RouteComponent;
  backgroundComponent?: RouteComponent;
};

const ExpandedRouteBackgroundPathContext = createContext<string | null>(null);

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

  /**
   * One Settings tab for every settings page. A page keeps its own back when
   * that goes to a fixed page: the settings list, a level up, or a view inside
   * the page such as the voicemail drop message editor.
   */
  private readonly _settingsSideWidgetConfig = {
    id: 'settings',
    name: () => t('settings'),
    scope: 'global',
    backgroundPath: '/settings',
    keepBackNavigation: true,
  } as const;

  /**
   * Settings pages whose own back goes back through history (Calling, Region,
   * Audio, a third-party section, application logs), which reopens whatever
   * tab was shown before. Their back closes the tab instead.
   */
  private readonly _historyBackSettingsSideWidgetConfig = {
    ...this._settingsSideWidgetConfig,
    keepBackNavigation: false,
  } as const;

  /** The schedule page's own back goes through history, so back closes the tab. */
  private readonly _meetingSideWidgetConfig = {
    id: 'meeting',
    name: () => t('meeting'),
    scope: 'global',
    backgroundPath: '/meeting',
  } as const;

  /**
   * Personal meeting settings keeps its own back: it returns to `/meeting`
   * with a `from` query, so the meeting form keeps its draft.
   */
  private readonly _personalMeetingSettingsSideWidgetConfig = {
    ...this._meetingSideWidgetConfig,
    keepBackNavigation: true,
  } as const;

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

  private routes: InternalRoute[] = [
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
      path: '/customized/:pageId',
      component: this._customizedPageView.component,
      authentication: true,
      exact: true,
      preserveBackground: true,
      sideWidget: {
        id: 'customized-page',
        name: (params) =>
          (params.pageId &&
            this._customizedPageView.getPageTitle(params.pageId)) ||
          t('page'),
        // A host page is not about a contact, so a call does not close it.
        scope: 'global',
        backgroundPath: '/dialer',
        preserveBackground: true,
      },
    },
    {
      path: '/customizedTabs/:pageId',
      component: this._customizedPageView.component,
      authentication: true,
      exact: true,
    },
    {
      path: '/dialer/:tabId',
      component: this._dialerPadView.component,
      authentication: true,
    },
    {
      path: '/agent/history/:id',
      component: this._cxAgentTabView.HistoryDetail,
      authentication: true,
      exact: true,
      backgroundComponent: this._cxAgentTabView.HistoryBackground,
      sideWidget: {
        // Its own tab: a RingCX history row is a different page from a
        // RingEX call log, even though both are shown as call details.
        id: 'cx-call-details',
        name: () => t('callDetails'),
        scope: 'contact',
        backgroundPath: '/agent/home/history',
      },
    },
    {
      path: '/agent/calls/:id/disposition',
      component: this._cxAgentTabView.DispositionDetail,
      authentication: true,
      exact: true,
      backgroundComponent: this._cxAgentTabView.DispositionBackground,
      sideWidget: {
        id: 'cx-disposition',
        name: () => t('disposition'),
        // A pending disposition must survive a contact change in the drawer,
        // for example the Apps tab opening for another call.
        scope: 'global',
        backgroundPath: '/agent/home/dialer',
        resolveBackgroundPath: (params) =>
          this._cxAgentTabView.resolveDispositionBackgroundPath(params.id),
        collapseWhenLeft: true,
        // Submitting hands over to its background or to the log page.
        closeWhenLeft: true,
      },
    },
    {
      path: '/agent',
      component: this._cxAgentTabView.component,
      authentication: true,
      ownsRouter: true,
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
      backgroundComponent: this._dialerPadView.component,
      sideWidget: {
        id: 'call-details',
        name: () => t('callDetails'),
        scope: 'contact',
        backgroundPath: '/dialer',
      },
    },
    {
      path: '/log/call/:callSessionId',
      component: this._logCallView.component,
      authentication: true,
      preserveBackground: true,
      sideWidget: {
        id: 'log-call',
        name: () => t('logCall'),
        scope: 'contact',
        backgroundPath: '/dialer',
        preserveBackground: true,
        closeWhenLeft: true,
      },
    },
    {
      path: '/log/messages/:conversationId',
      component: this._logMessageView.component,
      authentication: true,
      preserveBackground: true,
      sideWidget: {
        id: 'log-messages',
        name: () => t('logMessages'),
        scope: 'contact',
        backgroundPath: '/messages',
        preserveBackground: true,
        closeWhenLeft: true,
      },
    },
    {
      path: '/composeText',
      component: this._composeTextView.component,
      authentication: true,
      backgroundComponent: this.Text,
      sideWidget: {
        id: 'compose-text',
        name: () => t('composeText'),
        scope: 'contact',
        backgroundPath: '/messages',
        closeWhenLeft: true,
        // Click-to-SMS may add the recipient right after opening the page.
        deferBlankContact: true,
      },
    },
    {
      path: '/composeFax',
      component: this._faxSendView.component,
      authentication: true,
      backgroundComponent: this.Fax,
      sideWidget: {
        id: 'compose-fax',
        name: () => t('composeFax'),
        scope: 'contact',
        backgroundPath: '/fax',
        // Sending returns to the fax list, which finishes the page.
        closeWhenLeft: true,
      },
    },
    {
      path: '/conversations/:conversationId',
      component: this._conversationView.component,
      authentication: true,
      backgroundComponent: this.Text,
      sideWidget: {
        id: 'conversation',
        name: () => t('conversation'),
        scope: 'contact',
        backgroundPath: '/messages',
      },
    },
    {
      path: '/voicemails/:conversationId',
      component: this._voicemailView.component,
      authentication: true,
      backgroundComponent: this._dialerPadView.component,
      sideWidget: {
        id: 'voicemail-details',
        name: () => t('voicemail'),
        scope: 'contact',
        backgroundPath: '/dialer',
      },
    },
    {
      path: '/faxes/:conversationId',
      component: this._faxDetailsView.component,
      authentication: true,
      backgroundComponent: this.Fax,
      sideWidget: {
        id: 'fax-details',
        name: () => t('fax'),
        scope: 'contact',
        backgroundPath: '/fax',
      },
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
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    {
      path: '/settings/agent',
      component: this._cxAgentSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/region',
      component: this._regionSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    {
      path: '/settings/audio',
      component: this._audioSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    ...(this._smsConsentManagementView
      ? [
          {
            path: '/settings/consentManagement',
            component: this._smsConsentManagementView.component,
            authentication: true,
            backgroundComponent: this._settingsView.component,
            sideWidget: this._settingsSideWidgetConfig,
          },
        ]
      : []),
    {
      path: '/settings/thirdParty/:sectionId',
      component: this._thirdPartySettingSectionView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    {
      path: '/settings/text',
      component: this._textSettingView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    {
      path: '/settings/phoneNumberFormat',
      component: this._phoneNumberFormatSettingView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    {
      path: '/settings/voicemailDrop',
      component: this._voicemailDropSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/applicationLogs',
      component: this._applicationLogsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._historyBackSettingsSideWidgetConfig,
    },
    {
      path: '/settings/callQueueManagement',
      component: this._callQueueManagementView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/theme',
      component: this._themeSwitchView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/autoCallLogSettings/callLogging',
      component: this._callLoggingSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/autoCallLogSettings/recordMatching',
      component: this._recordMatchingSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/autoCallLogSettings',
      component: this._autoCallLogICSettingsView.component,
      authentication: true,
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
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
      backgroundComponent: this.MeetingEntry,
      sideWidget: this._meetingSideWidgetConfig,
    },
    {
      path: '/meeting/personalMeetingSettings',
      component: this._personalMeetingSettingsViewSpring?.component,
      authentication: true,
      backgroundComponent: this.MeetingEntry,
      sideWidget: this._personalMeetingSettingsSideWidgetConfig,
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
      backgroundComponent: this._contactListView.component,
      sideWidget: {
        id: 'contact-details',
        name: () => t('contact'),
        scope: 'contact',
        backgroundPath: '/contacts',
      },
    },
  ];

  private backgroundRoutesMap = this.routes.reduce((routes, route) => {
    if (route.preserveBackground) {
      return routes;
    }
    const BackgroundComponent = route.sideWidget
      ? route.backgroundComponent
      : route.component;
    if (!BackgroundComponent) {
      return routes;
    }
    routes.push(
      <RouterRoute
        key={route.path}
        path={route.path}
        exact={route.exact}
        component={BackgroundComponent}
      />,
    );
    return routes;
  }, [] as ReactNode[]);

  @autobind
  private PreservedRouteBackground() {
    const backgroundPath = useContext(ExpandedRouteBackgroundPathContext);
    const location = useLocation();
    if (!backgroundPath) {
      return null;
    }
    return (
      <Switch location={{ ...location, pathname: backgroundPath }}>
        {this.backgroundRoutesMap}
      </Switch>
    );
  }

  private _resolveRoutedContact(
    tabId: string,
    params: Record<string, string | undefined>,
  ): ThirdPartyWidgetContact | null | undefined {
    if (
      tabId === 'conversation' ||
      tabId === 'voicemail-details' ||
      tabId === 'fax-details' ||
      tabId === 'log-messages'
    ) {
      const conversationId = params.conversationId;
      if (!conversationId) {
        return undefined;
      }
      const mapped =
        this._conversations.formattedConversationsMap.get(conversationId);
      const threaded = mapped
        ? undefined
        : this._messageThread?.getThreadConversation(conversationId);
      const conversation = mapped ?? threaded;
      return conversation
        ? getRoutedConversationContact(conversation)
        : undefined;
    }
    if (tabId === 'call-details') {
      if (!params.callLogId) {
        return undefined;
      }
      const call = this._callViewState.callDetailCallLog;
      return call ? getRoutedCallContact(call) : undefined;
    }
    if (tabId === 'log-call') {
      if (!params.callSessionId) {
        return undefined;
      }
      // Loaded asynchronously; the contact is applied once the call arrives.
      const call = this._logCallView.getLoadedCall(params.callSessionId);
      // `CompatibleCall` omits keys from a call type with an index signature,
      // which drops its named party fields from the type, not from the value.
      return call
        ? getRoutedCallContact(
            call as Parameters<typeof getRoutedCallContact>[0],
          )
        : undefined;
    }
    if (tabId === 'compose-text') {
      // A click-to-SMS belongs to its recipient. A message without one has no
      // contact and clears the other contact tabs.
      const recipient = this._composeText.requestedRecipient;
      return recipient
        ? {
            ...(recipient.id ? { id: recipient.id } : {}),
            name: recipient.name,
            phoneNumber: recipient.phoneNumber,
          }
        : null;
    }
    if (tabId === 'contact-details') {
      return (this._contactDetailsView?.currentContact ?? undefined) as
        | ThirdPartyWidgetContact
        | undefined;
    }
    return undefined;
  }

  @autobind
  private RoutedSideWidgetRoute({
    route,
    routeProps,
  }: {
    route: InternalRoute;
    routeProps: RouteComponentProps;
  }) {
    const location = useLocation();
    const expanded = useConnector(() => this._root.expanded);
    const mainPath = useConnector(
      () => this._routedSideWidgetView.mainPath,
    );
    const DetailComponent = route.component;
    const BackgroundComponent = route.backgroundComponent;
    const config = route.sideWidget;
    const params = routeProps.match.params as Record<
      string,
      string | undefined
    >;
    const contact = useConnector(() =>
      config ? this._resolveRoutedContact(config.id, params) : undefined,
    );
    if (!config || !DetailComponent) {
      return null;
    }
    return (
      <>
        {mainPath ? (
          <Switch location={{ ...location, pathname: mainPath }}>
            {this.backgroundRoutesMap}
          </Switch>
        ) : BackgroundComponent ? (
          <BackgroundComponent {...routeProps} />
        ) : route.preserveBackground ? (
          <this.PreservedRouteBackground />
        ) : null}
        <this._routedSideWidgetView.component
          config={config}
          contact={contact}
          detailComponent={DetailComponent}
          detailProps={routeProps as unknown as Record<string, unknown>}
          expand={expanded}
          path={location.pathname}
          routeExact={route.exact}
          routePath={route.path}
        />
      </>
    );
  }

  private routesMap = this.routes.reduce(
    (acc, curr) => {
      const target = curr.authentication ? acc.authentication : acc.default;
      const DetailComponent = curr.component;
      const component = curr.sideWidget && DetailComponent
        ? (routeProps: RouteComponentProps) => (
            <this.RoutedSideWidgetRoute
              route={curr}
              routeProps={routeProps}
            />
          )
        : DetailComponent;

      target.push(
        <RouterRoute
          key={curr.path}
          path={curr.path}
          exact={curr.exact}
          component={component}
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
    private _root: Root,
    private _router: RouterPlugin,
    private _conversations: Conversations,
    private _callViewState: CallViewState,
    private _appRootView: SpringAppRootView,
    private _callDetailView: CallDetailView,
    private _connectivityView: ConnectivityView,
    private _conversationsView: ConversationsViewSpring,
    private _conversationView: ConversationViewSpring,
    private _voicemailView: VoicemailView,
    private _settingsView: SettingsView,
    private _cxAgentTabView: CxAgentTabView,
    private _cxAgentSettingsView: CxAgentSettingsView,
    private _ringCX: RingCX,
    private _dialerPadView: DialerPadView,
    private _callingSettingsView: CallingSettingsView,
    private _regionSettingsView: RegionSettingsView,
    private _audioSettingsView: AudioSettingsView,
    private _thirdPartySettingSectionView: ThirdPartySettingSectionView,
    private _voicemailDropSettingsView: VoicemailDropSettingsView,
    private _phoneNumberFormatSettingView: PhoneNumberFormatSettingView,
    private _textSettingView: TextSettingView,
    private _applicationLogsView: ApplicationLogsView,
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
    private _faxDetailsView: FaxDetailsView,
    private _headerNavView: HeaderNavViewSpring,
    private _logCallView: LogCallView,
    private _logMessageView: LogMessageView,
    private _customizedPageView: CustomizedPageView,
    private _expandedView: ExpandedView,
    private _routedSideWidgetView: RoutedSideWidgetView,
    private _thirdPartyBannerView: ThirdPartyBannerView,
    private _audioInitView: AudioInitView,
    @inject(ComposeText) private _composeText: EmbeddableComposeText,
    @optional()
    private _messageThread?: MessageThread,
    private _genericMeeting?: GenericMeeting,
    @optional()
    private _genericMeetingView?: GenericMeetingView,
    @optional()
    private _personalMeetingSettingsViewSpring?: PersonalMeetingSettingsViewSpring,
    @optional()
    private _smsConsentManagementView?: SmsConsentManagementView,
    @optional()
    private _meetingView?: MeetingView,
    private _contactListView?: ContactListView,
    private _contactDetailsView?: ContactDetailsView,
    @optional('AppViewOptions')
    private _appViewOptions?: AppViewOptions,
  ) {
    super();
    this._routedSideWidgetView.registerRoutes(
      this.routes.flatMap((route) =>
        route.sideWidget && route.component
          ? [
              {
                config: route.sideWidget,
                detailComponent: route.component,
                routeExact: route.exact,
                routePath: route.path,
              },
            ]
          : [],
      ),
      (tabId, params) => this._resolveRoutedContact(tabId, params),
    );
    // Pages outside the signed-in shell, such as the call page, cannot be
    // rendered in the main column behind a routed page either.
    this._routedSideWidgetView.setOutsideShellPaths(
      this.routes
        .filter((route) => !route.authentication)
        .map((route) => route.path),
    );
    this._routedSideWidgetView.setRouterOwningPaths(
      this.routes
        .filter((route) => route.ownsRouter || !route.authentication)
        .map((route) => route.path),
    );
  }

  /**
   * A stable component, so a route change does not remount the whole signed-in
   * shell and the page in it, such as the contact list behind a contact.
   */
  @autobind
  private SignedInShell() {
    return (
      <>
        <this._headerView.component standAlone ContactAvatar={ContactAvatar}>
          <main className="flex flex-col flex-auto overflow-y-auto h-full overflow-x-hidden">
            <Switch>{this.routesMap.authentication}</Switch>
          </main>
        </this._headerView.component>
        <this.Footer />
      </>
    );
  }

  @autobind
  private MainContent() {
    return (
      <Switch>
        {this.routesMap.default}
        <RouterRoute path="/" component={this.SignedInShell} />
      </Switch>
    );
  }

  component() {
    const { currentPath, expanded, ringCXLoaded } = useConnector(() => ({
      currentPath: this._router.currentPath,
      expanded: this._root.expanded,
      ringCXLoaded: this._ringCX.loaded,
    }));
    const CxAnnouncements = this._ringCX.announcementsView?.component;
    const backgroundPathRef = useRef<string | null>(null);
    const backgroundPath = resolveExpandedRouteBackgroundPath({
      currentPath,
      previousBackgroundPath: backgroundPathRef.current,
      routes: this.routes,
      isOutsideShellPath: (path) =>
        this._routedSideWidgetView.isOutsideShellPath(path),
    });
    useLayoutEffect(() => {
      backgroundPathRef.current = backgroundPath;
      this._routedSideWidgetView.syncPath(
        currentPath,
        isSideWidgetRoutePath(currentPath, this.routes),
      );
    }, [backgroundPath, currentPath]);

    return (
      <ExpandedRouteBackgroundPathContext.Provider
        value={backgroundPath}
      >
        <this._appRootView.component
          header={
            <div className="flex-none">
              <AppAnnouncementRender>
                <this._connectivityView.component />
                <this._thirdPartyBannerView.component />
                <this._audioInitView.component />
                {this._appViewOptions?.headers}
                <this._callView.Announcement />
                {ringCXLoaded && CxAnnouncements ? <CxAnnouncements /> : null}
              </AppAnnouncementRender>
            </div>
          }
        >
          <div
            className="flex flex-col h-full flex-auto overflow-hidden bg-neutral-base"
            id={resolveDetailViewTransitionId(
              expanded,
              VIEW_TRANSITION_DETAIL_IDENTIFY,
            )}
          >
            <this.MainContent />
            <this._callView.IncomingCallList />
            <this._expandedView.component />
            <this._environmentView.component />
          </div>
        </this._appRootView.component>
      </ExpandedRouteBackgroundPathContext.Provider>
    );
  }
}
