export interface CxAgentScriptData {
  scriptId: string;
  groupId: string;
  accountId: string;
  name: string;
  description: string;
  created: string;
  updated: string;
  isActive: boolean;
  data: CxScriptResponseJSON;
}

export interface CxScriptResponseJSON {
  tools: Tool[];
}

export interface Tool {
  id: string;
  label: string;
  x: number;
  y: number;
  connections: Connection[];
  type: string;
  icon: string;
  hasConfig: boolean;
  hideInToolbar?: boolean;
  maxConnections?: number;
  properties?: Properties;
}

export interface Connection {
  label: string;
  type: string[];
  target: string;
}

export interface Properties {
  pageData: PageDatum[];
}

export interface PageDatum {
  type: string;
  id: string;
  key: string;
  data: Data;
  templateOptions: TemplateOptions;
  extras: Extras;
  validation: Validation;
  controller: string;
  ngModelElAttrs?: NgModelElAttrs;
  name: string;
}

export interface Data {
  layout: Layout;
  javascript: Javascript;
  mouseover: boolean;
  lastEdit: number;
  ignoreModel?: boolean;
  action?: Action;
  class?: string;
  size?: string;
}

export interface Action {
  type: string;
  view: string;
  location: string;
}

export interface Javascript {
  trigger: string;
  delay: number;
  script?: string;
}

export interface Layout {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface Extras {}

export interface NgModelElAttrs {
  'scripting-input-javascript': string;
}

export interface TemplateOptions {
  label: string;
}

export interface Validation {
  messages: Extras;
}
