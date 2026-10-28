import React, {
  type ComponentType,
  type SVGProps,
  useRef,
  useState,
} from 'react';
import {
  computed,
  injectable,
  optional,
  RouterPlugin,
  type UIFunctions,
  type UIProps,
  useConnector,
} from '@ringcentral-integration/next-core';
import {
  HeaderNavViewSpring as HeaderNavViewSpringBase,
} from '@ringcentral-integration/micro-core/src/app/views';
import type {
  HeaderNavPanelProps,
  NavButtonProps,
} from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';
import {
  Locale,
  Theme,
} from '@ringcentral-integration/micro-core/src/app/services';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';

import { t } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/i18n';
import { defaultTabMap } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/utils/tabs';
import {
  AppsMd,
  ContactsMd,
  ContactsFilledMd,
  HeadphonesFilledMd,
  MessagesMd,
} from '@ringcentral/spring-icon';
import type { AppFeatures as EmbeddableAppFeatures } from '../../services/AppFeatures';
import { ThirdParty } from '../../services/ThirdParty';
import { CHATS_PATH } from '../TeamMessagingView/getChatPath';
import { RoutedSideWidgetView } from '../RoutedSideWidgetView';
import { t as localT } from './i18n';
import { HeaderNavWithOverflow } from './components/HeaderNavWithOverflow';
import type { EmbeddableHeaderNavViewOptions } from './HeaderNavViewOptions';

type PrioritizedTab = {
  priority: number;
  tab: NavButtonProps;
};

const AGENT_TAB_PATH = '/agent';

function isAgentPath(path?: string): boolean {
  return path === AGENT_TAB_PATH || !!path?.startsWith(`${AGENT_TAB_PATH}/`);
}

function isTextPath(path?: string): boolean {
  return (
    path === '/messages' ||
    path === '/composeText' ||
    !!path?.includes('/conversations/')
  );
}

function isChatPath(path?: string): boolean {
  return path === CHATS_PATH || !!path?.startsWith(`${CHATS_PATH}/`);
}

function isSettingsPath(path?: string): boolean {
  return !!path?.startsWith('/settings');
}

/**
 * The tabs carry an `active` flag from the modules that declare them, but those
 * are memoized getters that can hand back a value computed for an earlier
 * route. The bar owns the whole active state here instead, so one path always
 * lights exactly one tab.
 */
function isTabActive(to: string, path?: string): boolean {
  if (isAgentPath(path)) {
    // Agent sub routes such as `/agent/home/dialer` also contain the fragments
    // the other tabs match on.
    return to === AGENT_TAB_PATH;
  }
  switch (to) {
    case '/dialer':
      return !!path?.includes('/dialer');
    case '/messages':
      return isTextPath(path);
    case '/contacts':
      return !!path?.includes('/contacts');
    case CHATS_PATH:
      return isChatPath(path);
    case '/meeting':
    case '/meeting/schedule':
      return !!path?.includes('/meeting');
    case '/settings':
      return isSettingsPath(path);
    default:
      return path === to;
  }
}

const remoteTabIconCache = new Map<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
>();

function getRemoteTabIcon(
  uri?: string,
): ComponentType<SVGProps<SVGSVGElement>> | undefined {
  if (!uri) {
    return undefined;
  }
  const cachedIcon = remoteTabIconCache.get(uri);
  if (cachedIcon) {
    return cachedIcon;
  }
  const RemoteTabIcon = ({
    className,
  }: SVGProps<SVGSVGElement>): React.ReactElement | null => {
    const [loadFailed, setLoadFailed] = useState(false);
    if (loadFailed) {
      return null;
    }
    return (
      <img
        alt=""
        aria-hidden
        className={className}
        draggable={false}
        src={uri}
        onError={() => setLoadFailed(true)}
      />
    );
  };
  RemoteTabIcon.displayName = 'RemoteTabIcon';
  remoteTabIconCache.set(uri, RemoteTabIcon);
  return RemoteTabIcon;
}

@injectable({
  name: 'HeaderNavViewSpring',
})
export class HeaderNavViewSpring extends HeaderNavViewSpringBase {
  constructor(
    protected _locale: Locale,
    protected _router: RouterPlugin,
    protected _genericMeeting: GenericMeeting,
    private _thirdParty: ThirdParty,
    private _theme: Theme,
    private _routedSideWidgetView: RoutedSideWidgetView,
    @optional('HeaderNavViewOptions')
    protected _headerNavViewOptions?: EmbeddableHeaderNavViewOptions,
  ) {
    super(_locale, _router, _headerNavViewOptions);
  }

  override getUIFunctions(): UIFunctions<HeaderNavPanelProps> {
    return {
      onChange: (path: string) => {
        void this._routedSideWidgetView.navigateMain(path);
      },
    };
  }

  override getUIProps(): UIProps<HeaderNavPanelProps> {
    const props = super.getUIProps();
    const mainPath = this._routedSideWidgetView.getMainColumnPath();
    // On a routed side widget page the main column renders the page behind
    // it, so that is the route the bar represents. A main path that belongs
    // to no tab would leave the whole bar inactive, so it is ignored.
    const activePath = props.tabs.some(({ to }) => isTabActive(to, mainPath))
      ? mainPath
      : props.currentPath;
    return {
      ...props,
      currentPath: activePath,
      tabs: props.tabs.map((tab) => ({
        ...tab,
        active: isTabActive(tab.to, activePath),
      })),
    };
  }

  @computed
  get videoTab(): NavButtonProps {
    return {
      ...defaultTabMap.video,
      title: t('video'),
      to: this._genericMeeting.isRCV ? '/meeting' : '/meeting/schedule',
      dataSign: 'videoTab',
    };
  }

  @computed
  get contactsTab(): NavButtonProps {
    return {
      title: localT('contacts'),
      to: '/contacts',
      dataSign: 'contactsTab',
      symbol: ContactsMd,
      activeSymbol: ContactsFilledMd,
    };
  }

  @computed
  get chatTab(): NavButtonProps {
    return {
      title: localT('chat'),
      to: CHATS_PATH,
      dataSign: 'glipTab',
      symbol: MessagesMd,
      activeSymbol: MessagesMd,
      BadgeProps: {
        count: this._headerNavViewOptions?.getChatUnreadCount?.() ?? 0,
        max: 99,
      },
    };
  }

  @computed
  get agentTab(): NavButtonProps {
    return {
      title: localT('agentTab'),
      to: AGENT_TAB_PATH,
      dataSign: 'agentTab',
      symbol: HeadphonesFilledMd,
      activeSymbol: HeadphonesFilledMd,
    };
  }

  @computed
  get tabs(): NavButtonProps[] {
    const appFeatures = this._appFeatures;
    const embeddableAppFeatures = appFeatures as
      | EmbeddableAppFeatures
      | undefined;
    const showDialPad =
      appFeatures &&
      (appFeatures.isCallingEnabled || appFeatures.hasReadExtensionCallLog);
    const showText = this._appFeatures?.hasReadTextPermission;
    const showFax = this._appFeatures?.hasReadFaxPermission;
    const showVideo = this._appFeatures?.hasMeetingsPermission;
    const showContacts = this._appFeatures?.isContactsEnabled;
    const showChat =
      !!this._headerNavViewOptions?.getChatUnreadCount &&
      this._appFeatures?.hasGlipPermission;

    const tabs: PrioritizedTab[] = [];

    showDialPad && tabs.push({ priority: 10, tab: this.dialTab });
    embeddableAppFeatures?.showAgentTab &&
      tabs.push({ priority: 15, tab: this.agentTab });
    showText && tabs.push({ priority: 20, tab: this.textTab });
    showContacts && tabs.push({ priority: 30, tab: this.contactsTab });
    // The legacy app placed the Chat tab at priority 40.
    showChat && tabs.push({ priority: 40, tab: this.chatTab });
    this._thirdParty.customizedTabs.forEach((customizedTab) => {
      if (customizedTab.hidden) {
        return;
      }
      const baseIconUri =
        this._theme.themeType === 'dark' && customizedTab.darkIconUri
          ? customizedTab.darkIconUri
          : customizedTab.iconUri;
      tabs.push({
        priority:
          typeof customizedTab.priority === 'number' &&
          Number.isFinite(customizedTab.priority)
            ? customizedTab.priority
            : 100,
        tab: {
          title: customizedTab.label || customizedTab.id,
          to: customizedTab.path,
          active: this._router.currentPath === customizedTab.path,
          symbol: getRemoteTabIcon(baseIconUri) ?? AppsMd,
          activeSymbol:
            getRemoteTabIcon(customizedTab.activeIconUri || baseIconUri) ??
            AppsMd,
          dataSign: `customizedTab-${customizedTab.id}`,
          BadgeProps: {
            count: customizedTab.unreadCount ?? 0,
            max: 99,
          },
        },
      });
    });
    if (this._headerNavViewOptions?.enableVideoTab) {
      showVideo && tabs.push({ priority: 50, tab: this.videoTab });
    }
    showFax && tabs.push({ priority: 60, tab: this.faxTab });
    tabs.push({ priority: 70, tab: this.settingsTab });

    return tabs
      .sort((first, second) => first.priority - second.priority)
      .map(({ tab }) => tab);
  }

  component(props: Partial<HeaderNavPanelProps>) {
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const _props = useConnector(() => {
      const uiProps = this.getUIProps();
      return {
        ...props,
        ...uiProps,
      };
    });

    return <HeaderNavWithOverflow {..._props} {...uiFunctions} />;
  }
}
