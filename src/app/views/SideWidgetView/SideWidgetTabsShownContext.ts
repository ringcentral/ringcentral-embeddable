import { createContext } from 'react';

/**
 * Whether the page renders in a side widget tab while the tab bar is shown.
 * The tab bar then names the page and the back button is hidden, so a header
 * that is only a title repeats what the tab already shows.
 */
export const SideWidgetTabsShownContext = createContext(false);
