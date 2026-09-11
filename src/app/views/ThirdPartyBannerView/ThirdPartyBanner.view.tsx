import {
  injectable,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import type { ReactElement } from 'react';
import React from 'react';

import { ThirdPartyBanner } from '../../components/ThirdPartyBanner';
import { ThirdParty } from '../../services/ThirdParty';

@injectable({
  name: 'ThirdPartyBannerView',
})
export class ThirdPartyBannerView extends RcViewModule {
  constructor(private _thirdParty: ThirdParty) {
    super();
  }

  component(): ReactElement | null {
    const banner = useConnector(() => this._thirdParty.customizedBanner);
    if (!banner) {
      return null;
    }
    return (
      <ThirdPartyBanner
        banner={banner}
        onAction={() => this._thirdParty.onBannerAction()}
        onClose={() => this._thirdParty.onBannerClose()}
      />
    );
  }
}
