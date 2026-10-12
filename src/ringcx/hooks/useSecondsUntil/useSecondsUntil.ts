import { useEffect, useState } from 'react';

const TICK_MS = 1000;

const getSecondsUntil = (timestamp: number): number =>
  Math.max(0, Math.ceil((timestamp - Date.now()) / TICK_MS));

/**
 * Seconds left until a timestamp, updated every second in this component
 * only, so a countdown never writes shared state each second.
 * @param timestamp epoch milliseconds, or null when nothing is counted down
 * @returns whole seconds left, or null without a timestamp
 */
export function useSecondsUntil(timestamp: number | null): number | null {
  const [seconds, setSeconds] = useState<number | null>(() =>
    timestamp === null ? null : getSecondsUntil(timestamp),
  );
  useEffect(() => {
    if (timestamp === null) {
      setSeconds(null);
      return undefined;
    }
    setSeconds(getSecondsUntil(timestamp));
    const timer = setInterval(() => {
      setSeconds(getSecondsUntil(timestamp));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [timestamp]);
  return seconds;
}
