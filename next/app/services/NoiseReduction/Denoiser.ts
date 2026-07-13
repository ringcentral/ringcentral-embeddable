import type { KrispNoiseFilterNode } from './NoiseReduction.interface';

export class Denoiser {
  protected _originalTracks: MediaStreamTrack[] = [];
  protected _audioContext: AudioContext;
  protected _filterNode: KrispNoiseFilterNode;
  protected _sourceAudioNode: MediaStreamAudioSourceNode | null = null;
  protected _destinationAudioNode: MediaStreamAudioDestinationNode | null =
    null;

  constructor({
    audioContext,
    filterNode,
  }: {
    audioContext: AudioContext;
    filterNode: KrispNoiseFilterNode;
  }) {
    this._audioContext = audioContext;
    this._filterNode = filterNode;
  }

  connect(stream: MediaStream): MediaStream {
    if (this._sourceAudioNode?.mediaStream.id === stream.id) {
      return stream;
    }
    if (this.connected) {
      this.disconnect();
    }
    this._originalTracks = stream.getAudioTracks();
    try {
      if (!this._filterNode.isReady) {
        throw new Error('Filter node is not ready');
      }
      this._sourceAudioNode =
        this._audioContext.createMediaStreamSource(stream);
      this._destinationAudioNode =
        this._audioContext.createMediaStreamDestination();
      this._sourceAudioNode.connect(this._filterNode);
      this._filterNode.connect(this._destinationAudioNode);
      const cleanStream = this._destinationAudioNode.stream;
      const cleanTrack = cleanStream.getAudioTracks()[0];
      if (!cleanTrack) {
        throw new Error('Noise reduction did not produce an audio track');
      }
      this._originalTracks.forEach((track) => {
        stream.removeTrack(track);
      });
      stream.addTrack(cleanTrack);
    } catch (error) {
      console.error(error);
      return stream;
    }
    return stream;
  }

  disconnect(): void {
    if (!this.connected) {
      return;
    }
    this._sourceAudioNode?.disconnect();
    this._destinationAudioNode?.disconnect();
    this._originalTracks.forEach((track) => {
      track.stop();
    });
    this._originalTracks = [];
    this._destinationAudioNode?.stream
      ?.getTracks()
      .forEach((track) => track.stop());
    this._destinationAudioNode = null;
    this._sourceAudioNode = null;
  }

  get connected(): boolean {
    return !!this._sourceAudioNode?.mediaStream;
  }
}
