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
  HeaderNavViewSpringOptions,
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
} from '@ringcentral/spring-icon';
import { ThirdParty } from '../../services/ThirdParty';
import { RoutedSideWidgetView } from '../RoutedSideWidgetView';
import { t as localT } from './i18n';
import { HeaderNavWithOverflow } from './components/HeaderNavWithOverflow';

type PrioritizedTab = {
  priority: number;
  tab: NavButtonProps;
};

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
    protected _headerNavViewOptions?: HeaderNavViewSpringOptions,
  ) {
    super(_locale, _router, _headerNavViewOptions);
  }

  override getUIFunctions(): UIFunctions<HeaderNavPanelProps> {
    return {
      onChange: (path: string) => {
        if (process.env.NODE_ENV !== 'test') {
          console.info('[SideWidgetDebug] header navigation', {
            currentPath: this._router.currentPath,
            targetPath: path,
          });
        }
        this._routedSideWidgetView.navigateMain(path);
      },
    };
  }

  override getUIProps(): UIProps<HeaderNavPanelProps> {
    const props = super.getUIProps();
    const mainPath = this._routedSideWidgetView.mainPath;
    if (!mainPath) {
      return props;
    }
    return {
      ...props,
      currentPath: mainPath,
      tabs: props.tabs.map((tab) => ({
        ...tab,
        active: tab.to === mainPath,
      })),
    };
  }

  @computed
  get videoTab(): NavButtonProps {
    return {
      ...defaultTabMap.video,
      title: t('video'),
      active: this._router.currentPath?.includes('/meeting'),
      to: this._genericMeeting.isRCV ? '/meeting' : '/meeting/schedule',
      dataSign: 'videoTab',
    };
  }

  @computed
  get contactsTab(): NavButtonProps {
    return {
      title: localT('contacts'),
      active: this._router.currentPath?.includes('/contacts'),
      to: '/contacts',
      dataSign: 'contactsTab',
      symbol: ContactsMd,
      activeSymbol: ContactsFilledMd,
    };
  }

  @computed
  get tabs(): NavButtonProps[] {
    const appFeatures = this._appFeatures;
    const showDialPad =
      appFeatures &&
      (appFeatures.isCallingEnabled || appFeatures.hasReadExtensionCallLog);
    const showText = this._appFeatures?.hasReadTextPermission;
    const showFax = this._appFeatures?.hasReadFaxPermission;
    const showVideo = this._appFeatures?.hasMeetingsPermission;
    const showContacts = this._appFeatures?.isContactsEnabled;

    const tabs: PrioritizedTab[] = [];

    showDialPad && tabs.push({ priority: 10, tab: this.dialTab });
    showText && tabs.push({ priority: 20, tab: this.textTab });
    showContacts && tabs.push({ priority: 30, tab: this.contactsTab });
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
