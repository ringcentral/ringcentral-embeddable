import type { ReactNode } from 'react';

import type { RoutedSideWidgetConfig } from './views/RoutedSideWidgetView';

export type Route = {
  path: string;
  component: React.ComponentType;
  /**
   * does this route require authentication?
   */
  authentication?: boolean;
  /**
   * should the route match exactly?
   */
  exact?: boolean;
  /**
   * Page that remains in the main column while this side widget page is open,
   * for a background no main route can show. Prefer `sideWidget`'s
   * `backgroundPath`: the main column then keeps the page behind, while this
   * component is mounted afresh each time the page opens.
   */
  backgroundComponent?: React.ComponentType;
  /**
   * Keep the previously rendered main page while this side widget page is open.
   */
  preserveBackground?: boolean;
  /**
   * Render this route as a reusable SideWidget tab.
   */
  sideWidget?: RoutedSideWidgetConfig;
  /**
   * The page renders its own nested router. The RingCX agent tab is the
   * current example.
   *
   * Switching to it keeps the current routed page docked only where
   * `resolveParkedPath` allows; otherwise navigation uses the real router.
   */
  ownsRouter?: boolean;
  /**
   * For a page that owns the router: where the main column parks a path under
   * this route behind a routed side widget page, or `null` while it cannot be
   * parked. The main column hands its location to the nested router, so a
   * path can be parked when its nested route neither redirects nor reads the
   * real location. Without it the page is never parked.
   */
  resolveParkedPath?: (path: string) => string | null;
};

export interface AppViewOptions {
  /**
   * app routes when you want addition routes
   */
  routes: Route[];
  /**
   * render addition element in app header below announcement
   */
  headers?: ReactNode;
}
