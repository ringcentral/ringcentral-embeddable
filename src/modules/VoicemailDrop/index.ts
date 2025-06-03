import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  RcModuleV2,
  state,
  storage,
  computed,
} from '@ringcentral-integration/core';
import voicemailGreetingEndDetectorWorklet from '../../worklets/voicemail-greeting-end-detector.worklet.js'; // DO NOT update for webpack
import voicemailDropStatus from '../WebphoneV2/voicemailDropStatus';

type VoicemailMessage = {
  id: string;
  label: string;
  file?: String; // Date URL
  fileName: string;
  uri?: string;
};

function isValidAudioUri(uri) {
  if (!uri) {
    return false;
  }
  if (
    uri.startsWith('data:audio/mpeg;') ||
    uri.startsWith('data:audio/wav;')
  ) {
    return true;
  }
  // no javascript in uri
  if (uri.includes('javascript')) {
    return false;
  }
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return true;
  }
  return false;
}

@Module({
  name: 'VoicemailDrop',
  deps: [
    'Client',
    'Storage',
    'AppFeatures',
    'Alert',
  ],
})
export class VoicemailDrop extends RcModuleV2 {
  protected _audioContext: AudioContext;
  protected _externalVoicemailFetcher: (() => Promise<VoicemailMessage[]>) | null;

  constructor(deps) {
    super({
      deps,
      storageKey: 'voicemailDrop',
      enableCache: true,
    });
    this._externalVoicemailFetcher = null;
  }

  setExternalVoicemailFetcher(fetcher) {
    this._externalVoicemailFetcher = fetcher;
  }

  @storage
  @state
  voicemailMessages: VoicemailMessage[] = [];

  @action
  addVoicemailMessage(voicemailMessage) {
    const id = voicemailMessage.id || `${Date.now()}`;
    const existingRecord = this.voicemailMessages.find((message) => message.id === id);
    if (existingRecord) {
      if (existingRecord.file !== voicemailMessage.file) {  
        existingRecord.file = voicemailMessage.file;
      }
      if (existingRecord.fileName !== voicemailMessage.fileName) {
        existingRecord.fileName = voicemailMessage.fileName;
      }
      existingRecord.label = voicemailMessage.label;
    } else {
      this.voicemailMessages.push({
        id,
        label: voicemailMessage.label,
        file: voicemailMessage.file,
        fileName: voicemailMessage.fileName,
      });
    }
  }

  @action
  deleteVoicemailMessage(voicemailMessage) {
    this.voicemailMessages = this.voicemailMessages.filter((message) => message.id !== voicemailMessage.id);
  }

  @state
  externalVoicemailDropFiles: VoicemailMessage[] = [];

  @action
  setExternalVoicemailDropFiles(voicemailMessages: VoicemailMessage[]) {
    this.externalVoicemailDropFiles = voicemailMessages;
  }

  @computed((that: VoicemailDrop) => [that.voicemailMessages, that.externalVoicemailDropFiles])
  get allMessages() {
    return [...this.voicemailMessages, ...this.externalVoicemailDropFiles];
  }

  async fetchExternalVoicemailDropFiles() {
    if (typeof this._externalVoicemailFetcher !== 'function') {
      return;
    }
    const externalMessages = await this._externalVoicemailFetcher();
    const validVoicemailMessages = externalMessages.filter((voicemailMessage) => {
      return isValidAudioUri(voicemailMessage.uri) && voicemailMessage.label;
    });
    this.setExternalVoicemailDropFiles(validVoicemailMessages);
  }

  get hasVoicemailDropPermission() {
    return this._deps.appFeatures.hasVoicemailDropPermission;
  }

  async initAudioContext() {
    let newAudioContext = false;
    if (!this._audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this._audioContext = new AudioContext();
      newAudioContext = true;
    }
    if (this._audioContext.state === 'suspended') {
      await this._audioContext.resume();
    }
    if (newAudioContext) {
      await this._audioContext.audioWorklet.addModule(
        voicemailGreetingEndDetectorWorklet
      );
    }
    return this._audioContext;
  }

  async prepareVoicemailDrop(webphoneSession, messageId) {
    let message = this.allMessages.find((m) => m.id === messageId);
    if (!message && this._externalVoicemailFetcher && this.externalVoicemailDropFiles.length === 0) {
      await this.fetchExternalVoicemailDropFiles();
      message = this.allMessages.find((m) => m.id === messageId);
    }
    if (!message) {
      throw new Error('Message not found');
    }
    const peerConnection = webphoneSession.sessionDescriptionHandler.peerConnection;
    const receiver = peerConnection.getReceivers().find((r: any) => r.track.kind === 'audio');
    if (!receiver) {
      throw new Error('Receiver not found for session');
    }
    const sender = peerConnection.getSenders().find((s: any) => s.track.kind === 'audio');
    if (!sender) {
      throw new Error('Sender not found for session');
    }
    const audioContext = await this.initAudioContext();
    const audioUri = message.file || message.uri;
    const audioData = await fetch(audioUri as RequestInfo).then((res) => res.arrayBuffer());
    const audioBuffer = await audioContext.decodeAudioData(audioData);
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
  }) {
    const result = await this._waitVoicemailGreetingEnd({
      webphoneSession,
      audioContext,
      endCall,
    });
    if (!result) {
      console.error('Voicemail greeting ended detection failed');
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
  }) {
    const peerConnection: RTCPeerConnection = webphoneSession.sessionDescriptionHandler.peerConnection;
    const receiver = peerConnection.getReceivers().find((r: any) => r.track.kind === 'audio');
    if (!receiver) {
      console.error('Receiver not found for session:', webphoneSession.id);
      return false;
    }
    const outputTrack = receiver.track;
    const mediaStream = new MediaStream([outputTrack]);
    const mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
    const greetingEndDetector = new AudioWorkletNode(audioContext, 'voicemail-greeting-end-detector');
    mediaStreamSource.connect(greetingEndDetector);
    const gainNode = audioContext.createGain();
    mediaStreamSource.connect(gainNode);
    gainNode.gain.value = 0;
    gainNode.connect(audioContext.destination); // Doesn't work in Chrome to load remote track
    // load remote track
    const audio = new Audio();
    audio.muted = true;
    audio.srcObject = mediaStream;
    audio.play().catch((e) => {
      console.error('Error to load remote audio track:', e);
    });
    return new Promise((resolve) => {
      let detected = false;
      let detectedTimeout = false;
      // if no detect silence in 2 minutes, return false
      let timeout = setTimeout(() => {
        timeout = null;
        if (!detected) {
          detectedTimeout = true;
          console.log('Voicemail greeting ended detection timeout');
          this._deps.alert.warning({
            message: 'dropVoicemailMessageGreetingDetectionTimeout',
          });
          endCall(); // hang up the call
          resolve(false);
        }
      }, 120000);
      const onCallEnd = () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        audio.srcObject = null; // clear audio source
        greetingEndDetector.disconnect();
        mediaStreamSource.disconnect();
        gainNode.disconnect();
        greetingEndDetector.port.onmessage = null;
        if (!detected) {
          if (!detectedTimeout) {
            this._deps.alert.warning({
              message: 'dropVoicemailMessageFailedAsCallEnded',
            });
          }
          resolve(false);
        }
      };
      webphoneSession.once('terminated', onCallEnd);
      greetingEndDetector.port.onmessage = (e) => {
        if (e.data === 'greeting-ended' && !detected) {
          detected = true;
          audio.srcObject = null; // clear audio source
          webphoneSession.removeListener('terminated', onCallEnd);
          greetingEndDetector.disconnect();
          mediaStreamSource.disconnect();
          gainNode.disconnect();
          greetingEndDetector.port.onmessage = null;
          if (timeout !== null) {
            clearTimeout(timeout);
          }
          resolve(true);
        }
      };
    });
  }

  async _sendAudioData({
    webphoneSession,
    audioContext,
    audioBuffer,
    endCall,
    updateStatus,
  }) {
    try {
      const peerConnection: RTCPeerConnection = webphoneSession.sessionDescriptionHandler.peerConnection;
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;

      const destinationNode = audioContext.createMediaStreamDestination();
      sourceNode.connect(destinationNode);
      const [audioTrack] = destinationNode.stream.getAudioTracks();
      if (audioTrack) {
        const sender = peerConnection.getSenders().find((s: any) => s.track.kind === 'audio');
        if (sender) {
          const onCallEnd = () => {
            audioTrack.stop();
            sourceNode.stop();
            sourceNode.disconnect();
            destinationNode.disconnect();
            this._deps.alert.warning({
              message: 'dropVoicemailMessageSendedAsCallEnded',
            });
          };
          webphoneSession.once('terminated', onCallEnd);
          // listen audio finish event
          sourceNode.onended = () => {
            audioTrack.stop();
            webphoneSession.removeListener('terminated', onCallEnd);
            updateStatus(voicemailDropStatus.finished);
            endCall();
          };
          await sender.replaceTrack(audioTrack);
          sourceNode.start();
        }
      } else {
        console.error('Failed to create audio track from stream');
        updateStatus(voicemailDropStatus.terminated);
        endCall();
      }
    } catch (e) {
      console.error('Error in send audio data:', e);
      updateStatus(voicemailDropStatus.voicemailDropTerminated);
      endCall();
    }
  }
}
