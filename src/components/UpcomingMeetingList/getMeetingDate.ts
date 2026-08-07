const UTC_TIME_ZONES: ReadonlySet<string> = new Set([
  'UTC',
  'GMT',
  'ETC/UTC',
  'ETC/GMT',
]);
const TIME_ZONE_OFFSET_PATTERN: RegExp = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Creates a date from a meeting timestamp while preserving its source timezone.
 *
 * @param time Meeting timestamp.
 * @param timeZone Source timezone.
 * @returns Date that can be formatted in the user's local timezone.
 */
export default function getMeetingDate(
  time: string,
  timeZone?: string,
): Date {
  const hasTimeZoneOffset: boolean = TIME_ZONE_OFFSET_PATTERN.test(time);
  const isUtcTime: boolean = Boolean(
    timeZone && UTC_TIME_ZONES.has(timeZone.toUpperCase()),
  );
  const normalizedTime: string =
    isUtcTime && !hasTimeZoneOffset ? `${time}Z` : time;
  return new Date(normalizedTime);
}
