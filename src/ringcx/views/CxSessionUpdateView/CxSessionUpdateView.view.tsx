import {
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Button, Dialog } from '@ringcentral/spring-ui';
import React, { useCallback, useState } from 'react';

import type { LoginTypes } from '../../enums';
import { loginTypes } from '../../enums';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxAuth } from '../../services/CxAuth';
import type { LoginTypeOption } from '../../components/SessionConfig/SessionConfig.interface';
import type {
  CxSessionUpdateViewOptions,
  CxSessionUpdateViewProps,
} from './CxSessionUpdateView.interface';
import i18n from './i18n';
import { SessionConfig } from '../../components/SessionConfig';
import { InboundQueuesPanel } from '../../components/InboundQueuesPanel';
import { cxPath } from '../../routes';

/**
 * CxSessionUpdateView - Session update view for modifying agent session
 * Allows updating skill profile, inbound queues, and dial group settings
 */
@injectable({
  name: 'CxSessionUpdateView',
})
class CxSessionUpdateView extends RcViewModule {
  constructor(
    private _cxAgentSession: CxAgentSession,
    private _cxAuth: CxAuth,
    private _router: RouterPlugin,
    @optional('CxSessionUpdateViewOptions')
    private _options?: CxSessionUpdateViewOptions,
  ) {
    super();
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

  setDialGroupId(groupId: string) {
    this._cxAgentSession.setFormGroup({ dialGroupId: groupId });
  }

  async setLoginType(type: LoginTypes) {
    await this._cxAgentSession.setFormGroup({ loginType: type });
    const isIntegratedSoftphone = type === loginTypes.integrated;
    const autoAnswer = isIntegratedSoftphone
      ? this._cxAgentSession.autoAnswer
      : this._cxAgentSession.defaultAutoAnswerOn;
    await this._cxAgentSession.setFormGroup({ autoAnswer });
  }

  setExtensionNumber(number: string) {
    this._cxAgentSession.setFormGroup({ extensionNumber: number });
  }

  get isIntegratedSoftphone(): boolean {
    return (
      this._cxAgentSession.formGroup.loginType === loginTypes.integrated
    );
  }

  get showAutoAnswer(): boolean {
    const { allowAutoAnswer } = this._cxAuth.agentPermissions || {};
    return (allowAutoAnswer || false) && this.isIntegratedSoftphone;
  }

  get voiceConnectionChanged(): boolean {
    return this._cxAgentSession.loginType !== this._cxAgentSession.formGroup.loginType;
  }

  async updateSession() {
    if (!this._cxAgentSession.isSessionChanged) {
      this._returnToSessionInfo();
      return;
    }
    await this._cxAgentSession.updateAgent(this.voiceConnectionChanged);
    this._options?.onUpdateComplete?.();
    this._router.push(cxPath.home('dialer'));
  }

  cancelWithoutSave() {
    this._cxAgentSession.resetFormGroup();
    this._options?.onCancel?.();
    this._returnToSessionInfo();
  }

  /**
   * Session info opened this page in the same settings side widget, so the
   * return path stays on that widget instead of crossing into the agent tab.
   */
  private _returnToSessionInfo(): void {
    this._router.push(cxPath.settings());
  }

  component(_props?: CxSessionUpdateViewProps) {
    const { t } = useLocale(i18n);
    const [showQueuesPanel, setShowQueuesPanel] = useState(false);
    const [showSaveEditionModal, setShowSaveEditionModal] = useState(false);

    const {
      skillProfileList,
      inboundQueues,
      dialGroups,
      loginTypeList,
      formGroup,
      allowLoginControl,
      allowInbound,
      allowOutbound,
      showAutoAnswer,
      isSessionChanged,
    } = useConnector(() => ({
      skillProfileList: this._cxAgentSession.skillProfileList,
      inboundQueues: this._cxAgentSession.inboundQueues,
      dialGroups: this._cxAgentSession.dialGroups,
      loginTypeList: this._cxAgentSession.loginTypeList,
      formGroup: this._cxAgentSession.formGroup,
      allowLoginControl: this._cxAuth.agentPermissions?.allowLoginControl || false,
      allowInbound: this._cxAuth.agentPermissions?.allowInbound || false,
      allowOutbound: this._cxAuth.agentPermissions?.allowOutbound || false,
      showAutoAnswer: this.showAutoAnswer,
      isSessionChanged: this._cxAgentSession.isSessionChanged,
    }));

    const handleSkillProfileChange = useCallback(
      (profileId: string) => {
        this.setSkillProfileId(profileId);
      },
      [],
    );

    const handleInboundQueuesChange = useCallback(
      (selectedIds: string[]) => {
        this.setInboundQueueIds(selectedIds);
      },
      [],
    );

    const handleAutoAnswerChange = useCallback(
      (enabled: boolean) => {
        this.setAutoAnswer(enabled);
      },
      [],
    );

    const handleDialGroupChange = useCallback(
      (groupId: string) => {
        this.setDialGroupId(groupId);
      },
      [],
    );

    const handleLoginTypeChange = useCallback(
      (type: LoginTypes) => {
        this.setLoginType(type);
      },
      [],
    );

    const handleExtensionNumberChange = useCallback(
      (number: string) => {
        this.setExtensionNumber(number);
      },
      [],
    );

    const handleSubmitInboundQueues = useCallback(
      (selectedIds: string[]) => {
        this.setInboundQueueIds(selectedIds);
        setShowQueuesPanel(false);
      },
      [],
    );

    const handleUpdate = useCallback(async () => {
      await this.updateSession();
    }, []);

    const handleCancel = useCallback(() => {
      if (isSessionChanged) {
        setShowSaveEditionModal(true);
        return;
      }
      this.cancelWithoutSave();
    }, [isSessionChanged]);

    const handleConfirmSave = useCallback(async () => {
      setShowSaveEditionModal(false);
      await this.updateSession();
    }, []);

    const handleConfirmDiscard = useCallback(() => {
      setShowSaveEditionModal(false);
      this.cancelWithoutSave();
    }, []);

    // Show inbound queues panel
    if (showQueuesPanel) {
      return (
        <>
          <AppHeaderNav override>
            <></>
          </AppHeaderNav>
          <InboundQueuesPanel
            inboundQueues={inboundQueues}
            selectedQueueIds={formGroup.selectedInboundQueueIds || []}
            onSubmit={handleSubmitInboundQueues}
            onBack={() => setShowQueuesPanel(false)}
          />
          <AppFooterNav />
        </>
      );
    }

    return (
      <>
        <AppHeaderNav override>
          <PageHeader onBackClick={handleCancel}>
            {t('updateSession')}
          </PageHeader>
        </AppHeaderNav>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SessionConfig
            showSkillProfile={allowLoginControl && skillProfileList.length > 0}
            skillProfileList={skillProfileList}
            selectedSkillProfileId={formGroup.selectedSkillProfileId}
            onSkillProfileChange={handleSkillProfileChange}
            showInboundQueues={allowLoginControl && allowInbound && inboundQueues.length > 0}
            inboundQueues={inboundQueues}
            selectedInboundQueueIds={formGroup.selectedInboundQueueIds || []}
            onInboundQueuesChange={handleInboundQueuesChange}
            showInboundQueuesPanel={showQueuesPanel}
            onShowInboundQueuesPanelChange={setShowQueuesPanel}
            showDialGroup={allowOutbound}
            dialGroups={dialGroups}
            dialGroupId={formGroup.dialGroupId}
            onDialGroupChange={handleDialGroupChange}
            showVoiceConnection
            loginTypeList={loginTypeList as LoginTypeOption[]}
            loginType={formGroup.loginType}
            onLoginTypeChange={handleLoginTypeChange}
            showExtensionNumber={formGroup.loginType === loginTypes.external}
            extensionNumber={formGroup.extensionNumber || ''}
            onExtensionNumberChange={handleExtensionNumberChange}
            showAutoAnswer={showAutoAnswer}
            autoAnswer={formGroup.autoAnswer || false}
            onAutoAnswerChange={handleAutoAnswerChange}
          />
        </div>

        <div className="px-4 py-4 flex gap-3">
          <Button
            variant="outlined"
            color="neutral"
            fullWidth
            onClick={handleCancel}
            data-sign="cancelButton"
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleUpdate}
            data-sign="updateButton"
          >
            {t('update')}
          </Button>
        </div>
        <Dialog
          open={showSaveEditionModal}
          onClose={() => setShowSaveEditionModal(false)}
          data-sign="saveEditionModal"
        >
          <div className="p-4 flex flex-col gap-3">
            <h3 className="typography-title text-neutral-b1">
              {t('saveEditionModalTitle')}
            </h3>
            <p className="typography-mainText text-neutral-b2">
              {t('saveEditionModalContent')}
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outlined"
                color="neutral"
                fullWidth
                onClick={handleConfirmDiscard}
                data-sign="discardButton"
              >
                {t('cancel')}
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleConfirmSave}
                data-sign="saveButton"
              >
                {t('save')}
              </Button>
            </div>
          </div>
        </Dialog>
        <AppFooterNav />
      </>
    );
  }
}

export { CxSessionUpdateView };
