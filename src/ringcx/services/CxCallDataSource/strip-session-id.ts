import { _encodeSymbol } from '../../lib/constant';

/**
 * Strip the `$<sessionId>` suffix from an encoded call id, leaving the uii.
 *
 * Session ids are not fixed-width: conference legs can produce values such as
 * `<uii>$12`, so the split must use the last separator.
 */
export function stripSessionId(id: string): string {
  const index = id.lastIndexOf(_encodeSymbol);
  return index === -1 ? id : id.slice(0, index);
}
