import React, { useRef } from 'react';
import { injectable, computed, optional, RouterPlugin, useConnector } from '@ringcentral-integration/next-core';
import {
  HeaderNavViewSpring as HeaderNavViewSpringBase
} from '@ringcentral-integration/micro-core/src/app/views';
import type {
  HeaderNavPanelProps,
  HeaderNavViewSpringOptions,
  NavButtonProps,
} from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';

import { t } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/i18n';
import { defaultTabMap } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/utils/tabs';
import {
  ContactsMd,
  ContactsFilledMd,
} from '@ringcentral/spring-icon';
import { t as localT } from './i18n';
import { HeaderNavWithOverflow } from './components/HeaderNavWithOverflow';
@injectable({
  name: 'HeaderNavViewSpring',
})
export class HeaderNavViewSpring extends HeaderNavViewSpringBase {
  constructor(
    protected _locale: Locale,
    protected _router: RouterPlugin,
    protected _genericMeeting: GenericMeeting,
    @optional('HeaderNavViewOptions')
    protected _headerNavViewOptions?: HeaderNavViewSpringOptions,
  ) {
    super(_locale, _router, _headerNavViewOptions);
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
  get tabs() {
    const appFeatures = this._appFeatures;
    const showDialPad =
      appFeatures &&
      (appFeatures.isCallingEnabled || appFeatures.hasReadExtensionCallLog);
    const showText = this._appFeatures?.hasReadTextPermission;
    const showFax = this._appFeatures?.hasReadFaxPermission;
    const showVideo = this._appFeatures?.hasMeetingsPermission;
    const showContacts = this._appFeatures?.isContactsEnabled;

    const tabs: NavButtonProps[] = [];

    showDialPad && tabs.push(this.dialTab);
    showText && tabs.push(this.textTab);
    showContacts && tabs.push(this.contactsTab);
    if (this._headerNavViewOptions?.enableVideoTab) {
      showVideo && tabs.push(this.videoTab);
    }
    showFax && tabs.push(this.faxTab);
    
    tabs.push(this.settingsTab);

    return tabs;
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
