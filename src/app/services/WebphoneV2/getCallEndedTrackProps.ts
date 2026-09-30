import type {
  WebphoneCallDirection,
  WebphoneNormalizedSession,
} from './WebphoneApi.interface';

const MILLISECONDS_PER_SECOND = 1000;

export type CallEndedTrackProps = {
  direction: WebphoneCallDirection;
  duration: number;
  result: string;
};

type CallEndedSession = Pick<
  WebphoneNormalizedSession,
  | 'direction'
  | 'startTime'
  | 'isToVoicemail'
  | 'isOnFlip'
  | 'isForwarded'
  | 'isReplied'
  | 'isOnTransfer'
>;

/**
 * Builds the legacy `WebRTC Call Ended` properties. The later checks win,
 * matching the legacy result precedence.
 */
export function getCallEndedTrackProps(
  session: CallEndedSession,
): CallEndedTrackProps {
  const duration = session.startTime
    ? Math.floor((Date.now() - session.startTime) / MILLISECONDS_PER_SECOND) + 1
    : 0;
  const results: readonly [boolean, string][] = [
    [session.isToVoicemail, 'Voicemail'],
    [session.isOnFlip, 'Call Flip'],
    [session.isForwarded, 'Forwarded'],
    [session.isReplied, 'Replied'],
    [session.isOnTransfer, 'Transfer'],
  ];
  const result = results.reduce(
    (current, [matched, name]) => (matched ? name : current),
    'Terminated',
  );
  return {
    direction: session.direction,
    duration,
    result,
  };
}
