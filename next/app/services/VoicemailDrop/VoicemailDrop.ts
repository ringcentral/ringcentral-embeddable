import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import voicemailGreetingEndDetectorWorklet from './voicemail-greeting-end-detector.worklet.js';

import type { WebphoneSession } from '../WebphoneV2/Webphone.interface';
import { voicemailDropStatus } from '../WebphoneV2/voicemailDropStatus';
import type { VoicemailMessage } from './VoicemailDrop.interface';


function isValidAudioUri(uri?: string) {
  if (!uri) {
    return false;
  }
  if (uri.startsWith('data:audio/mpeg;') || uri.startsWith('data:audio/wav;')) {
    return true;
  }
  if (uri.includes('javascript')) {
    return false;
  }
  return uri.startsWith('http://') || uri.startsWith('https://');
}

@injectable({
  name: 'VoicemailDrop',
})
export class VoicemailDrop extends RcModule {
  protected _audioContext?: AudioContext;
  protected _externalVoicemailFetcher:
    | (() => Promise<VoicemailMessage[]>)
    | null = null;

  constructor(
    protected _storage: StoragePlugin,
    protected _appFeatures: AppFeatures,
    protected _toast: Toast,
  ) {
    super();
    this._storage.enable(this);
  }

  @storage
  @state
  noBeepSilenceDuration = 4;

  @storage
  @state
  voicemailMessages: VoicemailMessage[] = [];

  @state
  externalVoicemailDropFiles: VoicemailMessage[] = [];

  @computed((that: VoicemailDrop) => [
    that.voicemailMessages,
    that.externalVoicemailDropFiles,
  ])
  get allMessages() {
    return [...this.voicemailMessages, ...this.externalVoicemailDropFiles];
  }

  get hasVoicemailDropPermission() {
    return Boolean(
      (this._appFeatures.config as Record<string, boolean>).VoicemailDrop,
    );
  }

  setExternalVoicemailFetcher(fetcher: () => Promise<VoicemailMessage[]>) {
    this._externalVoicemailFetcher = fetcher;
  }

  @action
  setNoBeepSilenceDuration(duration: number) {
    this.noBeepSilenceDuration = duration;
  }

  @action
  addVoicemailMessage(voicemailMessage: VoicemailMessage) {
    const id = voicemailMessage.id || `${Date.now()}`;
    const existingRecord = this.voicemailMessages.find(
      (message) => message.id === id,
    );
    if (existingRecord) {
      if (voicemailMessage.file && existingRecord.file !== voicemailMessage.file) {
        existingRecord.file = voicemailMessage.file;
      }
      if (
        voicemailMessage.fileName &&
        existingRecord.fileName !== voicemailMessage.fileName
      ) {
        existingRecord.fileName = voicemailMessage.fileName;
      }
      existingRecord.label = voicemailMessage.label;
      return;
    }
    this.voicemailMessages = [
      ...this.voicemailMessages,
      {
        id,
        label: voicemailMessage.label,
        file: voicemailMessage.file,
        fileName: voicemailMessage.fileName,
      },
    ];
  }

  @action
  deleteVoicemailMessage(voicemailMessage: VoicemailMessage) {
    this.voicemailMessages = this.voicemailMessages.filter(
      (message) => message.id !== voicemailMessage.id,
    );
  }

  @action
  setExternalVoicemailDropFiles(voicemailMessages: VoicemailMessage[]) {
    this.externalVoicemailDropFiles = voicemailMessages;
  }

  async fetchExternalVoicemailDropFiles() {
    if (typeof this._externalVoicemailFetcher !== 'function') {
      return;
    }
    const externalMessages = await this._externalVoicemailFetcher();
    this.setExternalVoicemailDropFiles(
      externalMessages.filter(
        (voicemailMessage) =>
          isValidAudioUri(voicemailMessage.uri) &&
          Boolean(voicemailMessage.label),
      ),
    );
  }

  async initAudioContext() {
    if (!globalThis.window) {
      throw new Error('AudioContext is not available');
    }
    let newAudioContext = false;
    if (!this._audioContext) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this._audioContext = new AudioContextClass();
      newAudioContext = true;
    }
    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume();
    }
    if (newAudioContext) {
      await this._audioContext.audioWorklet.addModule(
        voicemailGreetingEndDetectorWorklet,
      );
    }
    return this._audioContext;
  }

  async prepareVoicemailDrop(
    webphoneSession: WebphoneSession,
    messageId: string,
  ) {
    let message = this.allMessages.find((item) => item.id === messageId);
    if (
      !message &&
      this._externalVoicemailFetcher &&
      this.externalVoicemailDropFiles.length === 0
    ) {
      await this.fetchExternalVoicemailDropFiles();
      message = this.allMessages.find((item) => item.id === messageId);
    }
    if (!message) {
      throw new Error('Pre-recorded message not found');
    }
    const peerConnection = webphoneSession.rtcPeerConnection;
    const receiver = peerConnection
      .getReceivers()
      .find((receiverItem: RTCRtpReceiver) => receiverItem.track?.kind === 'audio');
    if (!receiver) {
      throw new Error('Receiver not found for the call session');
    }
    const sender = peerConnection
      .getSenders()
      .find((senderItem: RTCRtpSender) => senderItem.track?.kind === 'audio');
    if (!sender) {
      throw new Error('Sender not found for the call session');
    }
    const audioContext = await this.initAudioContext();
    const audioUri = message.file || message.uri;
    let audioData: ArrayBuffer;
    let audioBuffer: AudioBuffer;
    try {
      audioData = await fetch(audioUri as string).then((res) =>
        res.arrayBuffer(),
      );
      audioBuffer = await audioContext.decodeAudioData(audioData);
    } catch {
      throw new Error(
        'Failed to load audio data, please check or re-upload the audio message',
      );
    }
    return {
      audioBuffer,
      audioContext,
    };
  }

  async dropVoicemailMessage({
    webphoneSession,
    audioBuffer,
    audioContext,
    endCall,
    updateStatus,
  }: {
    webphoneSession: WebphoneSession;
    audioBuffer: AudioBuffer;
    audioContext: AudioContext;
    endCall: () => Promise<unknown>;
    updateStatus: (status: string) => void;
  }) {
    const result = await this._waitVoicemailGreetingEnd({
      webphoneSession,
      audioContext,
      endCall,
    });
    if (!result) {
      updateStatus(voicemailDropStatus.greetingDetectionFailed);
      return;
    }
    updateStatus(voicemailDropStatus.sending);
    await this._sendAudioData({
      webphoneSession,
      audioContext,
      audioBuffer,
      endCall,
      updateStatus,
    });
  }

  async _waitVoicemailGreetingEnd({
    webphoneSession,
    audioContext,
    endCall,
  }: {
    webphoneSession: WebphoneSession;
    audioContext: AudioContext;
    endCall: () => Promise<unknown>;
  }) {
    const peerConnection = webphoneSession.rtcPeerConnection;
    const receiver = peerConnection
      .getReceivers()
      .find((receiverItem: RTCRtpReceiver) => receiverItem.track?.kind === 'audio');
    if (!receiver) {
      return false;
    }
    const outputTrack = receiver.track!;
    const mediaStream = new MediaStream([outputTrack]);
    const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
    const processorNode = new AudioWorkletNode(
      audioContext,
      'voicemail-greeting-end-detector',
      {
        processorOptions: {
          noBeepSilenceDuration: this.noBeepSilenceDuration,
        },
      },
    );
    const startAt = Date.now();
    const disconnect = () => {
      processorNode.port.onmessage = null;
      mediaStreamSource.disconnect();
      processorNode.disconnect();
    };
    return new Promise<boolean>((resolve) => {
      const onFailed = async () => {
        disconnect();
        await endCall();
        resolve(false);
      };
      const maxWaitTimer = window.setTimeout(onFailed, 45000);
      processorNode.port.onmessage = (event: MessageEvent) => {
        if (event.data === 'greeting-ended') {
          clearTimeout(maxWaitTimer);
          disconnect();
          console.log('Voicemail greeting ended', Date.now() - startAt);
          resolve(true);
        }
      };
      webphoneSession.once('disposed', () => {
        clearTimeout(maxWaitTimer);
        disconnect();
        resolve(false);
      });
      mediaStreamSource.connect(processorNode);
      processorNode.connect(audioContext.destination);
    });
  }

  async _sendAudioData({
    webphoneSession,
    audioContext,
    audioBuffer,
    endCall,
    updateStatus,
  }: {
    webphoneSession: WebphoneSession;
    audioContext: AudioContext;
    audioBuffer: AudioBuffer;
    endCall: () => Promise<unknown>;
    updateStatus: (status: string) => void;
  }) {
    const peerConnection = webphoneSession.rtcPeerConnection;
    const sender = peerConnection
      .getSenders()
      .find((senderItem: RTCRtpSender) => senderItem.track?.kind === 'audio');
    if (!sender) {
      updateStatus(voicemailDropStatus.failed);
      return;
    }
    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(destination);
    const [audioTrack] = destination.stream.getAudioTracks();
    const originalTrack = sender.track;
    if (!audioTrack || !originalTrack) {
      updateStatus(voicemailDropStatus.failed);
      return;
    }
    await sender.replaceTrack(audioTrack);
    await audioContext.resume();
    source.start();

    const cleanup = async (status: string) => {
      source.onended = null;
      webphoneSession.off('disposed', onDisposed);
      audioTrack.stop();
      try {
        await sender.replaceTrack(originalTrack);
      } catch (error) {
        console.error(error);
      }
      updateStatus(status);
    };

    const onDisposed = () => {
      void cleanup(voicemailDropStatus.terminated);
    };

    webphoneSession.once('disposed', onDisposed);
    source.onended = async () => {
      await cleanup(voicemailDropStatus.finished);
      await endCall();
    };
  }
}
