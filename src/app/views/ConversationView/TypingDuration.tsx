import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { useConnector } from '@ringcentral-integration/next-core';
import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';

import type { SmsTypingTimeTracker } from '../../services/SmsTypingTimeTracker';

const TICK_INTERVAL = 1000;

interface TypingDurationProps {
  tracker: SmsTypingTimeTracker;
  contextKey: string;
}

/**
 * Shows how long the user has typed the message draft of a typing context,
 * ticking while typing and frozen while paused.
 */
export const TypingDuration: FunctionComponent<TypingDurationProps> = ({
  tracker,
  contextKey,
}) => {
  const { enabled, startTime, accumulatedTime } = useConnector(() => ({
    enabled: tracker.enabled,
    startTime: tracker.typingStartTimes[contextKey],
    accumulatedTime: tracker.accumulatedTypingTimes[contextKey] ?? 0,
  }));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled || !startTime) {
      return undefined;
    }
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [enabled, startTime]);

  if (!enabled || (!startTime && !accumulatedTime)) {
    return null;
  }
  const running = Boolean(startTime);
  const duration = running
    ? accumulatedTime + Math.max(now - startTime, 0)
    : accumulatedTime;

  return (
    <span
      data-sign={running ? 'typingDuration' : 'typingDurationPaused'}
      className="flex-shrink-0 self-end mb-1 whitespace-nowrap typography-detail text-neutral-b2"
    >
      {formatDuration(Math.floor(duration / 1000))}
    </span>
  );
};
