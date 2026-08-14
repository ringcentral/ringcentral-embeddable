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
  onActivate?: () => SideWidgetLifecycleResult;
  onDeactivate?: (nextTabId: string | null) => SideWidgetLifecycleResult;
  onClose?: (nextTabId: string | null) => SideWidgetLifecycleResult;
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
