import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import {
  CircularProgressIndicator,
  LinearProgressIndicator,
  Text,
} from '@ringcentral/spring-ui';
import React, { useEffect, useState } from 'react';

import { voicemailDropStatus } from '../../../app/services/WebphoneV2/voicemailDropStatus';
import type { CxVoicemailDropState } from '../../services/CxVoicemailDrop';

const TICK_INTERVAL = 250;

/**
 * Shows how far a voicemail drop is: an elapsed timer while it waits for the
 * greeting to end, then a bar over the message length while it plays. Ticks
 * locally, so the shared drop state only changes between phases.
 */
export function VoicemailDropProgress({
  drop,
  waitingLabel,
  sendingLabel,
}: {
  drop: CxVoicemailDropState;
  waitingLabel: string;
  sendingLabel: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const sending =
    drop.status === voicemailDropStatus.sending &&
    drop.sendingStartedAt !== undefined;

  if (!sending) {
    const waited = Math.max(0, Math.floor((now - drop.startedAt) / 1000));
    return (
      <div
        className="mt-1 flex min-w-0 items-center gap-1.5"
        data-sign="voicemailDropStatus"
      >
        <CircularProgressIndicator size="xsmall" />
        <Text
          component="span"
          className="typography-descriptorMini min-w-0 truncate text-primary-f"
        >
          {waitingLabel}
        </Text>
        <Text
          component="span"
          className="typography-descriptorMini shrink-0 text-neutral-b2"
          data-sign="voicemailDropElapsed"
        >
          {formatDuration(waited)}
        </Text>
      </div>
    );
  }

  const total = drop.messageDuration ?? 0;
  const played = Math.min(
    total,
    Math.max(0, (now - (drop.sendingStartedAt ?? now)) / 1000),
  );
  return (
    <div className="mt-1 min-w-0" data-sign="voicemailDropStatus">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <Text
          component="span"
          className="typography-descriptorMini min-w-0 truncate text-primary-f"
        >
          {sendingLabel}
        </Text>
        <Text
          component="span"
          className="typography-descriptorMini shrink-0 text-neutral-b2"
          data-sign="voicemailDropElapsed"
        >
          {`${formatDuration(Math.floor(played))} / ${formatDuration(
            Math.ceil(total),
          )}`}
        </Text>
      </div>
      <LinearProgressIndicator
        className="mt-1"
        variant="determinate"
        slim
        value={played}
        max={total || 1}
        progressBarProps={{ 'aria-label': sendingLabel }}
      />
    </div>
  );
}
