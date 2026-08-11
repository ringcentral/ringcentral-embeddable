import type { ComponentType } from 'react';

import type { ThirdPartyApp, UnknownRecord } from '../../services/ThirdParty';

export interface SideWidgetOptions {
  enableSideWidget?: boolean;
}

export interface SideWidgetTab {
  id: string;
  name: string;
  appId?: ThirdPartyApp['id'];
}

export interface SideWidgetContentOptions {
  id: string;
  name: string;
  view: ComponentType<SideWidgetContentViewProps>;
  onClose?: () => void;
}

export interface SideWidgetContentViewProps {
  showCloseButton: boolean;
}

export interface SideWidgetOpenContentOptions {
  activate?: boolean;
}

export class SideWidgetContentHandle {
  constructor(public readonly options: SideWidgetContentOptions) {}
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
