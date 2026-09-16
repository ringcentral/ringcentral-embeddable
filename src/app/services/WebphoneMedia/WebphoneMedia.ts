import { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';
import {
  setSinkIdSafely,
  type SinkIdMediaElement,
} from '@ringcentral-integration/micro-phone/src/app/services/Webphone/setSinkId';
import {
  action,
  delegateRole,
  injectable,
  optional,
  PortManager,
  RcModule,
  RoleFencedError,
  RoleReleaseRejectedError,
  RoleUnavailableError,
  state,
  systemRoles,
  watch,
} from '@ringcentral-integration/next-core';
import type { RoleId, RoleState } from '@ringcentral-integration/next-core';
import {
  filter,
  firstValueFrom,
  Observable,
  of,
  Subject,
  Subscription,
  timeout,
} from 'rxjs';

import {
  claimRoleCompat,
  invokeRoleForValue,
  isLocalRoleOwner,
  registerRoleOnce,
  RoleStateMirror,
  unavailableRoleState,
} from '../../../lib/roleCompat';
import { lastInteractedClientRole } from '../ClientInteraction';
import { NoiseReduction } from '../NoiseReduction';
import { getInputDeviceOptions } from '../WebphoneV2/audioInput';

export const webphoneMediaOwnerRole = {
  role: 'webphone.mediaOwner',
  allowMultiple: false,
  autoElect: false,
} as const;

type MediaDirection = 'inbound' | 'outbound';

export interface WebphoneMediaContext {
  readonly callId: string;
  readonly direction: MediaDirection;
  readonly stunServers: readonly string[];
}

export interface WebphoneWebRtcSession {
  createOffer(options?: { iceRestart?: boolean }): Promise<string>;
  createAnswer(offer: string): Promise<string>;
  applyAnswer(answer: string): Promise<void>;
  changeInputDevice(deviceId: string): Promise<void>;
  changeOutputDevice(deviceId: string): Promise<void>;
  setMuted(muted: boolean): void;
  sendDtmf(tones: string, duration?: number, interToneGap?: number): void;
  dispose(): void;
}

export type WebphoneWebRtcSessionFactory = (
  context: WebphoneMediaContext,
) => WebphoneWebRtcSession;

/**
 * The slice of noise reduction that a media session actually uses.
 *
 * `micro-phone`'s `NoiseReductionLike` is not reusable here: it declares
 * `denoiser(): Promise<void>` and `setEnabled(): void`, while this repo's
 * `NoiseReduction` returns the mutated stream and an async `setEnabled`.
 * `WebphoneMedia` itself injects the concrete class, because this DI resolves
 * the token from the constructor parameter's type.
 */
export interface WebphoneNoiseReductionLike {
  readonly enabled: boolean;
  denoiser(sessionId: string, stream: MediaStream): Promise<MediaStream | void>;
  reset(sessionId: string): void | Promise<void>;
}

interface MediaProviderContext extends WebphoneMediaContext {
  readonly providerId: string;
  ownerRevision: number;
}

type MediaProviderRecord = {
  readonly callId: string;
  ownerRevision: number;
  muted: boolean;
};

export interface WebphoneMediaOwnerLoss {
  readonly ownerRevision: number;
  readonly callIds: readonly string[];
}

type ManagedAudioElement = SinkIdMediaElement & {
  autoplay?: boolean;
  playsInline?: boolean;
  srcObject?: MediaStream | null;
  pause?: () => void;
  load?: () => void;
};

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const MEDIA_OWNER_SESSION_TIMEOUT = 60_000;
const ROLE_ELECTION_GRACE_TIMEOUT = 1_000;
const ICE_GATHERING_TIMEOUT_MS = 500;

/** `ownerRevision` for a provider that has not been bound to an owner yet. */
const UNBOUND_OWNER_REVISION = -1;

const stopStream = (stream?: MediaStream) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const getAudioTrack = (stream: MediaStream) => {
  const track = stream.getAudioTracks()[0];
  if (!track) throw new Error('Microphone stream has no audio track');
  return track;
};

const getErrorLogContext = (error: unknown) => ({
  errorName: error instanceof Error ? error.name : typeof error,
});

export const createIceServers = (stunServers: readonly string[]) =>
  stunServers.map((url) => ({ urls: `stun:${url}` }));

/**
 * Owns the WebRTC peer connection, microphone and `<audio>` element for one
 * call, inside a browser tab.
 *
 * With webphone 2.5's `webRtcSessionFactory`, the SDK no longer creates any of
 * these; it only asks for SDP and issues device/mute/DTMF commands. That is what
 * lets the `WebPhone` instance itself live in the SharedWorker.
 */
export class BrowserWebRtcSession implements WebphoneWebRtcSession {
  private _peerConnection?: RTCPeerConnection;

  private _localStream?: MediaStream;

  private _inputTrack?: MediaStreamTrack;

  private _audio?: ManagedAudioElement;

  private _muted = false;

  private _volume: number;

  private _disposed = false;

  private _disposeHandlers = new Set<() => void>();

  constructor(
    private readonly _context: WebphoneMediaContext,
    private readonly _audioSettings?: AudioSettings,
    private readonly _noiseReduction?: WebphoneNoiseReductionLike,
    private readonly _onDispose?: () => void,
  ) {
    this._volume = _audioSettings?.callVolume ?? 0.5;
  }

  get callId() {
    return this._context.callId;
  }

  get disposed() {
    return this._disposed;
  }

  /**
   * The live peer connection, for features that need direct track access
   * (voicemail drop swaps the outbound track).
   */
  get rtcPeerConnection() {
    return this._peerConnection;
  }

  /** Audio sender/receiver accessors used by voicemail drop. */
  get audioSender() {
    return this._peerConnection
      ?.getSenders()
      .find((sender) => sender.track?.kind === 'audio');
  }

  get remoteAudioTrack() {
    return this._peerConnection
      ?.getReceivers()
      .find((receiver) => receiver.track?.kind === 'audio')?.track;
  }

  /** Mirrors the SDK session's `disposed` event for per-call cleanup. */
  once(event: 'disposed', handler: () => void) {
    if (event !== 'disposed') return;
    if (this._disposed) {
      handler();
      return;
    }
    this._disposeHandlers.add(handler);
  }

  off(event: 'disposed', handler: () => void) {
    if (event !== 'disposed') return;
    this._disposeHandlers.delete(handler);
  }

  /**
   * Silences both directions without tearing the peer connection down.
   *
   * The outbound track is **disabled, not stopped**. Voicemail drop waits for
   * the callee's greeting to finish — several seconds — before swapping in the
   * recorded audio, and a stopped track leaves the sender with an `ended`
   * source for that whole time. The encoder then has to spin back up on
   * `replaceTrack`, and the opening of the message is lost. A disabled track
   * still sends silence, so the callee hears nothing while the sender stays
   * warm and the swap is seamless — the same reason `changeInputDevice` hot
   * swaps rather than stopping first.
   */
  async stopSessionAudio() {
    await this._noiseReduction?.reset(this._context.callId);
    const peerConnection = this._peerConnection;
    if (!peerConnection) return;
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) sender.track.enabled = false;
    });
    const outputTrack = this.remoteAudioTrack;
    const audio = this._audio;
    if (!audio?.srcObject || !outputTrack) return;
    const outputStream = audio.srcObject as MediaStream;
    if (outputStream.getTracks().some((track) => track.id === outputTrack.id)) {
      audio.srcObject = null;
    }
  }

  /**
   * Re-enables the outbound track after {@link stopSessionAudio}.
   *
   * Honours the session's own mute state, so restoring audio after a voicemail
   * drop cannot silently unmute a call the user had muted.
   */
  restoreSessionAudio() {
    this._peerConnection?.getSenders().forEach((sender) => {
      if (sender.track) sender.track.enabled = !this._muted;
    });
  }

  setVolume(volume: number) {
    this._volume = volume;
    if (this._audio) this._audio.volume = volume;
  }

  async createOffer(options?: { iceRestart?: boolean }) {
    const peerConnection = await this._ensureReady();
    const description = await peerConnection.createOffer(options);
    await peerConnection.setLocalDescription(description);
    await this._waitForIceGatheringComplete(peerConnection);
    return this._getLocalSdp();
  }

  async createAnswer(offer: string) {
    const peerConnection = await this._ensurePeerConnection();
    await peerConnection.setRemoteDescription({ type: 'offer', sdp: offer });
    await this._ensureLocalStream(peerConnection);
    const description = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(description);
    await this._waitForIceGatheringComplete(peerConnection);
    return this._getLocalSdp();
  }

  async applyAnswer(answer: string) {
    const peerConnection = await this._ensurePeerConnection();
    await peerConnection.setRemoteDescription({ type: 'answer', sdp: answer });
  }

  async changeInputDevice(deviceId: string) {
    const peerConnection = await this._ensureReady();
    const nextStream = await this._getInputStream(deviceId);
    const rawTrack = getAudioTrack(nextStream);
    rawTrack.enabled = !this._muted;
    const sender = peerConnection
      .getSenders()
      .find((candidate) => candidate.track?.kind === 'audio');

    if (!sender) {
      await this._applyNoiseReduction(nextStream);
      const processedTrack = getAudioTrack(nextStream);
      processedTrack.enabled = !this._muted;
      peerConnection.addTrack(processedTrack, nextStream);
      this._inputTrack = processedTrack;
      this._replaceLocalStream(nextStream);
      return;
    }

    try {
      await sender.replaceTrack(rawTrack);
    } catch (error) {
      stopStream(nextStream);
      throw error;
    }

    const previousStream = this._localStream;
    this._localStream = nextStream;
    this._inputTrack = rawTrack;
    stopStream(previousStream);

    // Raw audio is used during the swap so the call never goes silent; the
    // denoiser is re-attached immediately afterwards.
    await this._applyNoiseReduction(nextStream);
    const processedTrack = getAudioTrack(nextStream);
    processedTrack.enabled = !this._muted;
    if (processedTrack !== rawTrack) {
      try {
        await sender.replaceTrack(processedTrack);
        this._inputTrack = processedTrack;
      } catch {
        // Keep the raw replacement live when optional processing cannot attach.
      }
    }
  }

  async changeOutputDevice(deviceId: string) {
    if (!this._audio) return;
    setSinkIdSafely(this._audio, deviceId);
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    if (this._inputTrack) this._inputTrack.enabled = !muted;
    this._localStream?.getAudioTracks().forEach((track) => {
      if (track !== this._inputTrack) track.enabled = !muted;
    });
  }

  sendDtmf(tones: string, duration?: number, interToneGap?: number) {
    this._peerConnection
      ?.getSenders()
      .find((sender) => sender.dtmf)
      ?.dtmf?.insertDTMF(tones, duration, interToneGap);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    void this._noiseReduction?.reset(this._context.callId);
    const inputTrack = this._inputTrack;
    stopStream(this._localStream);
    if (inputTrack && !this._localStream?.getTracks().includes(inputTrack)) {
      inputTrack.stop();
    }
    this._localStream = undefined;
    this._inputTrack = undefined;
    this._peerConnection?.close();
    this._peerConnection = undefined;
    if (this._audio) {
      this._audio.pause?.();
      this._audio.srcObject = null;
      this._audio.load?.();
      this._audio = undefined;
    }
    const handlers = [...this._disposeHandlers];
    this._disposeHandlers.clear();
    handlers.forEach((handler) => {
      try {
        handler();
      } catch {
        // A listener must not block teardown of the rest of the session.
      }
    });
    this._onDispose?.();
  }

  private async _ensureReady() {
    const peerConnection = await this._ensurePeerConnection();
    await this._ensureLocalStream(peerConnection);
    return peerConnection;
  }

  private async _ensurePeerConnection() {
    if (this._disposed) throw new Error('WebRTC session is disposed');
    if (this._peerConnection) return this._peerConnection;
    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('WebRTC is unavailable in this runtime');
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: createIceServers(this._context.stunServers),
    });
    peerConnection.ontrack = ({ streams, track }) => {
      const stream = streams[0];
      if (!stream) return;
      this._ensureAudioElement().srcObject = stream;
      track.onended = () => undefined;
    };
    this._peerConnection = peerConnection;
    return peerConnection;
  }

  private async _ensureLocalStream(peerConnection: RTCPeerConnection) {
    if (this._localStream) return;
    const stream = await this._getInputStream();
    await this._applyNoiseReduction(stream);
    const track = getAudioTrack(stream);
    track.enabled = !this._muted;
    peerConnection.addTrack(track, stream);
    this._localStream = stream;
    this._inputTrack = track;
  }

  private async _getInputStream(deviceId?: string) {
    if (!globalThis.navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Microphone capture is unavailable in this runtime');
    }

    const configuredConstraints = deviceId
      ? { deviceId: { exact: deviceId } }
      : this._audioSettings &&
        (await getInputDeviceOptions(this._audioSettings));
    const audio = configuredConstraints || true;
    try {
      return await navigator.mediaDevices.getUserMedia({ audio, video: false });
    } catch (error) {
      if (!deviceId && audio === true) throw error;
      return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    }
  }

  private _ensureAudioElement() {
    if (this._audio) return this._audio;
    // Detached on purpose: each call needs its own element, and an autoplay
    // element does not need to be in the document to play.
    const audio = new Audio() as ManagedAudioElement;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.volume = this._volume;
    this._audio = audio;
    const outputDeviceId = this._audioSettings?.outputDeviceId;
    if (outputDeviceId) setSinkIdSafely(audio, outputDeviceId);
    return audio;
  }

  private _getLocalSdp() {
    const sdp = this._peerConnection?.localDescription?.sdp;
    if (!sdp) throw new Error('WebRTC did not produce a local SDP');
    return sdp;
  }

  private async _waitForIceGatheringComplete(
    peerConnection: RTCPeerConnection,
  ) {
    if (peerConnection.iceGatheringState === 'complete') return;
    // ICE is gathered fully before the SDP crosses the port; there is no
    // trickle-ICE channel back to the SharedWorker.
    await new Promise<void>((resolve) => {
      const onIceCandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate === null) done();
      };
      function done() {
        clearTimeout(gatheringTimeout);
        peerConnection.removeEventListener('icecandidate', onIceCandidate);
        resolve();
      }
      const gatheringTimeout = setTimeout(done, ICE_GATHERING_TIMEOUT_MS);
      peerConnection.addEventListener('icecandidate', onIceCandidate);
    });
  }

  private _replaceLocalStream(stream: MediaStream) {
    const previousStream = this._localStream;
    this._localStream = stream;
    stopStream(previousStream);
  }

  private async _applyNoiseReduction(stream: MediaStream) {
    if (!this._noiseReduction?.enabled) return;
    try {
      await this._noiseReduction.denoiser(this._context.callId, stream);
    } catch {
      // Noise reduction is optional. Keep the raw microphone stream live.
    }
  }
}

/**
 * Bridges WebRTC media between the SharedWorker-hosted `WebPhone` and the one
 * browser tab that owns the `webphone.mediaOwner` role.
 *
 * In the worker (`shared && isServer`) `createWebRtcSession` hands the SDK a
 * proxy whose methods are role-delegated to the owning tab; SDP strings, device
 * ids and DTMF digits are all that cross the port. In standalone or shared-tab
 * server mode the real `BrowserWebRtcSession` is created locally instead.
 */
@injectable({
  name: 'WebphoneMedia',
})
export class WebphoneMedia extends RcModule {
  private _roleSubscription?: Subscription;

  private _roleState?: RoleState;

  private _roleMirrors = new Map<RoleId, RoleStateMirror>();

  private _ownerRevision = 0;

  /** Set when this port's own claim succeeded; see `isLocalMediaOwner`. */
  private _claimedLocally = false;

  private _isResetting = false;

  private _mediaOwnerSessionTimeout?: ReturnType<typeof setTimeout>;

  private _sessions = new Map<string, BrowserWebRtcSession>();

  private _providerContexts = new Map<string, MediaProviderContext>();

  private _ownerLossSubject = new Subject<WebphoneMediaOwnerLoss>();

  /** Emits server-side call providers whose browser media owner disappeared. */
  readonly ownerLoss$: Observable<WebphoneMediaOwnerLoss> =
    this._ownerLossSubject.asObservable();

  @state
  private _providerRecords: Record<string, MediaProviderRecord> = {};

  constructor(
    protected _portManager: PortManager,
    protected _audioSettings: AudioSettings,
    @optional()
    protected _noiseReduction?: NoiseReduction,
  ) {
    super();
    // Noise reduction lazily loads the Krisp SDK and can stay unready for a
    // while; media must not wait on it. Mirrors Webphone's handling.
    if (_noiseReduction) {
      this._ignoreModuleReadiness(_noiseReduction);
    }
    watch(
      this,
      () => this._providerRecords,
      (records) => {
        this._reconcileProviderSessions(records);
      },
    );
    watch(
      this,
      () => this._audioSettings.outputDeviceId,
      (deviceId) => {
        if (deviceId) {
          void this._updateOutputDevice(deviceId).catch((error) => {
            this.logger.warn('Webphone media output update failed', {
              ...getErrorLogContext(error),
            });
          });
        }
      },
    );
    watch(
      this,
      () => this._audioSettings.callVolume,
      (volume) => {
        if (volume !== undefined) this._updateVolume(volume);
      },
    );
  }

  override async onInit() {
    if (!this._portManager.shared) {
      this.logger.debug('Webphone media running in standalone mode');
      return;
    }
    this._roleSubscription = this._portManager
      .getRoleStateStreams(webphoneMediaOwnerRole.role)
      .roleState$.subscribe((state) => this._handleRoleState(state));
    // Registration is opportunistic and must not gate module init: on a client
    // it is an RPC to the server, so awaiting it here would make this module's
    // readiness depend on server availability. `claimRoleCompat` registers on
    // demand anyway, before the role is first actually needed.
    void this._ensureRoleRegistered().catch(() => undefined);
  }

  override async onReset() {
    this.logger.info('Webphone media reset');
    this._roleSubscription?.unsubscribe();
    this._roleSubscription = undefined;
    this._roleMirrors.forEach((mirror) => mirror.dispose());
    this._roleMirrors.clear();
    this._clearMediaOwnerSessionTimeout();
    this._claimedLocally = false;
    this._isResetting = true;
    this._disposeSessions();
    this._providerContexts.clear();
    this._isResetting = false;
    if (this._usesDelegatedMedia) this._clearProviderRecords();
    if (
      this._portManager.shared &&
      !this._portManager.isServer &&
      isLocalRoleOwner(this._portManager, this._roleState)
    ) {
      await this._portManager
        .releaseRole(webphoneMediaOwnerRole.role)
        .catch(() => undefined);
    }
  }

  get factory(): WebphoneWebRtcSessionFactory {
    return (context) => this.createWebRtcSession(context);
  }

  /**
   * Client id of the port that currently owns WebRTC media, if any.
   *
   * Resolvable from the server as well as from a client, so the worker can
   * route work (notes widget, ringtone reporting) at the owning tab.
   */
  get mediaOwnerClientId(): string | undefined {
    const state = this._roleState;
    return state?.phase === 'owned' ? state.owners[0]?.clientId : undefined;
  }

  /**
   * Whether this port currently owns WebRTC media.
   *
   * The mirrored role state is authoritative once it arrives, but a port that
   * has just claimed the role can read it before the snapshot replicates — the
   * owning tab then reports `false` while genuinely holding the media. The
   * locally recorded claim covers that window and is cleared as soon as role
   * state names a different owner, so the two cannot disagree for long.
   */
  get isLocalMediaOwner() {
    if (!this._portManager.shared) return true;
    if (isLocalRoleOwner(this._portManager, this._roleState)) return true;
    return this._claimedLocally;
  }

  /** Whether another connected browser can take over WebRTC media. */
  get hasOtherConnectedClients() {
    if (!this._portManager.shared) return false;
    const state = this._roleStateOf(systemRoles.connectedClients.role);
    if (state.phase !== 'owned') return false;
    if (this._portManager.isServer) return state.owners.length > 0;
    const clientId = this._portManager.clientId;
    return (
      !!clientId && state.owners.some((owner) => owner.clientId !== clientId)
    );
  }

  /** Whether the SDK's media is delegated to another port. */
  private get _usesDelegatedMedia() {
    return this._portManager.shared && this._portManager.isServer;
  }

  /**
   * Latest state for a role, mirrored on demand.
   *
   * Stands in for `PortManager.getRoleState`, which this `next-core` build does
   * not provide.
   */
  private _roleStateOf(role: RoleId): RoleState {
    let mirror = this._roleMirrors.get(role);
    if (!mirror) {
      mirror = new RoleStateMirror(this._portManager, role);
      this._roleMirrors.set(role, mirror);
    }
    return mirror.state ?? unavailableRoleState(role);
  }

  private _handleRoleState(state: RoleState) {
    const previousState = this._roleState;
    const wasLocalOwner = previousState
      ? isLocalRoleOwner(this._portManager, previousState)
      : false;
    const isOwner = isLocalRoleOwner(this._portManager, state);
    const providerCallIds = [
      ...new Set(
        Object.values(this._providerRecords).map((record) => record.callId),
      ),
    ];
    this.logger.info('Webphone media-owner state changed', {
      from: previousState?.phase ?? 'unknown',
      to: state.phase,
      revision: state.revision,
      ownerCount: state.phase === 'owned' ? state.owners.length : 0,
      localOwner: isOwner,
      providerCount: providerCallIds.length,
    });
    if (wasLocalOwner && !isOwner) this._disposeSessions();
    // Role state is authoritative the moment it names an owner.
    if (state.phase === 'owned' || state.phase === 'unavailable') {
      this._claimedLocally = isOwner;
    }
    this._roleState = state;
    this._ownerRevision = state.revision;
    this._handleOwnerLoss(previousState, state, providerCallIds);
    if (state.phase === 'owned' && isOwner) {
      this._startMediaOwnerSessionTimeout();
    } else {
      this._clearMediaOwnerSessionTimeout();
    }
  }

  private _handleOwnerLoss(
    previousState: RoleState | undefined,
    state: RoleState,
    providerCallIds: string[],
  ) {
    if (
      !this._usesDelegatedMedia ||
      previousState?.phase !== 'owned' ||
      !providerCallIds.length ||
      (state.phase === 'owned' && state.revision === previousState.revision)
    ) {
      return;
    }
    this.logger.warn('Webphone media-owner lost', {
      ownerRevision: previousState.revision,
      nextRevision: state.revision,
      nextPhase: state.phase,
      affectedCallCount: providerCallIds.length,
    });
    this._ownerLossSubject.next({
      ownerRevision: previousState.revision,
      callIds: providerCallIds,
    });
  }

  async ensureMediaOwner() {
    if (!this._portManager.shared) {
      this.logger.debug('media-owner claim skipped in standalone mode');
      return;
    }
    if (!this._portManager.isWorkerMode) {
      // Shared-tab fallback: the "server" is itself a tab, so it can own media.
      this.logger.info(
        'claiming webphone media-owner role on shared tab server',
      );
      await this._claimMediaOwnerOnServer();
      return;
    }
    if (this._roleState?.phase === 'owned') {
      this.logger.debug('media-owner already owned', {
        owners: this._roleState.owners,
        revision: this._roleState.revision,
      });
      return;
    }
    if (!this._portManager.isServer) {
      this.logger.info('claiming webphone media-owner role', {
        clientId: this._portManager.clientId,
      });
      await this._claimMediaOwner();
      return;
    }

    try {
      this.logger.info(
        'claiming webphone media-owner role for lastInteractedClient',
      );
      await this._claimMediaOwnerAfterElection(
        lastInteractedClientRole.role,
        () => this._claimMediaOwnerOnInteractedClient(),
      );
      this.logger.info('webphone media-owner assigned to lastInteractedClient');
    } catch (error) {
      this.logger.warn(
        'lastInteractedClient media-owner claim failed; falling back to electedClient',
        getErrorLogContext(error),
      );
      try {
        await this._claimMediaOwnerAfterElection(
          systemRoles.electedClient.role,
          () => this._claimMediaOwnerOnElectedClient(),
        );
        this.logger.info('webphone media-owner assigned to electedClient');
      } catch (fallbackError) {
        this.logger.error('electedClient media-owner claim failed', {
          ...getErrorLogContext(fallbackError),
        });
        throw fallbackError;
      }
    }
  }

  /**
   * Claims through a role that may still be electing.
   *
   * A `RoleUnavailableError` right after startup usually means an auto-elected
   * role has not settled yet, so the claim is retried once the role transitions.
   */
  private async _claimMediaOwnerAfterElection(
    role: RoleId,
    claim: () => Promise<void>,
  ) {
    const roleTransition$ =
      this._portManager.getRoleStateStreams(role).roleTransition$;
    const initialState = await firstValueFrom(roleTransition$);
    try {
      await claim();
      return;
    } catch (error) {
      if (!(error instanceof RoleUnavailableError)) throw error;
      const currentState = await firstValueFrom(roleTransition$);
      if (
        initialState.phase === 'unavailable' &&
        currentState.phase === 'unavailable' &&
        currentState.revision === initialState.revision
      )
        throw error;
      const settledState = await firstValueFrom(
        roleTransition$.pipe(
          filter(
            (state) =>
              (state.phase === 'owned' || state.phase === 'unavailable') &&
              (state.revision > initialState.revision ||
                state.phase !== initialState.phase),
          ),
          timeout({
            first: ROLE_ELECTION_GRACE_TIMEOUT,
            with: () => of(undefined),
          }),
        ),
      );
      if (settledState?.phase !== 'owned') throw error;
    }
    await claim();
  }

  @delegateRole(lastInteractedClientRole)
  protected async _claimMediaOwnerOnInteractedClient() {
    await this._claimMediaOwner();
  }

  @delegateRole(systemRoles.electedClient)
  protected async _claimMediaOwnerOnElectedClient() {
    await this._claimMediaOwner();
  }

  @delegateRole(systemRoles.server)
  protected async _claimMediaOwnerOnServer() {
    await this._claimMediaOwner();
  }

  private async _claimMediaOwner() {
    const { revision } = await claimRoleCompat(
      this._portManager,
      webphoneMediaOwnerRole,
      this._mediaOwnerLifecycle,
    );
    this._ownerRevision = revision;
    this._claimedLocally = true;
    this.logger.info('Webphone media-owner claim completed', { revision });
  }

  private get _mediaOwnerLifecycle() {
    return {
      onRelease: () => {
        // Refuse to hand the role away while this tab still carries live media.
        if (this._sessions.size) {
          throw new RoleReleaseRejectedError(webphoneMediaOwnerRole.role);
        }
      },
    };
  }

  /**
   * Registers the media-owner role without claiming it, so the coordinator
   * knows the role exists before any call needs an owner.
   */
  private async _ensureRoleRegistered() {
    try {
      await registerRoleOnce(
        this._portManager,
        webphoneMediaOwnerRole,
        this._mediaOwnerLifecycle,
      );
      this.logger.info('webphone media-owner role registered', {
        clientId: this._portManager.clientId,
        isServer: this._portManager.isServer,
      });
    } catch (error) {
      this.logger.error('webphone media-owner role registration failed', {
        clientId: this._portManager.clientId,
        isServer: this._portManager.isServer,
        ...getErrorLogContext(error),
      });
      throw error;
    }
  }

  createWebRtcSession(context: WebphoneMediaContext): WebphoneWebRtcSession {
    if (!this._usesDelegatedMedia) {
      const providerId = createId();
      const session = new BrowserWebRtcSession(
        context,
        this._audioSettings,
        this._noiseReduction,
        () => this._handleLocalSessionDisposed(providerId),
      );
      this._sessions.set(providerId, session);
      this._clearMediaOwnerSessionTimeout();
      return session;
    }

    const providerId = createId();
    // The SDK builds a CallSession at INVITE time, before anyone has claimed
    // media. Binding the owner lazily on first SDP use avoids fencing the very
    // first call against a revision that changes when the claim lands.
    const providerContext = this._createProviderContext(
      providerId,
      context,
      UNBOUND_OWNER_REVISION,
    );
    this._providerContexts.set(providerId, providerContext);
    this._addProviderRecord(providerId, context.callId, UNBOUND_OWNER_REVISION);
    this.logger.debug('Webphone media provider registered', {
      providerCount: this._providerContexts.size,
    });
    return {
      createOffer: async (options) => {
        await this._bindProviderOwner(providerContext);
        return invokeRoleForValue<string>(
          this,
          'createOffer',
          [providerContext, options],
          webphoneMediaOwnerRole.role,
        );
      },
      createAnswer: async (offer) => {
        await this._bindProviderOwner(providerContext);
        return invokeRoleForValue<string>(
          this,
          'createAnswer',
          [providerContext, offer],
          webphoneMediaOwnerRole.role,
        );
      },
      applyAnswer: (answer) => this.applyAnswer(providerContext, answer),
      changeInputDevice: (deviceId) =>
        this.changeInputDevice(providerContext, deviceId),
      changeOutputDevice: (deviceId) =>
        this.changeOutputDevice(providerContext, deviceId),
      setMuted: (muted) => {
        this._setProviderMuted(providerId, muted);
        void this.setMuted(providerContext, muted).catch(() => undefined);
      },
      sendDtmf: (tones, duration, interToneGap) => {
        void this.sendDtmf(
          providerContext,
          tones,
          duration,
          interToneGap,
        ).catch(() => undefined);
      },
      dispose: () => this._disposeProvider(providerId),
    };
  }

  /** Ensures an owner exists and pins this provider to its revision. */
  private async _bindProviderOwner(context: MediaProviderContext) {
    await this.ensureMediaOwner();
    if (context.ownerRevision === this._ownerRevision) return;
    context.ownerRevision = this._ownerRevision;
    this._setProviderOwnerRevision(context.providerId, this._ownerRevision);
  }

  /** Rebinds stable SDK media proxies to the current browser owner. */
  async rebindMediaOwner() {
    if (!this._usesDelegatedMedia) return;
    const providerCount = this._providerContexts.size;
    this.logger.info('Webphone media rebinding providers', { providerCount });
    try {
      await this.ensureMediaOwner();
      const ownerRevision = this._ownerRevision;
      for (const [providerId, context] of this._providerContexts) {
        context.ownerRevision = ownerRevision;
        this._setProviderOwnerRevision(providerId, ownerRevision);
      }
      this.logger.info('Webphone media providers rebound', {
        ownerRevision,
        providerCount,
      });
    } catch (error) {
      this.logger.error('Webphone media provider rebind failed', {
        ...getErrorLogContext(error),
        providerCount,
      });
      throw error;
    }
  }

  @delegateRole(webphoneMediaOwnerRole)
  async createOffer(
    context: MediaProviderContext,
    options?: { iceRestart?: boolean },
  ) {
    return this._getSession(context).createOffer(options);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async createAnswer(context: MediaProviderContext, offer: string) {
    return this._getSession(context).createAnswer(offer);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async applyAnswer(context: MediaProviderContext, answer: string) {
    await this._getSession(context).applyAnswer(answer);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async changeInputDevice(context: MediaProviderContext, deviceId: string) {
    await this._getSession(context).changeInputDevice(deviceId);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async changeOutputDevice(context: MediaProviderContext, deviceId: string) {
    await this._getSession(context).changeOutputDevice(deviceId);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async setVolume(context: MediaProviderContext, volume: number) {
    this._getSession(context).setVolume(volume);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async setMuted(context: MediaProviderContext, muted: boolean) {
    this._getSession(context).setMuted(muted);
  }

  @delegateRole(webphoneMediaOwnerRole)
  async sendDtmf(
    context: MediaProviderContext,
    tones: string,
    duration?: number,
    interToneGap?: number,
  ) {
    this._getSession(context).sendDtmf(tones, duration, interToneGap);
  }

  async disposeByCallId(callId: string) {
    if (this._usesDelegatedMedia) {
      this._removeProviderRecordsByCallId(callId);
      return;
    }
    this._disposeByCallIdLocally(callId);
  }

  private _createProviderContext(
    providerId: string,
    context: WebphoneMediaContext,
    ownerRevision: number,
  ): MediaProviderContext {
    return {
      ...context,
      providerId,
      ownerRevision,
    };
  }

  /**
   * Resolves the local session for a delegated call, refusing stale work.
   *
   * Both checks guard against a media owner that has changed since the SDK
   * captured this provider: the revision must match, and the replicated record
   * must still describe the same call under the same owner.
   */
  private _getSession(context: MediaProviderContext) {
    if (context.ownerRevision !== this._ownerRevision) {
      throw new RoleFencedError(webphoneMediaOwnerRole.role);
    }
    if (this._portManager.shared) {
      const record = this._providerRecords[context.providerId];
      if (
        !record ||
        record.callId !== context.callId ||
        record.ownerRevision !== context.ownerRevision
      ) {
        throw new RoleFencedError(webphoneMediaOwnerRole.role);
      }
    }
    let session = this._sessions.get(context.providerId);
    if (!session) {
      session = new BrowserWebRtcSession(
        context,
        this._audioSettings,
        this._noiseReduction,
      );
      this._sessions.set(context.providerId, session);
      if (this._usesDelegatedMedia) {
        session.setMuted(
          this._providerRecords[context.providerId]?.muted ?? false,
        );
      }
      this._clearMediaOwnerSessionTimeout();
    }
    return session;
  }

  /** The local session for a call, when this port owns its media. */
  getLocalSessionByCallId(callId: string) {
    for (const session of this._sessions.values()) {
      if (session.callId === callId) return session;
    }
    return undefined;
  }

  private async _updateOutputDevice(deviceId: string) {
    if (this._usesDelegatedMedia) {
      await Promise.all(
        [...this._providerContexts.values()].map((context) =>
          this.changeOutputDevice(context, deviceId),
        ),
      );
      return;
    }
    await Promise.all(
      [...this._sessions.values()].map((session) =>
        session.changeOutputDevice(deviceId),
      ),
    );
  }

  private _updateVolume(volume: number) {
    if (this._usesDelegatedMedia) {
      for (const context of this._providerContexts.values()) {
        void this.setVolume(context, volume).catch((error) => {
          this.logger.warn('Webphone media volume update failed', {
            ...getErrorLogContext(error),
          });
        });
      }
      return;
    }
    for (const session of this._sessions.values()) session.setVolume(volume);
  }

  private _releaseMediaOwnerRole() {
    this._claimedLocally = false;
    this._portManager
      .releaseRole(webphoneMediaOwnerRole.role)
      .catch(() => undefined);
  }

  private _startMediaOwnerSessionTimeout() {
    this._clearMediaOwnerSessionTimeout();
    if (this._sessions.size) return;
    this._mediaOwnerSessionTimeout = setTimeout(() => {
      this._mediaOwnerSessionTimeout = undefined;
      if (
        this._sessions.size ||
        !isLocalRoleOwner(this._portManager, this._roleState)
      ) {
        return;
      }
      this._releaseMediaOwnerRole();
    }, MEDIA_OWNER_SESSION_TIMEOUT);
  }

  private _clearMediaOwnerSessionTimeout() {
    if (!this._mediaOwnerSessionTimeout) return;
    clearTimeout(this._mediaOwnerSessionTimeout);
    this._mediaOwnerSessionTimeout = undefined;
  }

  private _handleLocalSessionDisposed(providerId: string) {
    this._sessions.delete(providerId);
    if (
      !this._isResetting &&
      !this._sessions.size &&
      this._portManager.shared &&
      !this._portManager.isServer
    ) {
      this._releaseMediaOwnerRole();
    }
  }

  private _disposeSessions() {
    for (const session of this._sessions.values()) session.dispose();
    this._sessions.clear();
  }

  private _disposeByCallIdLocally(callId: string) {
    for (const [providerId, session] of this._sessions) {
      if (session.callId !== callId) continue;
      session.dispose();
      this._sessions.delete(providerId);
    }
    if (!this._sessions.size) {
      this._releaseMediaOwnerRole();
    }
  }

  private _reconcileProviderSessions(
    records: Record<string, MediaProviderRecord>,
  ) {
    if (!this._portManager.shared || this._usesDelegatedMedia) return;
    let disposed = false;
    for (const [providerId, session] of this._sessions) {
      if (records[providerId]) continue;
      session.dispose();
      this._sessions.delete(providerId);
      disposed = true;
    }
    if (disposed && !this._sessions.size) {
      this._releaseMediaOwnerRole();
    }
  }

  @action
  protected _addProviderRecord(
    providerId: string,
    callId: string,
    ownerRevision: number,
  ) {
    this._providerRecords[providerId] = {
      callId,
      ownerRevision,
      muted: false,
    };
  }

  @action
  protected _removeProviderRecord(providerId: string) {
    delete this._providerRecords[providerId];
    this._providerContexts.delete(providerId);
  }

  private _disposeProvider(providerId: string) {
    this._removeProviderRecord(providerId);
    const session = this._sessions.get(providerId);
    if (!session) return;
    session.dispose();
    this._sessions.delete(providerId);
    this.logger.debug('Webphone media provider disposed', {
      providerCount: this._providerContexts.size,
    });
  }

  @action
  protected _setProviderMuted(providerId: string, muted: boolean) {
    const record = this._providerRecords[providerId];
    if (record) record.muted = muted;
  }

  @action
  protected _setProviderOwnerRevision(
    providerId: string,
    ownerRevision: number,
  ) {
    const record = this._providerRecords[providerId];
    if (record) record.ownerRevision = ownerRevision;
  }

  @action
  protected _removeProviderRecordsByCallId(callId: string) {
    for (const [providerId, record] of Object.entries(this._providerRecords)) {
      if (record.callId === callId) this._removeProviderRecord(providerId);
    }
  }

  @action
  protected _clearProviderRecords() {
    for (const providerId of Object.keys(this._providerRecords)) {
      delete this._providerRecords[providerId];
    }
    this._providerContexts.clear();
  }
}
