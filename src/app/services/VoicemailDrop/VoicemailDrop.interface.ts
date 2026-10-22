export type VoicemailMessage = {
  id: string;
  label: string;
  file?: string;
  fileName: string;
  uri?: string;
};

/**
 * The media surface voicemail drop actually needs from a call.
 *
 * Deliberately narrow: the greeting is played by swapping the outbound track and
 * watching the remote one, which is WebRTC work owned by the tab holding the
 * media-owner role. `BrowserWebRtcSession` satisfies this; the SharedWorker's
 * SDK call sessions cannot, since they expose no peer connection.
 */
export interface VoicemailDropMediaHandle {
  readonly rtcPeerConnection?: RTCPeerConnection;
  once(event: 'disposed', handler: () => void): void;
  off(event: 'disposed', handler: () => void): void;
  /** Re-enables the microphone after the recorded message finishes. */
  restoreSessionAudio?(): void;
}

export interface VoicemailDropOptions {
  /**
   * Keep the call up when the drop ends, as the RingCX voice channel needs:
   * its owner hangs up the CX call itself. The speaker and noise reduction
   * stay on during the drop.
   */
  keepSession?: boolean;
}

/** What a drop status change knows beyond the status itself. */
export interface VoicemailDropStatusDetails {
  /** The message length in seconds, sent with the `sending` status. */
  messageDuration?: number;
}
