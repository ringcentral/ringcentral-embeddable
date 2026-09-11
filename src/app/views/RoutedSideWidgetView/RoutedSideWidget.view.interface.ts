import type { ComponentType } from 'react';

import type { ThirdPartyWidgetContact } from '../../services/ThirdParty';
import type { SideWidgetTabScope } from '../SideWidgetView';

export interface RoutedSideWidgetConfig {
  id: string;
  name: string;
  scope: SideWidgetTabScope;
  backgroundPath: string;
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

export interface RoutedSideWidgetRouteDefinition {
  config: RoutedSideWidgetConfig;
  detailComponent: ComponentType<Record<string, unknown>>;
  routeExact?: boolean;
  routePath: string;
}
