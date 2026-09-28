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
   * Page that remains in the main column while this side widget page is open.
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
   * The page renders its own nested router and reads the real location.
   *
   * Switching to it cannot park the current routed page behind a synthetic
   * path, so navigation always uses the real router. The RingCX agent tab is
   * the current example.
   */
  ownsRouter?: boolean;
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
