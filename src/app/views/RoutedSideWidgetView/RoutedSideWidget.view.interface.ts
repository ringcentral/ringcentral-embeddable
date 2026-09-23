import type { ComponentType } from 'react';

import type { ThirdPartyWidgetContact } from '../../services/ThirdParty';
import type { SideWidgetTabScope } from '../SideWidgetView';

export interface RoutedSideWidgetConfig {
  id: string;
  name: string;
  scope: SideWidgetTabScope;
  backgroundPath: string;
  /**
   * Resolves the page's background when it depends on live state, such as a
   * disposition opened while its call is still up. Evaluated each time the
   * background is needed; `backgroundPath` is used when it is absent.
   */
  resolveBackgroundPath?: (params: Record<string, string | undefined>) => string;
  /**
   * Fold the drawer when returning from this page to its background closes the
   * last tab. Only for pages
   * the app opens on its own, such as a CX disposition after a call ends: the
   * user never asked for that drawer, so leaving it open and empty would be a
   * blank column nobody opened.
   */
  collapseWhenLeft?: boolean;
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
}
