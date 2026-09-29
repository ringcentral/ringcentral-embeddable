import { SIDE_WIDGET_APPS_TAB_ID } from './SideWidget.helper';
import type { SideWidgetTab } from './SideWidget.view.interface';

/** The tab list and the selection shown in it. */
export interface SideWidgetTabsState {
  tabs: SideWidgetTab[];
  currentTabId: string;
  selectedAppId: string | null;
}

export interface OpenSideWidgetTabOptions {
  tab: SideWidgetTab;
  activate: boolean;
  /** Whether the tabs of the current contact stay; `false` keeps only global ones. */
  preserveTabs: boolean;
  /** Whether third-party app tabs are allowed (`enableSideWidget`). */
  enabled: boolean;
  /** Whether the Apps tab joins the opened tab. */
  showAppsTab: boolean;
}

export function createAppsTab(): SideWidgetTab {
  return {
    id: SIDE_WIDGET_APPS_TAB_ID,
    name: 'Apps',
  };
}

export function isPromiseLike(value: unknown): value is PromiseLike<void> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'then' in value &&
      typeof value.then === 'function',
  );
}

/**
 * Opens a tab: new content goes in front, the Apps tab always joins at the
 * end, and a tab that is already open keeps its position.
 */
export function openSideWidgetTab(
  state: SideWidgetTabsState,
  { tab, activate, preserveTabs, enabled, showAppsTab }: OpenSideWidgetTabOptions,
): SideWidgetTabsState {
  const availableTabs = enabled
    ? state.tabs
    : state.tabs.filter(({ id }) => id !== SIDE_WIDGET_APPS_TAB_ID);
  // Like any other tab, the Apps tab stays for the same contact and is
  // cleared with the other contact tabs when the contact changes.
  const contactTabs = preserveTabs
    ? availableTabs
    : availableTabs.filter(({ scope }) => scope === 'global');
  const retainedTabs =
    showAppsTab && !contactTabs.some(({ id }) => id === SIDE_WIDGET_APPS_TAB_ID)
      ? [...contactTabs, createAppsTab()]
      : contactTabs;
  const existingTabIndex = retainedTabs.findIndex(({ id }) => id === tab.id);
  // The Apps tab joins at the end, so a call's Apps tab lines up behind
  // content the call already opened.
  const insertedTabs =
    tab.id === SIDE_WIDGET_APPS_TAB_ID
      ? [...retainedTabs, tab]
      : [tab, ...retainedTabs];
  const tabs =
    existingTabIndex < 0
      ? insertedTabs
      : retainedTabs.map((item, index) =>
          index === existingTabIndex ? tab : item,
        );
  if (activate) {
    return { tabs, currentTabId: tab.id, selectedAppId: null };
  }
  return {
    tabs,
    currentTabId: tabs.some(({ id }) => id === state.currentTabId)
      ? state.currentTabId
      : tab.id,
    selectedAppId: preserveTabs ? state.selectedAppId : null,
  };
}

/**
 * Removes a tab. Closing the active tab selects the one that took its place,
 * or the one before it when it was last.
 */
export function removeSideWidgetTab(
  state: SideWidgetTabsState,
  tabId: string,
): SideWidgetTabsState {
  const tabIndex = state.tabs.findIndex(({ id }) => id === tabId);
  const tabs = state.tabs.filter(({ id }) => id !== tabId);
  const currentTabId =
    state.currentTabId === tabId
      ? (tabs[Math.min(tabIndex, tabs.length - 1)]?.id ??
        SIDE_WIDGET_APPS_TAB_ID)
      : state.currentTabId;
  return {
    tabs,
    currentTabId,
    selectedAppId:
      tabId === SIDE_WIDGET_APPS_TAB_ID ? null : state.selectedAppId,
  };
}

/**
 * The contact-scoped tabs a contact change closes: every tab but the one
 * being opened, the Apps tab, and global tabs.
 */
export function getClosedSideWidgetTabIds(
  tabs: SideWidgetTab[],
  nextTabId: string,
  preserveTabs: boolean,
): string[] {
  if (preserveTabs) {
    return [];
  }
  return tabs
    .filter(
      ({ id, scope }) =>
        id !== nextTabId && id !== SIDE_WIDGET_APPS_TAB_ID && scope !== 'global',
    )
    .map(({ id }) => id);
}

/** The widest `minExpandedWidth` among the tabs, or `null` when none sets one. */
export function getSideWidgetMinExpandedWidth(
  tabs: SideWidgetTab[],
): number | null {
  const widths = tabs.flatMap(({ minExpandedWidth }) =>
    minExpandedWidth ? [minExpandedWidth] : [],
  );
  return widths.length > 0 ? Math.max(...widths) : null;
}
