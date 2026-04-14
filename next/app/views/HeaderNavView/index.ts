import { injectable, computed, optional, RouterPlugin } from '@ringcentral-integration/next-core';
import {
  HeaderNavViewSpring as HeaderNavViewSpringBase
} from '@ringcentral-integration/micro-core/src/app/views';
import type {
  HeaderNavViewSpringOptions,
  NavButtonProps,
} from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';

import { t } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/i18n';
import { defaultTabMap } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/utils/tabs';


@injectable({
  name: 'HeaderNavViewSpring',
})
export class HeaderNavViewSpring extends HeaderNavViewSpringBase {
  constructor(
    protected _locale: Locale,
    protected _router: RouterPlugin,
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
      to: '/meeting',
      dataSign: 'videoTab',
    };
  }
}
