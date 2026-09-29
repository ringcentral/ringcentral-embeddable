import type { I18nKey } from './i18n';

export interface SideWidgetBlankInfo {
  titleKey?: I18nKey;
  descriptionKey: I18nKey;
}

const DIAL_PAD_TAB_TITLES: Partial<Record<string, I18nKey>> = {
  calls: 'callDetails',
  voicemail: 'voicemailSummary',
};

function isPathOrChild(path: string, parent: string): boolean {
  return path === parent || path.startsWith(`${parent}/`);
}

/**
 * Describes the blank side widget for the page shown in the main column, so
 * it tells the user what selecting an item on the left will open.
 *
 * @param mainPath - The route rendered in the main column.
 * @param dialPadTab - The active sub-tab of the phone page, if any.
 */
export function getSideWidgetBlankInfo(
  mainPath: string | null,
  dialPadTab: string | number | null,
): SideWidgetBlankInfo {
  if (!mainPath) {
    return { descriptionKey: 'noWidgetView' };
  }
  if (isPathOrChild(mainPath, '/contacts')) {
    return { descriptionKey: 'selectItemOnLeft' };
  }
  let titleKey: I18nKey | undefined;
  if (isPathOrChild(mainPath, '/messages')) {
    titleKey = 'textDetails';
  } else if (isPathOrChild(mainPath, '/fax')) {
    titleKey = 'faxSummary';
  } else if (isPathOrChild(mainPath, '/dialer')) {
    titleKey =
      dialPadTab === null ? undefined : DIAL_PAD_TAB_TITLES[String(dialPadTab)];
  } else if (mainPath === '/agent/home/history') {
    titleKey = 'callDetails';
  }
  return titleKey
    ? { titleKey, descriptionKey: 'selectFromListPanel' }
    : { descriptionKey: 'noWidgetView' };
}
