import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import {
  Auth,
  Client,
  track,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';
import {
  action,
  delegate,
  delegateRole,
  injectable,
  optional,
  PortManager,
  state,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import { filter, map, Observable, Subscription } from 'rxjs';

import { runOnAllPorts } from '../../../lib/runOnAllPorts';

import { embeddableTrackEvents } from '../Analytics/embeddableTrackEvents';
import { ClientInteraction } from '../ClientInteraction';
import { VoicemailDrop } from '../VoicemailDrop';
import { invokeRoleForValue } from '../../../lib/roleCompat';
import { WebphoneMedia, webphoneMediaOwnerRole } from '../WebphoneMedia';
import type {
  WebphoneCallEvent,
  WebphoneMonitoredPickupCall,
  WebphoneMonitoredPickupParams,
  WebphoneNormalizedSession,
  WebphoneParkLocationTarget,
  WebphoneParkToLocationParams,
} from './WebphoneApi.interface';
import { getCallEndedTrackProps } from './getCallEndedTrackProps';
import { t } from './i18n';
import type { RecordStatus } from './recordStatus';
import { voicemailDropStatus } from './voicemailDropStatus';
import { WebphoneV2, type WebphoneV2Options } from './WebphoneV2';

const LAST_ENDED_SESSIONS_LIMIT = 5;

/**
 * Methods that must execute where the WebPhone instance lives.
 *
 * The runtime holds its call sessions in memory on the authoritative port, so a
 * command invoked from a tab has to be forwarded to the server or it throws
 * "Webphone session <id> is unavailable". Upstream gets this routing from
 * `WebphoneFacade`; this app has no facade (v2 is always on), so the same
 * allow-list is applied here.
 */
const COMMAND_METHODS = [
  'connect',
  'disconnect',
  'makeCall',
  'answer',
  'reject',
  'resume',
  'forward',
  'mute',
  'unmute',
  'hold',
  'unhold',
  'startRecord',
  'stopRecord',
  'park',
  'parkToLocation',
  'pickParkLocation',
  'pickGroupCall',
  'pickCallQueueCall',
  'transfer',
  'startWarmTransfer',
  'completeWarmTransfer',
  'flip',
  'sendDTMF',
  'hangup',
  'toVoiceMail',
  'replyWithMessage',
  'switchCall',
  'pickupInboundCall',
  'updateSessionMatchedContact',
  'toggleMinimized',
  'setIncomingAudioIntoStorage',
  'loadClientAudio',
  'setRingtone',
  'setEngageAgentEptEnabled',
  'reconnectWithCurrentHeaders',
  // App-specific: validates against the server's session records before
  // delegating the media work to the owner tab.
  'dropVoicemailMessage',
  // App-specific: both write into the server's session records, so a call from
  // a tab has to be forwarded or it silently finds nothing to update.
  'updateRecordStatus',
  'setForwardFlag',
  // App-specific: RingCX voicemail drop. Hints and session records both live
  // on the server. The silent answer is deliberately not media-starting: it
  // must not move media ownership to whichever tab asked.
  'registerCxVoicemailDropHint',
  'clearCxVoicemailDropHint',
  'answerCxVoicemailDrop',
] as const;

/** Commands that begin call media, so the acting tab should own it. */
const MEDIA_STARTING_COMMANDS = new Set<string>([
  'makeCall',
  'answer',
  'switchCall',
  'pickupInboundCall',
  'pickParkLocation',
  'pickGroupCall',
  'pickCallQueueCall',
]);

/**
 * Position of the optional error-handler callback in each signature.
 *
 * Functions cannot be serialized across the port, so the callback is stripped
 * before delegating and invoked locally if the command rejects.
 */
const ERROR_HANDLER_INDEXES: Readonly<Record<string, number>> = {
  mute: 1,
  hold: 1,
  unhold: 1,
  stopRecord: 1,
  hangup: 1,
  replyWithMessage: 2,
};

/**
 * Monitored call as this app's callers already have it.
 *
 * `Adapter._executePickCall` and `CallHUDView` both hand over a raw
 * `PresenceActiveCall`, whose parties are flat strings and whose `sipData` is
 * optional. The runtime wants nested party objects.
 */
export interface WebphoneLegacyPickupCall {
  direction: string;
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  telephonySessionId: string;
  sipData?: { fromTag: string; toTag: string };
}

const toMonitoredPickupCall = (
  activeCall: WebphoneLegacyPickupCall,
): WebphoneMonitoredPickupCall => ({
  telephonySessionId: activeCall.telephonySessionId,
  direction: activeCall.direction === 'Outbound' ? 'Outbound' : 'Inbound',
  from: { phoneNumber: activeCall.from, name: activeCall.fromName },
  to: { phoneNumber: activeCall.to, name: activeCall.toName },
  sipData: activeCall.sipData,
});

/** Accepts either the runtime's params object or the app's positional args. */
const toPickupParams = (
  extensionIdOrParams: string | WebphoneMonitoredPickupParams,
  activeCall?: WebphoneLegacyPickupCall,
  fromNumber?: string,
): WebphoneMonitoredPickupParams => {
  if (typeof extensionIdOrParams !== 'string') {
    return extensionIdOrParams;
  }
  if (!activeCall) {
    throw new Error('Invalid activeCall');
  }
  return {
    extensionId: extensionIdOrParams,
    activeCall: toMonitoredPickupCall(activeCall),
    fromNumber: fromNumber ?? '',
  };
};

/**
 * This app's webphone: the ported upstream `WebphoneV2` runtime plus the APIs
 * this project's consumers need and upstream does not provide.
 *
 * Everything call-related lives in `WebphoneV2`, which is a near-verbatim copy
 * of the micro/next implementation so the two stay in sync. Only genuinely
 * app-specific surface belongs here.
 */
@injectable({
  name: 'Webphone',
})
export class Webphone extends WebphoneV2 {
  private _endedSubscription?: Subscription;

  private _mirrorSubscription?: Subscription;

  private _ownerSubscription?: Subscription;

  constructor(
    protected override _auth: Auth,
    protected override _client: Client,
    protected override _storage: StoragePlugin,
    protected override _webphoneMedia: WebphoneMedia,
    protected override _audioSettings: AudioSettings,
    protected override _portManager: PortManager,
    protected _toast: Toast,
    @optional()
    protected _clientInteraction?: ClientInteraction,
    @optional()
    protected _voicemailDrop?: VoicemailDrop,
    @optional('WebphoneV2Options')
    protected override _options?: WebphoneV2Options,
  ) {
    super(
      _auth,
      _client,
      _storage,
      _webphoneMedia,
      _audioSettings,
      _portManager,
      _options,
    );
    // Voicemail drop lazily builds an AudioContext and is client-only; the
    // webphone must not wait on it.
    if (_voicemailDrop) {
      this._ignoreModuleReadiness(_voicemailDrop);
    }
  }

  /**
   * Recently ended calls, newest first.
   *
   * `ActiveCallControl` reads this to recover the local party id of a call that
   * has already left `sessions`.
   */
  @state
  lastEndedSessions: NormalizedSession[] = [];

  /** Emits the session of each ended call. */
  readonly end$: Observable<WebphoneNormalizedSession> =
    this.callEvents$.pipe(
      filter((event) => event.type === 'callEnd'),
      map((event) => event.session),
    );

  override async onInit() {
    await super.onInit();
    this._endedSubscription = this.end$.subscribe((session) => {
      void this._recordEndedSession(session);
      this._trackCallEnded(session);
    });
    // Report ownership moves so the host page can follow which tab is live.
    this._ownerSubscription = this._portManager
      .getRoleStateStreams(webphoneMediaOwnerRole.role)
      .roleState$.subscribe(() => {
        if (this._portManager.shared && !this._portManager.isServer) return;
        void runOnAllPorts(
          this._portManager,
          this as Webphone,
          'emitActiveWebphoneChangedOnPort',
          [
            {
              activeId: this.webphoneOwnerClientId,
              currentActive: this.isWebphoneOwner,
            },
          ],
        ).catch(() => undefined);
      });
    // The runtime emits call events in-process, and it only runs on the
    // authoritative port — so without mirroring, nothing in a tab ever fires:
    // Adapter's postMessage relay, SmartNotes' onCall* hooks and the connecting
    // view all go silent. Upstream gets this from WebphoneFacade.
    if (this._portManager.shared && this._portManager.isServer) {
      this._mirrorSubscription = this._callEventsSubject.subscribe((event) => {
        void runOnAllPorts(
          this._portManager,
          this as Webphone,
          'mirrorCallEvent',
          [event],
          {
            includeServer: false,
          },
        ).catch((error) => {
          this.logger.warn('Webphone call event mirror failed', { error });
        });
      });
    }
  }

  override async onReset() {
    this._endedSubscription?.unsubscribe();
    this._endedSubscription = undefined;
    this._mirrorSubscription?.unsubscribe();
    this._mirrorSubscription = undefined;
    this._ownerSubscription?.unsubscribe();
    this._ownerSubscription = undefined;
    await super.onReset();
  }

  /**
   * Re-emits a server call event on a client port. The server already emitted
   * it locally, so it only reaches clients (see `runOnAllPorts`), and the
   * guard keeps a server port from double-firing handlers. Public only so
   * `fork()` can reach it.
   */
  async mirrorCallEvent(event: WebphoneCallEvent) {
    if (!this._portManager.shared || this._portManager.isServer) return;
    this._callEventsSubject.next(event);
    if (event.type === 'callRing') {
      this._eventEmitter.emit(event.type, event.session, event.ringSession);
      return;
    }
    this._eventEmitter.emit(
      event.type,
      event.session,
      event.activeSession,
      ...(event.type === 'callEnd' ? [event.ringSession] : []),
    );
  }

  /**
   * `onInit` only runs on the authoritative port, so each ended call is
   * tracked once, like the legacy active-tab tracking.
   */
  @track((_that: Webphone, session: WebphoneNormalizedSession) => [
    embeddableTrackEvents.webRTCCallEnded,
    getCallEndedTrackProps(session),
  ])
  private _trackCallEnded(_session: WebphoneNormalizedSession): void {}

  @action
  protected _setLastEndedSessions(sessions: NormalizedSession[]) {
    this.lastEndedSessions = sessions;
  }

  private async _recordEndedSession(session: WebphoneNormalizedSession) {
    const previous = this.lastEndedSessions.filter(
      (ended) => ended.id !== session.id,
    );
    this._setLastEndedSessions(
      [session as unknown as NormalizedSession, ...previous].slice(
        0,
        LAST_ENDED_SESSIONS_LIMIT,
      ),
    );
  }

  /**
   * Client id of the port that currently owns the webphone.
   *
   * Ownership is now the `webphone.mediaOwner` role rather than the old
   * activeTab election, so whoever carries the call audio is authoritative.
   * `SmartNotes` routes the notes widget with these, and `Adapter` reports them.
   */
  get webphoneOwnerClientId(): string | null {
    return this._webphoneMedia.mediaOwnerClientId ?? null;
  }

  get isWebphoneOwner(): boolean {
    return this._webphoneMedia.isLocalMediaOwner;
  }

  /** @deprecated Kept for the existing Adapter payload shape. */
  get activeWebphoneId(): string | null {
    return this.webphoneOwnerClientId;
  }

  /** @deprecated Kept for the existing Adapter payload shape. */
  get isWebphoneActiveTab(): boolean {
    return this.isWebphoneOwner;
  }

  /** Marks a session as forwarded so the UI stops offering forward actions. */
  async setForwardFlag(sessionId: string): Promise<boolean> {
    const record = this._sessionRecords.get(sessionId);
    if (!record) {
      return false;
    }
    record.normalized = { ...record.normalized, isForwarded: true };
    this._publishLiveState();
    return true;
  }

  /**
   * Reflects a telephony-driven recording change on the webphone session.
   *
   * `Adapter` records through call control rather than the webphone when a
   * telephony session exists, and drives the session's record status itself so
   * the call-control UI stays in step. The runtime only tracks the status for
   * its own `startRecord`/`stopRecord`, so this setter is app-specific.
   */
  async updateRecordStatus(sessionId: string, status: RecordStatus) {
    const record = this._sessionRecords.get(sessionId);
    if (!record) {
      return;
    }
    record.normalized = { ...record.normalized, recordStatus: status };
    this._publishLiveState();
  }

  /**
   * Park and monitored-extension pickup, in the shapes this app calls them.
   *
   * The ported runtime takes a single params object for each of these, while
   * `ParkView`, `CallHUDView` and `Adapter` all pass positional arguments —
   * and every one of those call sites casts the webphone to `any`, so nothing
   * type-checked the mismatch. A positional call therefore landed a string
   * where the object was expected and the command threw on validation, which
   * is why park-to-location and pickup stopped working. Both shapes are
   * accepted here; the object form is the runtime's and stays available.
   */
  override async park(sessionId: string): Promise<string | undefined> {
    try {
      const parkedNumber = await super.park(sessionId);
      this._notifyParked(parkedNumber);
      return parkedNumber;
    } catch (error) {
      // The previous service swallowed this so the park view falls back to its
      // "no destination" branch rather than rejecting into an onClick handler.
      this.logger.warn('park fail', { error });
      return undefined;
    }
  }

  override async parkToLocation(
    sessionIdOrParams: string | WebphoneParkToLocationParams,
    location?: WebphoneParkLocationTarget,
  ): Promise<string | undefined> {
    const params =
      typeof sessionIdOrParams === 'string'
        ? { sessionId: sessionIdOrParams, location: location! }
        : sessionIdOrParams;
    if (!params.location?.id) {
      return undefined;
    }
    try {
      const parkedNumber = await super.parkToLocation(params);
      this._notifyParked(parkedNumber);
      return parkedNumber;
    } catch (error) {
      this.logger.warn('parkToLocation fail', { error });
      return undefined;
    }
  }

  override async pickParkLocation(
    extensionIdOrParams: string | WebphoneMonitoredPickupParams,
    activeCall?: WebphoneLegacyPickupCall,
    fromNumber?: string,
  ) {
    return super.pickParkLocation(
      toPickupParams(extensionIdOrParams, activeCall, fromNumber),
    );
  }

  override async pickGroupCall(
    extensionIdOrParams: string | WebphoneMonitoredPickupParams,
    activeCall?: WebphoneLegacyPickupCall,
    fromNumber?: string,
    pickPrefix: 'gcp' | 'qpk' = 'gcp',
  ) {
    const params = toPickupParams(extensionIdOrParams, activeCall, fromNumber);
    // The previous service took the invite prefix as an argument; the runtime
    // splits it into two commands. `Adapter` still passes 'qpk' for Department
    // extensions, so that keeps routing to the call-queue pickup.
    return pickPrefix === 'qpk'
      ? super.pickCallQueueCall(params)
      : super.pickGroupCall(params);
  }

  override async pickCallQueueCall(
    extensionIdOrParams: string | WebphoneMonitoredPickupParams,
    activeCall?: WebphoneLegacyPickupCall,
    fromNumber?: string,
  ) {
    return super.pickCallQueueCall(
      toPickupParams(extensionIdOrParams, activeCall, fromNumber),
    );
  }

  /**
   * Tells the user where the call was parked.
   *
   * `CallHUDView.onPark` ignores the return value entirely, so without this
   * toast parking from the HUD gives no feedback at all. `Toast` mutations are
   * `@delegate('server')` over replicated state, so raising it from the
   * SharedWorker still shows it in every tab.
   */
  private _notifyParked(parkedNumber?: string) {
    if (!parkedNumber) {
      return;
    }
    this._toast.success({
      message: t('parked', { parkedNumber }),
      ttl: 0,
    });
  }

  @action
  protected _applyVoicemailDropStatus(callId: string, status: string) {
    const record = this._sessionRecords.get(callId);
    if (!record) return;
    record.normalized = { ...record.normalized, voicemailDropStatus: status };
  }

  /**
   * Fires while a call plays a pre-recorded voicemail.
   *
   * `Adapter` relays this to the host page, and it runs in a tab, so the event
   * has to be broadcast rather than emitted only on the authoritative port.
   */
  onCallVoicemailDropped(handler: (...args: unknown[]) => void) {
    this._eventEmitter.on('callVoicemailDropped', handler);
    return () => this._eventEmitter.off('callVoicemailDropped', handler);
  }

  /** Fires when webphone/media ownership moves between tabs. */
  onActiveWebphoneChanged(handler: (...args: unknown[]) => void) {
    this._eventEmitter.on('activeWebphoneChanged', handler);
    return () => this._eventEmitter.off('activeWebphoneChanged', handler);
  }

  /** Emits a voicemail drop on this port. Public only so `fork()` can reach it. */
  async emitVoicemailDroppedOnPort(session: WebphoneNormalizedSession | null) {
    this._eventEmitter.emit(
      'callVoicemailDropped',
      session,
      this.activeSession,
    );
  }

  /** Emits an owner change on this port. Public only so `fork()` can reach it. */
  async emitActiveWebphoneChangedOnPort(payload: {
    activeId: string | null;
    currentActive: boolean;
  }) {
    this._eventEmitter.emit('activeWebphoneChanged', payload);
  }

  /** Publishes drop progress from the media-owner tab back into shared state. */
  @delegate('server')
  async setVoicemailDropStatus(callId: string, status: string) {
    this._applyVoicemailDropStatus(callId, status);
    this._publishLiveState();
    const session = this._sessionRecords.get(callId)?.normalized ?? null;
    await runOnAllPorts(
      this._portManager,
      this as Webphone,
      'emitVoicemailDroppedOnPort',
      [session],
    );
  }

  /**
   * Plays a pre-recorded greeting into the call.
   *
   * The pipeline is WebRTC and AudioContext work, so it runs on whichever tab
   * owns the call media rather than in the SharedWorker. Only the status writes
   * come back to shared state.
   */
  async dropVoicemailMessage(
    sessionId: string,
    messageId: string,
  ): Promise<boolean> {
    const record = this._sessionRecords.get(sessionId);
    if (!record || record.finalized) {
      return false;
    }
    if (record.normalized.voicemailDropStatus || record.normalized.isOnHold) {
      return false;
    }
    try {
      // `@delegateRole` discards the owner's return value in this next-core
      // build, so the boolean has to come back through `invokeRoleForValue`.
      // Calling the decorated method directly would always yield `undefined`,
      // and the view would report a failure for a drop that actually ran.
      const result = await invokeRoleForValue<boolean>(
        this,
        '_dropVoicemailOnMediaOwner',
        [sessionId, messageId],
        webphoneMediaOwnerRole.role,
      );
      return result;
    } catch (error) {
      // A RoleUnavailableError here means no tab holds webphone.mediaOwner.
      this.logger.error('dropVoicemailMessage fail', error);
      return false;
    }
  }

  /**
   * Server endpoint for every allow-listed command.
   *
   * Invokes the runtime's own implementation directly so the prototype override
   * installed below cannot recurse.
   */
  @delegate('server')
  async _executeRuntimeCommand(property: string, args: unknown[]) {
    const implementation = COMMAND_IMPLEMENTATIONS.get(property);
    if (!implementation) {
      throw new Error(`Webphone command '${property}' is not supported.`);
    }
    return implementation.apply(this, args);
  }

  /** Applies interaction ownership, strips callbacks, then delegates. */
  protected async _runCommand(property: string, args: unknown[]) {
    if (MEDIA_STARTING_COMMANDS.has(property)) {
      try {
        await this._clientInteraction?.ensureCurrentClient();
      } catch (error) {
        this.logger.warn('current client interaction claim failed', { error });
      }
    }

    const errorHandlerIndex = ERROR_HANDLER_INDEXES[property];
    const candidate =
      errorHandlerIndex === undefined ? undefined : args[errorHandlerIndex];
    const errorHandler =
      typeof candidate === 'function'
        ? (candidate as (error: unknown) => void | Promise<void>)
        : undefined;
    const transportArgs = errorHandler
      ? args.slice(0, errorHandlerIndex)
      : args;

    try {
      return await this._executeRuntimeCommand(property, transportArgs);
    } catch (error) {
      this.logger.warn('Webphone command failed', { command: property, error });
      if (!errorHandler) throw error;
      await errorHandler(error);
      return undefined;
    }
  }

  @delegateRole(webphoneMediaOwnerRole)
  protected async _dropVoicemailOnMediaOwner(
    callId: string,
    messageId: string,
  ): Promise<boolean> {
    const mediaSession = this._webphoneMedia.getLocalSessionByCallId(callId);
    if (!mediaSession?.rtcPeerConnection || !this._voicemailDrop) {
      return false;
    }
    const { audioBuffer, audioContext } =
      await this._voicemailDrop.prepareVoicemailDrop(mediaSession, messageId);
    // Silence the live audio before the greeting replaces the outbound track.
    await mediaSession.stopSessionAudio();
    await this.setVoicemailDropStatus(
      callId,
      voicemailDropStatus.waitingForGreetingEnd,
    );
    void this._voicemailDrop.dropVoicemailMessage({
      webphoneSession: mediaSession,
      audioBuffer,
      audioContext,
      endCall: () => this.hangup(callId),
      updateStatus: (status: string) => {
        void this.setVoicemailDropStatus(callId, status);
      },
    });
    return true;
  }
}

/**
 * Real implementations, captured before the overrides replace them.
 *
 * Keyed by name so `_executeRuntimeCommand` can reach the runtime's own method
 * without going back through the override.
 */
const COMMAND_IMPLEMENTATIONS = new Map<
  string,
  (...args: unknown[]) => unknown
>();

for (const property of COMMAND_METHODS) {
  const prototype = Webphone.prototype as unknown as Record<string, unknown>;
  const implementation = prototype[property];
  if (typeof implementation !== 'function') continue;
  COMMAND_IMPLEMENTATIONS.set(
    property,
    implementation as (...args: unknown[]) => unknown,
  );
  prototype[property] = function routedCommand(
    this: Webphone,
    ...args: unknown[]
  ) {
    return (
      this as unknown as {
        _runCommand: (name: string, args: unknown[]) => Promise<unknown>;
      }
    )._runCommand(property, args);
  };
}
