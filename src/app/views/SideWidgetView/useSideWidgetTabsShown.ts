import { useContext } from 'react';

import { SideWidgetTabsShownContext } from './SideWidgetTabsShownContext';

/**
 * Whether the calling page is in a side widget tab with the tab bar shown.
 * Always `false` in the main column.
 */
export function useSideWidgetTabsShown(): boolean {
  return useContext(SideWidgetTabsShownContext);
}
