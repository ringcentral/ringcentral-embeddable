import { useContext } from 'react';

import { SideWidgetBackContext } from './SideWidgetBackContext';

/**
 * The back of the side widget tab the calling page renders in, such as
 * closing a routed tab, or `null` when the page keeps its own back.
 *
 * The tab already handles the page's back button. A page that goes back on
 * its own, for example after submitting a form, calls this instead of going
 * back through the router's history, which can reopen a page the user
 * already left.
 */
export function useSideWidgetBack(): (() => void) | null {
  return useContext(SideWidgetBackContext);
}
