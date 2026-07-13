import type { ThirdPartyApp, UnknownRecord } from '../../services/ThirdParty';

export interface SideWidgetOptions {
  enableSideWidget?: boolean;
}

export interface SideWidgetTab {
  id: string;
  name: string;
  appId?: ThirdPartyApp['id'];
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
