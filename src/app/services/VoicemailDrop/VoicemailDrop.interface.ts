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
