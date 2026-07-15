import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';

import type {
  ThirdPartyWidgetContact,
  UnknownRecord,
} from '../../services/ThirdParty';

import type {
  SideWidgetAppAction,
  SideWidgetPage,
  SideWidgetPageInfo,
} from './SideWidget.view.interface';

export const SIDE_WIDGET_APPS_TAB_ID = 'side-widget-apps';
export const SIDE_WIDGET_APP_TAB_PREFIX = 'side-widget-app-';

export function getSideWidgetAppTabId(appId: string): string {
  return `${SIDE_WIDGET_APP_TAB_PREFIX}${appId}`;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPage(value: unknown): SideWidgetPage | null {
  if (!isRecord(value) || value.type !== 'json-schema') {
    return null;
  }
  if (!isRecord(value.schema)) {
    return null;
  }
  return {
    type: 'json-schema',
    schema: value.schema,
    ...(isRecord(value.uiSchema) && { uiSchema: value.uiSchema }),
    ...(isRecord(value.formData) && { formData: value.formData }),
  };
}

function getActions(value: unknown): SideWidgetAppAction[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.reduce<SideWidgetAppAction[]>((actions, item) => {
    if (!isRecord(item) || typeof item.id !== 'string') {
      return actions;
    }
    actions.push({
      id: item.id,
      label: typeof item.label === 'string' ? item.label : item.id,
      ...(typeof item.color === 'string' && { color: item.color }),
    });
    return actions;
  }, []);
}

export function getSideWidgetPageInfo(data: unknown): SideWidgetPageInfo {
  if (!isRecord(data)) {
    return { page: null, actions: [] };
  }
  const page = getPage(data.page) ?? getPage(data);
  return {
    page,
    actions: getActions(data.actions),
  };
}

export function getSideWidgetContact(
  session: NormalizedSession,
  party: 'from' | 'to',
): ThirdPartyWidgetContact {
  const contactMatch = isRecord(session.contactMatch)
    ? session.contactMatch
    : {};
  const phoneNumber = party === 'from' ? session.from : session.to;
  const name = party === 'from' ? session.fromUserName : session.toUserName;
  return {
    phoneNumber,
    name,
    ...contactMatch,
  } as ThirdPartyWidgetContact;
}

export function isSameSideWidgetContact(
  first?: ThirdPartyWidgetContact | null,
  second?: ThirdPartyWidgetContact | null,
): boolean {
  if (!first || !second) {
    return false;
  }
  if (first.id && second.id && first.id === second.id) {
    return true;
  }
  if (
    first.phoneNumber &&
    second.phoneNumber &&
    first.phoneNumber === second.phoneNumber
  ) {
    return true;
  }
  if (
    first.phoneNumbers?.some(
      ({ phoneNumber }) => phoneNumber === second.phoneNumber,
    )
  ) {
    return true;
  }
  return Boolean(
    second.phoneNumbers?.some(
      ({ phoneNumber }) => phoneNumber === first.phoneNumber,
    ),
  );
}
