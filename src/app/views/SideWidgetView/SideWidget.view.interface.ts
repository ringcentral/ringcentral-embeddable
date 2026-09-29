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
  minExpandedWidth?: number;
}

export type SideWidgetTabScope = 'contact' | 'global';

type SideWidgetLifecycleResult = void | Promise<void>;

export interface SideWidgetContentOptions {
  id: string;
  /** Tab name copied into the tab state when it opens. */
  name: string;
  /**
   * Tab name resolved each time the tab renders, so a localized name follows
   * the current locale. `name` is shown when it is absent.
   */
  getName?: () => string;
  view: ComponentType<SideWidgetContentViewProps>;
  scope?: SideWidgetTabScope;
  /** Shows available third-party apps as a sibling tab. */
  showAppsTab?: boolean;
  /**
   * Keeps this tab in front while it is open and a new call opens its apps:
   * the Apps tab and the pinned app tabs open behind it instead of taking
   * focus.
   */
  keepActiveOnCallApps?: boolean;
  /**
   * Keeps the view rendered while another tab is active, so its state, such as
   * a loaded iframe, survives tab switches. Routed pages leave it off, because
   * they render from the current route and only the active one may.
   */
  keepMounted?: boolean;
  /**
   * Width in px the expanded column needs while this tab is open, for content
   * built for a wider panel than the default one. The app frame grows to fit
   * it and shrinks back once no open tab needs it.
   */
  minExpandedWidth?: number;
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

export interface SideWidgetOpenAppsOptions {
  /** @default true */
  activate?: boolean;
}

export interface SideWidgetCloseTabOptions {
  /**
   * Whether the drawer folds when the closed tab was the last one.
   *
   * By default it folds only while it is an overlay over the folded app, which
   * would otherwise cover the page with a blank view. A docked drawer stays
   * open on its blank view: the user closing a page, or going back from it, is
   * not a request to fold the layout. Pass `true` for tabs the app opened and
   * closes on its own, such as a call's RingCX widgets, so their drawer does
   * not stay as a blank column nobody opened. The Apps tab does not replace a
   * closed last tab either: it only opens with a new call.
   *
   * @default !Root.expanded
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
