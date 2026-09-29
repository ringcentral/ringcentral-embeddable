/**
 * Get clock time string from timestamp in milliseconds.
 * Returns "MM:SS" when under 1 hour, "HH:MM:SS" otherwise.
 */
export const getClockByTimestamp = (time: number, { useCeil = false } = {}): string => {
  const number = time / 1000;
  const int = useCeil ? Math.ceil(number) : Math.floor(number);
  const hour = Math.floor((int / 3600) % 24);
  const minute = Math.floor((int / 60) % 60);
  const second = Math.floor(int % 60);
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (hour > 0) {
    return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }
  return `${pad(minute)}:${pad(second)}`;
};
