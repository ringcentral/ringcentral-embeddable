/**
 * Delay used when a dial group sets no usable progressive call delay, the same
 * fallback Agent One uses.
 */
const DEFAULT_PROGRESSIVE_CALL_DELAY_SECONDS = 1;

/**
 * Largest delay the RingCX admin accepts for "Progressive call delay".
 */
const MAX_PROGRESSIVE_CALL_DELAY_SECONDS = 120;

/**
 * Reads the dial group "Progressive call delay (seconds)" setting.
 *
 * The SDK keeps the raw attribute, a string such as `"10"`. A missing, zero,
 * or invalid value falls back to 1 second.
 *
 * @param value `progressiveCallDelay` of a dial group from the SDK.
 * @returns the delay in seconds, between 1 and 120.
 */
export function parseProgressiveCallDelay(value: unknown): number {
  const seconds = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return DEFAULT_PROGRESSIVE_CALL_DELAY_SECONDS;
  }
  return Math.min(seconds, MAX_PROGRESSIVE_CALL_DELAY_SECONDS);
}
