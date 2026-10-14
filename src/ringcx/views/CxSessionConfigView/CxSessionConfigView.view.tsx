import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  computed,
  injectable,
  optional,
  RcViewModule,
  useConnector,
  UIFunctions,
  UIProps,
  RouterPlugin,
  delegate,
} from '@ringcentral-integration/next-core';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { Button } from '@ringcentral/spring-ui';
import { ArrowLeftMd } from '@ringcentral/spring-icon';
import type { LoginTypes } from '../../enums';
import { loginTypes } from '../../enums';
import { RingCX } from '../../../app/services/RingCX';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxAuth } from '../../services/CxAuth';
import type { CxAgent } from '../../services/CxClient/interfaces';
import type {
  CxSessionConfigViewOptions,
  CxSessionConfigViewProps,
  CxSessionConfigViewUIProps,
  CxSessionConfigViewUIFunctions,
} from './CxSessionConfigView.interface';
import i18n from './i18n';
import { SessionConfig } from '../../components/SessionConfig';
import { InboundQueuesPanel } from '../../components/InboundQueuesPanel';
import { cxPath } from '../../routes';

/**
 * CxSessionConfigView - Session configuration view for agent setup
 * Handles login type, inbound queues, skill profile, and auto-answer settings
 */
@injectable({
  name: 'CxSessionConfigView',
})
class CxSessionConfigView extends RcViewModule {
  constructor(
    private _cxAgentSession: CxAgentSession,
    private _cxAuth: CxAuth,
    private _locale: Locale,
    private _router: RouterPlugin,
    private _ringCX: RingCX,
    @optional('CxSessionConfigViewOptions')
    private _sessionConfigViewOptions?: CxSessionConfigViewOptions,
  ) {
    super();
  }

  @computed((that: CxSessionConfigView) => [that._cxAuth.agent, that._cxAuth.agentId])
  get selectedAgent(): CxAgent | null {
    const agents = this._cxAuth.authenticateResponse?.agents || [];
    const agentId = this._cxAuth.agentId;
    return agents.find((agent) => agent.agentId === agentId) || null;
  }

  get showReChooseAccount(): boolean {
    return !this._cxAuth.isOnlyOneAgent;
  }

  get selectedIntegratedSoftphone(): boolean {
    return (
      this._cxAgentSession.formGroup.loginType === loginTypes.integrated
    );
  }

  get showInboundQueues(): boolean {
    const { allowLoginControl, allowInbound } = this._cxAuth.agentPermissions || {};
    return (
      (allowLoginControl || false) &&
      (allowInbound || false) &&
      this._cxAgentSession.inboundQueues.length > 0
    );
  }

  get showSkillProfile(): boolean {
    const { allowLoginControl } = this._cxAuth.agentPermissions || {};
    return (
      (allowLoginControl || false) &&
      this._cxAgentSession.skillProfileList.length > 0
    );
  }

  get showAutoAnswer(): boolean {
    const { allowAutoAnswer } = this._cxAuth.agentPermissions || {};
    return (allowAutoAnswer || false) && this.selectedIntegratedSoftphone;
  }

  get showDialGroup(): boolean {
    return (
      (this._cxAuth.agentPermissions?.allowOutbound || false) &&
      this._cxAgentSession.dialGroups.length > 1
    );
  }

  getInboundQueuesFieldText(t: (key: string) => string): string {
    const selectedIds = this._cxAgentSession.formGroup.selectedInboundQueueIds || [];
    const allQueues = this._cxAgentSession.inboundQueues;
    if (selectedIds.length === 0) {
      return t('none');
    }
    if (selectedIds.length === 1) {
      const selectedQueue = allQueues.find(
        (queue) => queue.gateId === selectedIds[0],
      );
      return selectedQueue?.gateName || t('none');
    }
    return `${t('multiple')} (${selectedIds.length})`;
  }

  @delegate('server')
  async setLoginType(type: LoginTypes) {
    // Set login type first, then reset autoAnswer based on the new login type
    await this._cxAgentSession.setFormGroup({ loginType: type });
    const isIntegratedSoftphone = type === loginTypes.integrated;
    const autoAnswer = isIntegratedSoftphone
      ? this._cxAgentSession.autoAnswer
      : this._cxAgentSession.defaultAutoAnswerOn;
    await this._cxAgentSession.setFormGroup({ autoAnswer });
  }

  setSkillProfileId(profileId: string) {
    this._cxAgentSession.setFormGroup({ selectedSkillProfileId: profileId });
  }

  setInboundQueueIds(ids: string[]) {
    this._cxAgentSession.setFormGroup({ selectedInboundQueueIds: ids });
  }

  setAutoAnswer(autoAnswer: boolean) {
    this._cxAgentSession.setFormGroup({ autoAnswer });
  }

  setExtensionNumber(number: string) {
    this._cxAgentSession.setFormGroup({ extensionNumber: number });
  }

  setDialGroupId(groupId: string) {
    this._cxAgentSession.setFormGroup({ dialGroupId: groupId });
  }

  async onAccountReChoose() {
    await this._cxAuth.reselectAgent();
    this._router.push(cxPath.chooseAccount());
  }

  /**
   * Leaves the setup flow without an agent session, so the Agent tab falls
   * back to its start screen.
   */
  cancelAgentSetup() {
    void this._ringCX.endAgentSession();
    this._router.push(cxPath.agent());
  }

  async setConfigure() {
    try {
      await this._cxAgentSession.configureAgent({
        needAssignFormGroupValue: true,
      });
    } catch (e) {
      this.logger.error('setConfigure error', e);
    }
  }

  getUIProps(): UIProps<CxSessionConfigViewUIProps> {
    return {
      selectedAgent: this.selectedAgent,
      showReChooseAccount: this.showReChooseAccount,
      isLoading: this._cxAgentSession.configuring,
      currentLocale: this._locale.currentLocale,
      showInboundQueues: this.showInboundQueues,
      showSkillProfile: this.showSkillProfile,
      showAutoAnswer: this.showAutoAnswer,
      showDialGroup: this.showDialGroup,
      loginTypeList: this._cxAgentSession.loginTypeList,
      skillProfileList: this._cxAgentSession.skillProfileList,
      inboundQueues: this._cxAgentSession.inboundQueues,
      dialGroups: this._cxAgentSession.dialGroups,
      formGroup: this._cxAgentSession.formGroup,
      allowOutbound: this._cxAuth.agentPermissions?.allowOutbound || false,
    };
  }

  getUIFunctions(): UIFunctions<CxSessionConfigViewUIFunctions> {
    return {
      onAccountReChoose: () => this.onAccountReChoose(),
      cancelAgentSetup: () => this.cancelAgentSetup(),
      setConfigure: () => this.setConfigure(),
      setLoginType: (type: LoginTypes) => this.setLoginType(type),
      setSkillProfileId: (profileId: string) => this.setSkillProfileId(profileId),
      setExtensionNumber: (number: string) => this.setExtensionNumber(number),
      setAutoAnswer: (enabled: boolean) => this.setAutoAnswer(enabled),
      setDialGroupId: (groupId: string) => this.setDialGroupId(groupId),
      setInboundQueueIds: (ids: string[]) => this.setInboundQueueIds(ids),
    };
  }

  component(_props?: CxSessionConfigViewProps) {
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());
    const [showQueuesPanel, setShowQueuesPanel] = useState(false);

    const {
      selectedAgent,
      showReChooseAccount,
      isLoading,
      showInboundQueues,
      showSkillProfile,
      showAutoAnswer,
      loginTypeList,
      skillProfileList,
      inboundQueues,
      dialGroups,
      formGroup,
      allowOutbound,
    } = useConnector(() => this.getUIProps());

    const handleSubmitInboundQueues = useCallback(
      (selectedIds: string[]) => {
        uiFunctions.setInboundQueueIds(selectedIds);
        setShowQueuesPanel(false);
      },
      [uiFunctions],
    );

    const isExternalPhone = formGroup.loginType === loginTypes.external;

    const agentTypeLabel = useMemo(() => {
      if (!selectedAgent?.agentType) return '';
      return t(selectedAgent.agentType as 'agent' | 'supervisor');
    }, [selectedAgent?.agentType, t]);

    if (showQueuesPanel) {
      return (
        <>
          <AppHeaderNav override>
            <></>
          </AppHeaderNav>
          <AppFooterNav />
          <InboundQueuesPanel
            inboundQueues={inboundQueues}
            selectedQueueIds={formGroup.selectedInboundQueueIds || []}
            onSubmit={handleSubmitInboundQueues}
            onBack={() => setShowQueuesPanel(false)}
          />
        </>
      );
    }

    return (
      <div className="flex flex-col h-full bg-neutral-base">
        <AppHeaderNav override>
          <PageHeader onBackClick={uiFunctions.cancelAgentSetup}>
            {t('startSession')}
          </PageHeader>
        </AppHeaderNav>
        <AppFooterNav />
        <div
          className={`bg-neutral-b5 ${showReChooseAccount ? 'visible' : 'invisible'} pl-4`}
        >
          <Button
            onClick={uiFunctions.onAccountReChoose}
            startIcon={ArrowLeftMd}
            variant="text"
            size="medium"
            color="primary"
          >
            {t('switchAccount')}
          </Button>
        </div>
        <div
          className="flex justify-between items-center px-4 pt-4 pb-4"
          data-sign="accountInfo"
        >
          <span className="typography-mainText text-neutral-b1 truncate">
            {selectedAgent?.accountName}
          </span>
          <span
            className="typography-descriptor text-neutral-b2"
            data-sign="agentType"
          >
            {agentTypeLabel}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          <SessionConfig
            showInboundQueues={showInboundQueues}
            inboundQueues={inboundQueues}
            selectedInboundQueueIds={formGroup.selectedInboundQueueIds || []}
            onInboundQueuesChange={uiFunctions.setInboundQueueIds}
            showInboundQueuesPanel={showQueuesPanel}
            onShowInboundQueuesPanelChange={setShowQueuesPanel}
            showSkillProfile={showSkillProfile}
            skillProfileList={skillProfileList}
            selectedSkillProfileId={formGroup.selectedSkillProfileId}
            onSkillProfileChange={uiFunctions.setSkillProfileId}
            showDialGroup={allowOutbound}
            dialGroups={dialGroups}
            dialGroupId={formGroup.dialGroupId}
            onDialGroupChange={uiFunctions.setDialGroupId}
            showVoiceConnection
            loginTypeList={loginTypeList}
            loginType={formGroup.loginType}
            onLoginTypeChange={uiFunctions.setLoginType}
            showExtensionNumber={isExternalPhone}
            extensionNumber={formGroup.extensionNumber || ''}
            onExtensionNumberChange={uiFunctions.setExtensionNumber}
            showAutoAnswer={showAutoAnswer}
            autoAnswer={formGroup.autoAnswer || false}
            onAutoAnswerChange={uiFunctions.setAutoAnswer}
          />
        </div>
        <div className="px-4 py-4">
          <Button
            data-sign="setConfigure"
            fullWidth
            disabled={isLoading}
            loading={isLoading}
            onClick={uiFunctions.setConfigure}
          >
            {t('continue')}
          </Button>
        </div>
      </div>
    );
  }
}

export { CxSessionConfigView };
