import {
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { AppHeaderNav, AppFooterNav } from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { Button } from '@ringcentral/spring-ui';
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';

import { CxAuth } from '../../services/CxAuth';
import { CxSettings } from '../../services/CxSettings';
import { CxCallMonitor } from '../../services/CxCallMonitor';
import { CxAgentSession } from '../../services/CxAgentSession';
import { cxPath } from '../../routes';
import type {
  CxSessionInfoViewProps,
  SessionInfoItem,
} from './CxSessionInfoView.interface';
import i18n from './i18n';

/**
 * InfoRow component - displays label and value vertically
 */
interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <div className="py-3">
    <div className="typography-subtitle text-neutral-b0 mb-1">{label}</div>
    <div className="typography-mainText text-neutral-b2">{value || 'N/A'}</div>
  </div>
);

/**
 * CxSessionInfoView - Displays detailed session information
 * Shows phone type, login style, login time, skill profile
 * Provides edit button to update session settings
 */
@injectable({
  name: 'CxSessionInfoView',
})
class CxSessionInfoView extends RcViewModule {
  constructor(
    private _cxAuth: CxAuth,
    private _cxSettings: CxSettings,
    private _cxCallMonitor: CxCallMonitor,
    private _cxAgentSession: CxAgentSession,
    private _locale: Locale,
    private _router: RouterPlugin,
  ) {
    super();
  }

  goBack() {
    this._router.push('/settings');
  }

  goToUpdateSession() {
    this._cxAgentSession.resetFormGroup();
    this._router.push(cxPath.sessionUpdate());
  }

  /**
   * Check if edit session button should be disabled
   */
  get disableEditButton(): boolean {
    return (
      this._cxCallMonitor.isOnCall ||
      this._cxSettings.isOffhooking ||
      this._cxSettings.isOffhook
    );
  }

  component(_props?: CxSessionInfoViewProps) {
    const { t } = useLocale(i18n);

    const {
      disableEditButton,
      loginDTS,
      loginType,
      dialDest,
      skillProfileName,
      dialGroupName,
    } = useConnector(() => ({
      disableEditButton: this.disableEditButton,
      loginDTS: this._cxAuth.agentSettings?.loginDTS || '',
      loginType: this._cxAuth.agentSettings?.loginType || '',
      dialDest: this._cxAuth.agentSettings?.dialDest || '',
      skillProfileName:
        this._cxAuth.inboundSettings?.skillProfile?.profileName || '',
      dialGroupName:
        (this._cxAuth.agentConfig?.outboundSettings?.outdialGroup as any)
          ?.groupName || '',
    }));

    const sessionInfo = useMemo<SessionInfoItem[]>(() => {
      const loginTime = loginDTS
        ? dayjs(loginDTS).format('M/D/YYYY, h:mm A')
        : '';

      return [
        {
          label: t('phone'),
          value: dialDest,
        },
        {
          label: t('loginType'),
          value: loginType,
        },
        {
          label: t('loginTime'),
          value: loginTime,
        },
        {
          label: t('skillProfile'),
          value: skillProfileName,
        },
        {
          label: t('dialGroup'),
          value: dialGroupName,
        },
      ];
    }, [dialDest, loginDTS, loginType, skillProfileName, dialGroupName, t]);

    const handleBackClick = useCallback(() => {
      this.goBack();
    }, []);

    const handleEditSession = useCallback(() => {
      this.goToUpdateSession();
    }, []);

    return (
      <>
        <AppHeaderNav override>
          <PageHeader onBackClick={handleBackClick}>
            {t('sessionInfo')}
          </PageHeader>
        </AppHeaderNav>

        <div className="flex flex-col flex-1 bg-neutral-base overflow-y-auto overflow-x-hidden">
          {/* Session Info List */}
          <div className="flex-1 px-4 divide-y divide-neutral-b4">
            {sessionInfo.map(({ value, label }) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
          </div>

          {/* Edit Button */}
          <div className="p-4 mt-auto">
            <Button
              data-sign="editSessionButton"
              color="primary"
              variant="contained"
              fullWidth
              size="medium"
              disabled={disableEditButton}
              onClick={handleEditSession}
            >
              {t('edit')}
            </Button>
          </div>
        </div>
        <AppFooterNav />
      </>
    );
  }
}

export { CxSessionInfoView };
