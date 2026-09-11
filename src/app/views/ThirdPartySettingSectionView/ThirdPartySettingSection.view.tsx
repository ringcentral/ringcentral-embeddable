import { Analytics } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  injectable,
  RcViewModule,
  RouterPlugin,
  type RouteComponentProps,
  useConnector,
} from '@ringcentral-integration/next-core';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { ThirdParty } from '../../services/ThirdParty';
import { findSettingItem } from '../../services/ThirdParty/ThirdParty.helper';
import type { ThirdPartySetting } from '../../services/ThirdParty/ThirdParty.interface';

import { ThirdPartySettingSectionPanel } from './ThirdPartySettingSectionPanel';

const SAVE_THIRD_PARTY_SETTING_SECTION_EVENT =
  'Save Third Party Setting Section';

@injectable({
  name: 'ThirdPartySettingSectionView',
})
export class ThirdPartySettingSectionView extends RcViewModule {
  constructor(
    private readonly _thirdParty: ThirdParty,
    private readonly _router: RouterPlugin,
    private readonly _analytics: Analytics,
  ) {
    super();
  }

  component({
    match,
  }: RouteComponentProps<{ sectionId: string }>): ReactElement | null {
    const sectionId = match.params.sectionId;
    const section = useConnector(() =>
      findSettingItem(this._thirdParty.settings, sectionId),
    );
    const { current: uiFunctions } = useRef({
      onBack: () => this._router.goBack(),
      onSave: async (updatedSection: ThirdPartySetting): Promise<void> => {
        void this._analytics.track(SAVE_THIRD_PARTY_SETTING_SECTION_EVENT);
        await this._thirdParty.onUpdateSetting(updatedSection);
      },
    });

    if (!section || section.type !== 'section') {
      return null;
    }
    return <ThirdPartySettingSectionPanel section={section} {...uiFunctions} />;
  }
}
