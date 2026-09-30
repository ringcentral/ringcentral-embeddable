import {
  ModalView,
  useModalItemView,
} from '@ringcentral-integration/micro-core/src/app/views';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  injectable,
  portal,
  RcViewModule,
  PortManager,
  delegate,
  delegateRole,
  RoleUnavailableError,
} from '@ringcentral-integration/next-core';
import type { PortalInstance } from '@ringcentral-integration/next-core';
import { Button } from '@ringcentral/spring-ui';
import { format } from '@ringcentral-integration/utils';
import React from 'react';

import { lastInteractedClientRole } from '../../../app/services/ClientInteraction';
import { CxCallbackTypes } from '../../services/CxClient/enums';
import { CxIntegratedSoftphone } from '../../services/CxIntegratedSoftphone';
import { CxSubscription } from '../../services/CxSubscription';
import { CxPresence } from '../../services/CxPresence';
import { CxClient } from '../../services/CxClient';
import type { CxSipRingingData } from '../../services/CxClient/interfaces/CxClientCallMapping.interface';
import type { CxBaseCall } from '../../services/CxClient/interfaces';
import i18n from './i18n';

/**
 * Ringing modal payload
 */
interface RingingPayload {
  displayName: string;
  queueName: string;
  isInbound: boolean;
}

/**
 * CxIntegratedSoftphoneView - Modal view for SIP call ringing and registration failure
 * Handles UI modals triggered by SIP events from the CxIntegratedSoftphone service
 */
@injectable({
  name: 'CxIntegratedSoftphoneView',
})
class CxIntegratedSoftphoneView extends RcViewModule {
  private _ringingInstance: PortalInstance | null = null;

  constructor(
    private modalView: ModalView,
    private cxIntegratedSoftphone: CxIntegratedSoftphone,
    private cxSubscription: CxSubscription,
    private cxPresence: CxPresence,
    private cxClient: CxClient,
    private portManager: PortManager,
  ) {
    super();
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this._bindSipModalEvents();
      });
    } else {
      this._bindSipModalEvents();
    }
  }

  /**
   * Ringing modal content - shows incoming/outbound call info with Answer/Reject
   */
  private RingingContent = () => {
    const { action, props } = useModalItemView<RingingPayload>();
    const { t } = useLocale(i18n);
    const payload = props?.payload;
    const isInbound = payload?.isInbound ?? false;
    const displayName = payload?.displayName ?? '';
    const queueName = payload?.queueName ?? '';

    return (
      <div className="m-4 flex flex-col gap-3" data-sign="ringingModal">
        <h3 className="typography-title" data-sign="ringingTitle">
          {t('inviteModalTitle')}
        </h3>
        <div className="typography-mainText text-neutral-b2" data-sign="ringingInfo">
          {isInbound ? (
            <>
              <p className="truncate" title={format(t('incomingText'), { displayName })}>
                {format(t('incomingText'), { displayName })}
              </p>
              {queueName && (
                <p className="truncate" title={format(t('queueNameText'), { queueName })}>
                  {format(t('queueNameText'), { queueName })}
                </p>
              )}
            </>
          ) : (
            <p className="truncate" title={format(t('outboundText'), { displayName })}>
              {format(t('outboundText'), { displayName })}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <div data-sign="ringingAnswer">
            <Button
              fullWidth
              size="xlarge"
              onClick={() => action?.confirm()}
            >
              {t('inviteModalAnswer')}
            </Button>
          </div>
          <div data-sign="ringingReject">
            <Button
              fullWidth
              size="xlarge"
              variant="outlined"
              onClick={() => action?.cancel()}
            >
              {t('inviteModalReject')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Registration failed modal content
   */
  private RegistrationFailedContent = () => {
    const { action } = useModalItemView();
    const { t } = useLocale(i18n);

    return (
      <div className="m-4 flex flex-col gap-3" data-sign="registrationFailedModal">
        <h3 className="typography-title" data-sign="registrationFailedTitle">
          {t('registrationFailedTitle')}
        </h3>
        <p className="typography-mainText text-neutral-b2" data-sign="registrationFailedContent">
          {t('registrationFailedContent')}
        </p>
        <div className="mt-4">
          <div data-sign="registrationFailedConfirm">
            <Button
              fullWidth
              size="xlarge"
              onClick={() => action?.confirm()}
            >
              {t('registrationFailedConfirm')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Ringing confirmation modal definition
   */
  @portal
  private ringingModal = this.modalView.create<RingingPayload>({
    view: () => <this.RingingContent />,
    props: () => ({
      type: 'drawer',
      header: null,
      disableBackdropClick: true,
      'aria-label': 'incoming call',
    }),
  });

  /**
   * Registration failed alert modal definition
   */
  @portal
  private registrationFailedModal = this.modalView.create({
    view: () => <this.RegistrationFailedContent />,
    props: () => ({
      type: 'drawer',
      header: null,
      disableBackdropClick: true,
      'aria-label': 'registration failed',
    }),
  });

  /**
   * Bind SIP events to show/close modals automatically
   */
  private _bindSipModalEvents() {
    // On ringing: show modal if auto-answer is not handling it
    this.cxIntegratedSoftphone.onRinging(async (ringingCall?: CxSipRingingData) => {
      this.logger.info('SIP_RINGING~~');
      const currentCall = (await this.cxClient.getCurrentCall()) as
        | CxBaseCall
        | undefined;
      const queueName = currentCall?.queue?.name ?? '';
      const { dialoutStatus, isOffhooking, isManualOffhook } = this.cxPresence;
      const isInbound =
        dialoutStatus !== 'dialing' &&
        !(isManualOffhook && isOffhooking) &&
        currentCall?.callType === 'INBOUND';
      // The offhook INVITE carries no display name, so the call the agent is
      // being offered is the only place the other party can come from.
      const displayName =
        ringingCall?.data ||
        (isInbound ? currentCall?.ani : currentCall?.dnis) ||
        '';
      this.showRingingModal({ displayName, queueName, isInbound });
    });
    // On SIP ended: close ringing modal if still open
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_ENDED, () => {
      this.closeRingingModal();
    });
    // A host page command can answer the leg without going through the modal.
    this.cxIntegratedSoftphone.onRingingEnded(() => {
      this.closeRingingModal();
    });
    // On registration failed: show failed modal
    this.cxSubscription.subscribe(
      CxCallbackTypes.SIP_REGISTRATION_FAILED,
      () => {
        this.showRegistrationFailedModal();
      },
    );
  }

  /**
   * Show the ringing confirmation modal.
   *
   * Opened on the port that handles SIP events, the server in shared mode.
   * Modal state is synced, so every tab shows the modal, and the agent's choice
   * resolves back here: `sipAnswer` then runs on the server, where it leaves
   * call media with the tab the agent clicked in.
   *
   * The ringtone belongs to `WebphoneAlerting`, so it follows the user's audio
   * settings and plays on a tab that is allowed to start audio.
   */
  async showRingingModal(payload: RingingPayload): Promise<void> {
    // Prevent duplicate modals
    if (this._ringingInstance) {
      return;
    }
    const instance = this.modalView.open(this.ringingModal, payload);
    this._ringingInstance = instance;
    instance.closed.then((answer) => {
      // `closeRingingModal` clears the reference before closing, so a leg that
      // ended on its own must not be reported back as an agent rejection.
      const isAgentChoice = this._ringingInstance === instance;
      this._ringingInstance = null;
      if (!isAgentChoice) {
        return;
      }
      if (answer) {
        this.cxIntegratedSoftphone.sipAnswer();
      } else {
        this.cxIntegratedSoftphone.sipReject();
      }
    });
  }

  /**
   * Close the ringing modal if open (e.g. when SIP_ENDED fires)
   */
  async closeRingingModal(): Promise<void> {
    if (this._ringingInstance) {
      this._ringingInstance = null;
      this.modalView.close(this.ringingModal);
    }
  }

  /**
   * Show the registration failed alert modal, reloads the agent's tab on
   * confirm
   */
  async showRegistrationFailedModal(): Promise<void> {
    const result = this.modalView.open(this.registrationFailedModal);
    await result.closed;
    await this._reloadAgentTab();
  }

  /**
   * Reloads the tab the agent last interacted with, which is the one where
   * they confirmed the alert, falling back to the main client while no tab
   * holds that role.
   */
  private async _reloadAgentTab(): Promise<void> {
    if (!this.portManager?.shared) {
      window.location.reload();
      return;
    }
    try {
      await this._reloadLastInteractedClient();
    } catch (error) {
      if (!(error instanceof RoleUnavailableError)) {
        throw error;
      }
      await this._reloadMainClient();
    }
  }

  @delegateRole(lastInteractedClientRole)
  protected async _reloadLastInteractedClient(): Promise<void> {
    window.location.reload();
  }

  @delegate('mainClient')
  protected async _reloadMainClient(): Promise<void> {
    window.location.reload();
  }

  /**
   * Component method required by RcViewModule (not rendered directly)
   */
  component() {
    return null;
  }
}

export { CxIntegratedSoftphoneView };
