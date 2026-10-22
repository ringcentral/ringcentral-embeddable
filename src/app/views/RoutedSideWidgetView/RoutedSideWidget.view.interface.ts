import type { ComponentType } from 'react';

import type { ThirdPartyWidgetContact } from '../../services/ThirdParty';
import type { SideWidgetTabScope } from '../SideWidgetView';

export interface RoutedSideWidgetConfig {
  id: string;
  /**
   * Tab name. A function is resolved from the page's route params each time
   * the tab renders, so it can follow the locale or a host page's own title.
   */
  name: string | ((params: Record<string, string | undefined>) => string);
  scope: SideWidgetTabScope;
  backgroundPath: string;
  /**
   * Resolves the page's background when it depends on live state, such as a
   * disposition opened while its call is still up. Evaluated each time the
   * background is needed; `backgroundPath` is used when it is absent.
   */
  resolveBackgroundPath?: (params: Record<string, string | undefined>) => string;
  /**
   * More main paths that count as the page's background, for a page that can
   * return to several, such as a disposition whose submit goes back to the
   * agent home tab the call came from. Evaluated each time, like
   * `resolveBackgroundPath`.
   */
  resolveExtraBackgroundPaths?: (
    params: Record<string, string | undefined>,
  ) => readonly string[];
  /**
   * Fold the drawer when returning from this page to its background closes the
   * last tab. Only for pages
   * the app opens on its own, such as a CX disposition after a call ends: the
   * user never asked for that drawer, so leaving it open and empty would be a
   * blank column nobody opened.
   */
  collapseWhenLeft?: boolean;
  /**
   * Close the tab once the router leaves its page for anything other than a
   * tab switch. For form pages such as logging a call or composing a text:
   * saving, sending or going back finishes them, like the legacy widgets that
   * closed themselves after a save.
   */
  closeWhenLeft?: boolean;
  /**
   * The page has no fixed background: it returns to the main page the user
   * opened it from, and `backgroundPath` is only the fallback.
   */
  preserveBackground?: boolean;
  /**
   * The page's contact can arrive just after it opens, like a click-to-SMS
   * that adds its recipient after navigating. A missing (`null`) contact is
   * applied only once the opening has settled, and a contact that arrives
   * later still replaces it.
   */
  deferBlankContact?: boolean;
  /**
   * Keep the page's own back navigation instead of closing the tab, for tabs
   * with nested pages such as Settings, where back goes up one level.
   */
  keepBackNavigation?: boolean;
}

export interface RoutedSideWidgetViewProps {
  config: RoutedSideWidgetConfig;
  contact?: ThirdPartyWidgetContact | null;
  detailComponent: ComponentType<Record<string, unknown>>;
  detailProps: Record<string, unknown>;
  expand?: boolean;
  path: string;
  routeExact?: boolean;
  routePath: string;
}

/**
 * Resolves the contact a routed page belongs to from app state alone. The
 * shared worker runs these modules without React, so route registration must
 * be able to resolve the contact itself instead of waiting for a render.
 */
export type RoutedSideWidgetContactResolver = (
  tabId: string,
  params: Record<string, string | undefined>,
) => ThirdPartyWidgetContact | null | undefined;

export interface RoutedSideWidgetRouteDefinition {
  config: RoutedSideWidgetConfig;
  detailComponent: ComponentType<Record<string, unknown>>;
  routeExact?: boolean;
  routePath: string;
  /**
   * The route renders its own background component at its own path, so the
   * main column stays on the route instead of moving to `backgroundPath`.
   */
  rendersOwnBackground?: boolean;
}

/**
 * A main path whose page renders its own nested router, or sits outside the
 * signed-in shell, so it cannot always be shown behind a routed page.
 */
export interface RoutedSideWidgetRouterOwner {
  path: string;
  /**
   * Where the main column parks a path under this one behind a routed page,
   * or `null` while it cannot be parked. Without it the page is never parked.
   */
  resolveParkedPath?: (path: string) => string | null;
}
