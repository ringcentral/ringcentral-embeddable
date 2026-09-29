/** Must match the main column width in `RootOptions.expandedLayoutMainClass`. */
export const FOLDED_APP_WIDTH = 300;

export const EXPANDED_APP_WIDTH = 600;

/**
 * The narrowest window, such as the popup, that still shows the main column
 * and the side widget side by side; narrower ones fold, as legacy did.
 */
export const MIN_EXPANDED_WINDOW_WIDTH = 500;

/**
 * The app width the expanded layout needs: the main column plus the widest
 * open side widget tab's `minExpandedWidth`, never below the default expanded
 * width.
 */
export const getExpandedAppWidth = (
  minExpandedWidth: number | null | undefined,
): number =>
  Math.max(EXPANDED_APP_WIDTH, FOLDED_APP_WIDTH + (minExpandedWidth ?? 0));
