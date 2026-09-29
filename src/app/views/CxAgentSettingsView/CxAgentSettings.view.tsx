import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import {
  dynamic,
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import { HeadphonesFilledMd } from '@ringcentral/spring-icon';
import { Button, Icon, Text } from '@ringcentral/spring-ui';
import React from 'react';

import { RingCX } from '../../services/RingCX';
import type { CxViewModule } from '../../services/RingCX/RingCX.interface';
import i18n from './i18n';

@injectable({
  name: 'CxAgentSettingsView',
})
export class CxAgentSettingsView extends RcViewModule {
  @dynamic('CxSettingsView')
  private readonly _cxSettingsView?: CxViewModule;

  constructor(
    private readonly _ringCX: RingCX,
    private readonly _router: RouterPlugin,
  ) {
    super();
  }

  component(): React.ReactElement {
    const { t } = useLocale(i18n);
    const { loaded, stage } = useConnector(() => ({
      loaded: this._ringCX.loaded,
      stage: this._ringCX.stage,
    }));
    const CxSettings = this._cxSettingsView?.component;
    if (loaded && CxSettings && stage === 'ready') {
      return <CxSettings />;
    }
    return (
      <>
        <AppHeaderNav override>
          <PageHeader onBackClick={() => this._router.push('/settings')}>
            {t('agentSettingsTitle')}
          </PageHeader>
        </AppHeaderNav>
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
          <Icon
            className="mb-4 text-neutral-b2"
            size="xlarge"
            symbol={HeadphonesFilledMd}
          />
          <Text className="typography-title2 text-neutral-b0" component="h1">
            {t('agentSettingsTitle')}
          </Text>
          <Text className="mt-2 typography-body1 text-neutral-b2" component="p">
            {t('agentSettingsDescription')}
          </Text>
          <Button
            className="mt-6"
            data-sign="startAgentSessionFromSettings"
            loading={stage === 'loading' || stage === 'authenticating'}
            onClick={() => {
              void this._ringCX.startAgentSession();
            }}
          >
            {t('startAgentSession')}
          </Button>
        </div>
      </>
    );
  }
}
