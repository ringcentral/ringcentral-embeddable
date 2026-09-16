import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';
import {
  delegate,
  delegateRole,
  inject,
  injectable,
  PortManager,
  RcModule,
  systemRoles,
  watch,
} from '@ringcentral-integration/next-core';
import type { RoleState } from '@ringcentral-integration/next-core';
import { Subscription } from 'rxjs';

import { lastInteractedClientRole } from '../ClientInteraction';
import type { Webphone } from '../WebphoneV2';
import defaultIncomingAudio from '../WebphoneV2/audio/incoming.mp3';
import { isRing } from '../WebphoneV2/webphoneHelper';

const createEpoch = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const getErrorLogContext = (error: unknown) => ({
  errorName: error instanceof Error ? error.name : typeof error,
});

type RingtoneAudio = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
};

/**
 * Plays the incoming-call ringtone on a browser tab.
 *
 * The webphone decides *that* a call is ringing but cannot play audio itself
 * once it runs in the SharedWorker, and even in a tab it may not be a tab the
 * user has interacted with — Chrome blocks `play()` without a prior gesture.
 * So the ringtone is routed to the `lastInteractedClient`, which by definition
 * has had a trusted interaction, with the elected client plus a Notification as
 * fallback.
 *
 * Ringtone targeting is deliberately independent of call-media ownership: the
 * user may be looking at a different tab from the one carrying the audio.
 */
@injectable({
  name: 'WebphoneAlerting',
})
export class WebphoneAlerting extends RcModule {
  private _sessionsTeardown?: () => void;

  private _interactionRoleSubscription?: Subscription;

  private _connectedClientsSubscription?: Subscription;

  private _operation = Promise.resolve();

  private _alertEpoch?: string;

  private _ringtoneTargetClientId?: string;

  private _interactionClientId?: string;

  private _connectedClientIds = new Set<string>();

  private _recoveryEpoch?: string;

  private _fallbackEpoch?: string;

  private _audio?: RingtoneAudio;

  private _audioEpoch?: string;

  private _notification?: Notification;

  private _notificationEpoch?: string;

  constructor(
    @inject(MicroPhoneWebphone) private _webphone: Webphone,
    private _audioSettings: AudioSettings,
    private _portManager: PortManager,
  ) {
    super();
  }

  override onInit() {
    // Only the authoritative side decides when to alert; every client can play.
    if (this._portManager.shared && !this._portManager.isServer) {
      this.logger.debug('Webphone alerting inactive on shared client');
      return;
    }

    this.logger.info('Webphone alerting initialized', {
      shared: this._portManager.shared,
    });

    if (this._portManager.shared) {
      this._interactionRoleSubscription = this._portManager
        .getRoleStateStreams(lastInteractedClientRole.role)
        .roleState$.subscribe((state) => {
          this._interactionClientId = this._getOwnerId(state);
          this._recoverAfterClientLoss();
        });
      this._connectedClientsSubscription = this._portManager
        .getRoleStateStreams(systemRoles.connectedClients.role)
        .roleState$.subscribe((state) => {
          this._connectedClientIds = new Set(
            state.phase === 'owned'
              ? state.owners.map(({ clientId }) => clientId)
              : [],
          );
          this._recoverAfterClientLoss();
        });
    }

    this._sessionsTeardown = watch(
      this,
      () => this._webphone.sessions,
      (sessions) => {
        this._handleRinging(sessions ?? []);
      },
    );
  }

  override onReset() {
    this.logger.info('Webphone alerting reset');
    this._sessionsTeardown?.();
    this._sessionsTeardown = undefined;
    this._interactionRoleSubscription?.unsubscribe();
    this._interactionRoleSubscription = undefined;
    this._connectedClientsSubscription?.unsubscribe();
    this._connectedClientsSubscription = undefined;
    const epoch = this._alertEpoch;
    this._alertEpoch = undefined;
    this._ringtoneTargetClientId = undefined;
    this._recoveryEpoch = undefined;
    this._fallbackEpoch = undefined;
    if (epoch) this._enqueue(() => this._stopAlert(epoch));
  }

  async requestNotificationPermission() {
    if (typeof Notification === 'undefined') return 'unsupported' as const;
    return Notification.requestPermission();
  }

  async playRingtone(
    epoch: string,
    source: string,
    volume: number,
    deviceId: string,
  ) {
    if (!this._portManager.shared) {
      return this._playRingtoneLocally(epoch, source, volume, deviceId);
    }
    return this._playRingtoneOnLastInteractedClient(
      epoch,
      source,
      volume,
      deviceId,
    );
  }

  @delegateRole(systemRoles.electedClient)
  protected async _playRingtoneOnElectedClient(
    epoch: string,
    source: string,
    volume: number,
    deviceId: string,
  ) {
    await this._playRingtoneLocally(epoch, source, volume, deviceId);
  }

  async playRingtoneOnElectedClient(
    epoch: string,
    source: string,
    volume: number,
    deviceId: string,
  ) {
    if (!this._portManager.shared) {
      return this._playRingtoneLocally(epoch, source, volume, deviceId);
    }
    return this._playRingtoneOnElectedClient(epoch, source, volume, deviceId);
  }

  @delegateRole(lastInteractedClientRole)
  protected async _playRingtoneOnLastInteractedClient(
    epoch: string,
    source: string,
    volume: number,
    deviceId: string,
  ) {
    await this._playRingtoneLocally(epoch, source, volume, deviceId);
  }

  private async _playRingtoneLocally(
    epoch: string,
    source: string,
    volume: number,
    deviceId: string,
  ) {
    if (deviceId === 'off' || !source) {
      this.logger.debug('Webphone ringtone playback skipped', {
        disabled: deviceId === 'off',
        hasSource: !!source,
      });
      return;
    }

    const audio = this._audio ?? (new Audio() as RingtoneAudio);
    this._audio = audio;
    if (audio.src !== source) audio.src = source;
    audio.loop = true;
    audio.volume = volume;
    if (deviceId && deviceId !== 'default') await audio.setSinkId?.(deviceId);
    audio.currentTime = 0;
    // Rejects with NotAllowedError when this tab has had no user gesture; the
    // caller treats that as a routing failure and falls back.
    await audio.play();
    this._audioEpoch = epoch;
    this.logger.debug('Webphone ringtone playback started', {
      customDevice: Boolean(deviceId) && deviceId !== 'default',
    });
  }

  async stopRingtone(epoch: string) {
    if (this._portManager.shared) {
      await this._stopRingtoneOnAll(epoch);
      return;
    }
    this._stopLocalRingtone(epoch);
  }

  @delegate('all')
  protected async _stopRingtoneOnAll(epoch: string) {
    this._stopLocalRingtone(epoch);
  }

  private _stopLocalRingtone(epoch: string) {
    // The epoch guard keeps a late stop from silencing a newer ring.
    if (this._audioEpoch !== epoch) return;
    this._audio?.pause();
    this._audio?.removeAttribute('src');
    this._audio?.load();
    this._audioEpoch = undefined;
    this.logger.debug('Webphone ringtone playback stopped');
  }

  async showNotification(epoch: string) {
    if (this._portManager.shared) {
      return this._showNotificationOnElectedClient(epoch);
    }
    return this._showNotificationLocally(epoch);
  }

  @delegateRole(systemRoles.electedClient)
  protected async _showNotificationOnElectedClient(epoch: string) {
    return this._showNotificationLocally(epoch);
  }

  private _showNotificationLocally(epoch: string) {
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      this.logger.debug('Webphone incoming notification unavailable', {
        supported: typeof Notification !== 'undefined',
      });
      return false;
    }
    if (this._notificationEpoch === epoch) return true;
    this._notification = new Notification('Incoming call');
    this._notificationEpoch = epoch;
    this.logger.debug('Webphone incoming notification shown');
    return true;
  }

  private _handleRinging(sessions: readonly Webphone['sessions'][number][]) {
    const hasRinging = sessions.some((session) => isRing(session));
    if (hasRinging && !this._alertEpoch) {
      const epoch = createEpoch();
      this._alertEpoch = epoch;
      this._ringtoneTargetClientId = undefined;
      this._recoveryEpoch = undefined;
      this._fallbackEpoch = undefined;
      this.logger.info('Webphone incoming alert started');
      this._enqueue(() => this._startAlert(epoch));
      return;
    }
    if (!hasRinging && this._alertEpoch) {
      const epoch = this._alertEpoch;
      this._alertEpoch = undefined;
      this._ringtoneTargetClientId = undefined;
      this._recoveryEpoch = undefined;
      this._fallbackEpoch = undefined;
      this.logger.info('Webphone incoming alert stopped');
      this._enqueue(() => this._stopAlert(epoch));
    }
  }

  /** Serialises alert work so a stop can never overtake its start. */
  private _enqueue(task: () => Promise<unknown> | unknown) {
    this._operation = this._operation.then(task, task).then(
      () => undefined,
      () => undefined,
    );
  }

  private async _startAlert(
    epoch: string,
    clientId = this._interactionClientId,
  ) {
    if (this._alertEpoch !== epoch) return;

    const deviceId = this._audioSettings.ringtoneDeviceId;
    if (deviceId === 'off') return;
    // `incomingAudio` is '' when the user has switched the ringtone off.
    const configuredSource = this._webphone.incomingAudio;
    if (configuredSource === '') return;
    const source = configuredSource ?? defaultIncomingAudio;
    if (!source) return;

    const isRecovery = this._recoveryEpoch === epoch;
    if (isRecovery) this._recoveryEpoch = undefined;
    this._ringtoneTargetClientId = clientId;
    this.logger.debug('Webphone incoming ringtone routing', {
      recovery: isRecovery,
      hasTargetClient: !!clientId,
    });
    try {
      await this.playRingtone(
        epoch,
        source,
        this._audioSettings.ringtoneVolume,
        deviceId,
      );
      this._recoveryEpoch = undefined;
    } catch (error) {
      if (this._recoveryEpoch === epoch || this._fallbackEpoch === epoch) {
        return;
      }
      this._fallbackEpoch = epoch;
      this.logger.warn('Webphone ringtone routing failed; using fallback', {
        ...getErrorLogContext(error),
      });
      await Promise.allSettled([
        this.playRingtoneOnElectedClient(
          epoch,
          source,
          this._audioSettings.ringtoneVolume,
          deviceId,
        ),
        this.showNotification(epoch),
      ]);
    }
  }

  private _recoverAfterClientLoss() {
    const epoch = this._alertEpoch;
    const selectedClientId = this._ringtoneTargetClientId;
    if (
      !epoch ||
      !selectedClientId ||
      selectedClientId === this._interactionClientId ||
      this._connectedClientIds.has(selectedClientId) ||
      this._recoveryEpoch === epoch ||
      this._fallbackEpoch === epoch
    ) {
      return;
    }

    if (!this._interactionClientId) {
      this._fallbackEpoch = epoch;
      this.logger.warn(
        'Webphone ringtone target lost; showing incoming notification fallback',
      );
      this._enqueue(() => this.showNotification(epoch));
      return;
    }

    this._recoveryEpoch = epoch;
    this.logger.info('Webphone ringtone target lost; recovering alert');
    this._enqueue(() => this._startAlert(epoch, this._interactionClientId));
  }

  private _getOwnerId(state: RoleState) {
    return state.phase === 'owned' ? state.owners[0]?.clientId : undefined;
  }

  private async _stopAlert(epoch: string) {
    this.logger.debug('Webphone stopping incoming alert');
    await this.stopRingtone(epoch);
    await this.closeNotification(epoch);
  }

  async closeNotification(epoch: string) {
    if (this._portManager.shared) {
      await this._closeNotificationOnAll(epoch);
      return;
    }
    this._closeLocalNotification(epoch);
  }

  @delegate('all')
  protected async _closeNotificationOnAll(epoch: string) {
    this._closeLocalNotification(epoch);
  }

  private _closeLocalNotification(epoch: string) {
    if (this._notificationEpoch !== epoch) return;
    this._notification?.close();
    this._notification = undefined;
    this._notificationEpoch = undefined;
    this.logger.debug('Webphone incoming notification closed');
  }
}
