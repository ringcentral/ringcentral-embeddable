import { createContext } from 'react';

/**
 * How the side widget tab a page renders in handles the page's back, or
 * `null` when the page keeps its own back navigation, as in the main column.
 */
export const SideWidgetBackContext = createContext<(() => void) | null>(null);
