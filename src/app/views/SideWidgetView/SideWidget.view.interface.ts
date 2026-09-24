import type { ComponentType } from 'react';

import type {
  ThirdPartyApp,
  ThirdPartyWidgetContact,
  UnknownRecord,
} from '../../services/ThirdParty';

export interface SideWidgetOptions {
  enableSideWidget?: boolean;
}

export interface SideWidgetTab {
  id: string;
  name: string;
  appId?: ThirdPartyApp['id'];
  scope?: SideWidgetTabScope;
}

export type SideWidgetTabScope = 'contact' | 'global';

type SideWidgetLifecycleResult = void | Promise<void>;

export interface SideWidgetContentOptions {
  id: string;
  name: string;
  view: ComponentType<SideWidgetContentViewProps>;
  scope?: SideWidgetTabScope;
  /** Shows available third-party apps as a sibling tab. */
  showAppsTab?: boolean;
  onActivate?: () => SideWidgetLifecycleResult;
  onDeactivate?: (nextTabId: string | null) => SideWidgetLifecycleResult;
  onClose?: (nextTabId: string | null) => SideWidgetLifecycleResult;
  /**
   * Replaces the page's own back button. A docked widget page has nothing to
   * go back to, so its back button closes it instead, like the legacy widgets.
   */
  onBack?: () => void;
  /** Runs after the final tab has collapsed the expanded layout. */
  onCloseComplete?: () => SideWidgetLifecycleResult;
}

export interface SideWidgetContentViewProps {
  showCloseButton: boolean;
}

export interface SideWidgetOpenContentOptions {
  activate?: boolean;
  contact?: ThirdPartyWidgetContact | null;
  expand?: boolean;
}

export interface SideWidgetCloseTabOptions {
  /**
   * Whether collapsing the drawer is allowed when the closed tab was the last
   * one.
   *
   * A route-driven close keeps the drawer open, because the user opened it on
   * purpose and leaving a routed page is not a request to fold it. Closing the
   * drawer is not replaced with the Apps tab either: that tab only opens with a
   * new call.
   *
   * @default true
   */
  collapseWhenLast?: boolean;
}

export class SideWidgetContentHandle {
  constructor(public options: SideWidgetContentOptions) {}
}

export interface SideWidgetPage {
  type: 'json-schema';
  schema: UnknownRecord;
  uiSchema?: UnknownRecord;
  formData?: UnknownRecord;
}

export interface SideWidgetAppAction {
  id: string;
  label: string;
  color?: string;
}

export interface SideWidgetPageInfo {
  page: SideWidgetPage | null;
  actions: SideWidgetAppAction[];
}
