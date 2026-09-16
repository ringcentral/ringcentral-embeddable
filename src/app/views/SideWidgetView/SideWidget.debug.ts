import type { ThirdPartyWidgetContact } from '../../services/ThirdParty';

const ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

/**
 * The widget can run in several clients at once (tab, popup, extension) that
 * share one worker but keep their own tab state, so every line says which
 * client emitted it.
 */
const CLIENT = Math.random().toString(36).slice(2, 7);

/**
 * `undefined` and `null` carry different meanings across the side widget
 * ("not resolved yet" versus "no contact"), and JSON.stringify drops the
 * former, so both are spelled out.
 */
function format(details: Record<string, unknown>): string {
  try {
    return JSON.stringify(details, (_key, value: unknown) => {
      if (value === undefined) {
        return '<undefined>';
      }
      if (value === null) {
        return '<null>';
      }
      return value;
    });
  } catch {
    return String(details);
  }
}

export function describeContact(
  contact?: ThirdPartyWidgetContact | null,
): unknown {
  if (contact === undefined || contact === null) {
    return contact;
  }
  return {
    id: contact.id,
    name: contact.name,
    phoneNumber: contact.phoneNumber,
    phoneNumbers: contact.phoneNumbers?.map(
      ({ phoneNumber }) => phoneNumber,
    ),
  };
}

/** Tolerates a partially stubbed side widget: logging must never throw. */
export function describeTabs(tabs?: { id: string }[]): string[] {
  return Array.isArray(tabs) ? tabs.map(({ id }) => id) : [];
}

export function sideWidgetDebug(
  event: string,
  details: Record<string, unknown>,
): void {
  if (!ENABLED) {
    return;
  }
  // eslint-disable-next-line no-console
  console.info(`[SideWidgetDebug:${CLIENT}] ${event} ${format(details)}`);
}
