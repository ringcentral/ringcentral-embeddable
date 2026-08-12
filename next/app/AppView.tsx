import React, {
  createContext,
  ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
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
import {
  isDetailRoutePath,
  isSideWidgetRoutePath,
  resolveExpandedRouteBackgroundPath,
  shouldCollapseExpandedLayout,
  shouldRenderExpandedView,
} from './ExpandedRouteNavigation.helper';
import { CustomizedPageView } from './views/CustomizedPageView';
import { ExpandedRouteView } from './views/ExpandedRouteView';
import { ExpandedView } from './views/ExpandedView';
import { FaxDetailsView } from './views/FaxDetailsView';
import { HeaderNavViewSpring } from './views/HeaderNavView';
import { GenericMeetingView } from './views/MeetingView/GenericMeetingView';
import {
  getRoutedCallContact,
  getRoutedConversationContact,
  RoutedSideWidgetView,
} from './views/RoutedSideWidgetView';
import { ThirdPartyBannerView } from './views/ThirdPartyBannerView';
import { VoicemailDropSettingsView } from './views/VoicemailDropSettingsView';
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

  private readonly _settingsSideWidgetConfig = {
    id: 'settings',
    name: 'Settings',
    scope: 'global',
    backgroundPath: '/settings',
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
      layout: 'detail',
      preserveBackground: true,
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
      path: '/dialer',
      component: this._dialerPadView.component,
      authentication: true,
    },
    {
      path: '/history/:callLogId',
      component: this._callDetailView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._dialerPadView.component,
      sideWidget: {
        id: 'call-details',
        name: 'Call details',
        scope: 'contact',
        backgroundPath: '/dialer',
      },
    },
    {
      path: '/composeText',
      component: this._composeTextView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this.Text,
    },
    {
      path: '/composeFax',
      component: this._faxSendView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this.Fax,
    },
    {
      path: '/conversations/:conversationId',
      component: this._conversationView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this.Text,
      sideWidget: {
        id: 'conversation',
        name: 'Conversation',
        scope: 'contact',
        backgroundPath: '/messages',
      },
    },
    {
      path: '/voicemails/:conversationId',
      component: this._voicemailView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._dialerPadView.component,
      sideWidget: {
        id: 'voicemail-details',
        name: 'Voicemail',
        scope: 'contact',
        backgroundPath: '/dialer',
      },
    },
    {
      path: '/faxes/:conversationId',
      component: this._faxDetailsView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this.Fax,
      sideWidget: {
        id: 'fax-details',
        name: 'Fax',
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
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/region',
      component: this._regionSettingsView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/audio',
      component: this._audioSettingsView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/voicemailDrop',
      component: this._voicemailDropSettingsView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/feedback',
      component: this._feedbackView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/issuesTracking',
      component: this._issuesTrackingView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/callQueueManagement',
      component: this._callQueueManagementView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/theme',
      component: this._themeSwitchView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/autoCallLogSettings/callLogging',
      component: this._callLoggingSettingsView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/autoCallLogSettings/recordMatching',
      component: this._recordMatchingSettingsView.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this._settingsView.component,
      sideWidget: this._settingsSideWidgetConfig,
    },
    {
      path: '/settings/autoCallLogSettings',
      component: this._autoCallLogICSettingsView.component,
      authentication: true,
      layout: 'detail',
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
      layout: 'detail',
      backgroundComponent: this.MeetingEntry,
    },
    {
      path: '/meeting/personalMeetingSettings',
      component: this._personalMeetingSettingsViewSpring?.component,
      authentication: true,
      layout: 'detail',
      backgroundComponent: this.MeetingEntry,
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
      layout: 'detail',
      backgroundComponent: this._contactListView.component,
      sideWidget: {
        id: 'contact-details',
        name: 'Contact',
        scope: 'contact',
        backgroundPath: '/contacts',
      },
    },
  ];

  private backgroundRoutesMap = this.routes.reduce((routes, route) => {
    if (route.preserveBackground) {
      return routes;
    }
    const BackgroundComponent =
      route.layout === 'detail' || route.sideWidget
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

  private _getRoutedContact(
    tabId: string,
    params: Record<string, string | undefined>,
  ): ThirdPartyWidgetContact | null | undefined {
    if (
      tabId === 'conversation' ||
      tabId === 'voicemail-details' ||
      tabId === 'fax-details'
    ) {
      const conversationId = params.conversationId;
      if (!conversationId) {
        return undefined;
      }
      const conversation =
        this._conversations.formattedConversationsMap.get(conversationId) ??
        this._messageThread?.getThreadConversation(conversationId);
      return conversation
        ? getRoutedConversationContact(conversation)
        : undefined;
    }
    if (tabId === 'call-details') {
      const call = this._callViewState.callDetailCallLog;
      return call ? getRoutedCallContact(call) : undefined;
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
    const DetailComponent = route.component;
    const BackgroundComponent = route.backgroundComponent;
    const config = route.sideWidget;
    const params = routeProps.match.params as Record<
      string,
      string | undefined
    >;
    const contact = useConnector(() =>
      config ? this._getRoutedContact(config.id, params) : undefined,
    );
    if (!config || !DetailComponent) {
      return null;
    }
    return (
      <>
        {BackgroundComponent ? <BackgroundComponent {...routeProps} /> : null}
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
      const BackgroundComponent = curr.backgroundComponent;
      const component = curr.sideWidget && DetailComponent
        ? (routeProps: RouteComponentProps) => (
            <this.RoutedSideWidgetRoute
              route={curr}
              routeProps={routeProps}
            />
          )
        : curr.layout === 'detail' && DetailComponent
          ? (routeProps: RouteComponentProps) => (
              <this._expandedRouteView.component
                background={
                  curr.preserveBackground ? (
                    <this.PreservedRouteBackground />
                  ) : BackgroundComponent ? (
                    <BackgroundComponent {...routeProps} />
                  ) : null
                }
                detail={<DetailComponent {...routeProps} />}
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
    private _dialerPadView: DialerPadView,
    private _callingSettingsView: CallingSettingsView,
    private _regionSettingsView: RegionSettingsView,
    private _audioSettingsView: AudioSettingsView,
    private _voicemailDropSettingsView: VoicemailDropSettingsView,
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
    private _faxDetailsView: FaxDetailsView,
    private _headerNavView: HeaderNavViewSpring,
    private _customizedPageView: CustomizedPageView,
    private _expandedRouteView: ExpandedRouteView,
    private _expandedView: ExpandedView,
    private _routedSideWidgetView: RoutedSideWidgetView,
    private _thirdPartyBannerView: ThirdPartyBannerView,
    @optional()
    private _messageThread?: MessageThread,
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
    );
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
    const { currentPath, expanded } = useConnector(() => ({
      currentPath: this._router.currentPath,
      expanded: this._root.expanded,
    }));
    const previousPathRef = useRef(currentPath);
    const backgroundPathRef = useRef<string | null>(null);
    const backgroundPath = resolveExpandedRouteBackgroundPath({
      currentPath,
      previousBackgroundPath: backgroundPathRef.current,
      routes: this.routes,
    });
    const renderExpandedView = shouldRenderExpandedView({
      currentPath,
      routes: this.routes,
    });
    useLayoutEffect(() => {
      const previousPath = previousPathRef.current;
      previousPathRef.current = currentPath;
      backgroundPathRef.current = backgroundPath;
      this._routedSideWidgetView.syncPath(
        currentPath,
        isSideWidgetRoutePath(currentPath, this.routes),
      );
      if (
        this._expandedView.isOpen &&
        isDetailRoutePath(currentPath, this.routes)
      ) {
        this._expandedView.close(undefined, { collapseLayout: false });
      }
      if (
        shouldCollapseExpandedLayout({
          currentPath,
          expanded,
          previousPath,
          routes: this.routes,
        })
      ) {
        void this._root.setExpanded(false);
      }
    }, [backgroundPath, currentPath, expanded]);

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
                {this._appViewOptions?.headers}
                <this._callView.Announcement />
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
            {renderExpandedView ? <this._expandedView.component /> : null}
            <this._environmentView.component />
          </div>
        </this._appRootView.component>
      </ExpandedRouteBackgroundPathContext.Provider>
    );
  }
}
