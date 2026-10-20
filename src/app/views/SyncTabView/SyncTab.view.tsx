import {
  SyncTabView as SyncTabViewBase,
  type SyncTabProps,
  type SyncTabViewOptions,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  useConnector,
  useLocation,
} from '@ringcentral-integration/next-core';
import clsx from 'clsx';
import { useLayoutEffect } from 'react';

/**
 * Applies Spring UI's compact mode to all synchronized sub-tab groups.
 */
@injectable({
  name: 'SyncTabView',
})
export class SyncTabView extends SyncTabViewBase {
  /**
   * Tab groups rendered in the main column behind a routed side widget page,
   * where the router context's location is not the router's.
   */
  private readonly _tabsBehindRoutedPage = new Set<string>();

  constructor(
    private readonly _routerPlugin: RouterPlugin,
    portManager: PortManager,
    @optional('SyncTabViewOptions') options?: SyncTabViewOptions,
  ) {
    super(_routerPlugin, portManager, options);
  }

  /**
   * Behind a routed page the router is on that page, so pushing would add a
   * second history entry for it. The tab is replaced in place instead, which
   * still writes it into the location state that syncs it to other ports.
   */
  override setActive(
    tabId: string,
    activeTab: string | number | null,
    options: { currentPath?: string } = {},
  ) {
    if (!options.currentPath && this._tabsBehindRoutedPage.has(tabId)) {
      void this.replaceActive(tabId, activeTab);
      return;
    }
    super.setActive(tabId, activeTab, options);
  }

  override component(props: SyncTabProps) {
    const location = useLocation();
    const currentPath = useConnector(() => this._routerPlugin.currentPath);
    const behindRoutedPage = location.pathname !== currentPath;
    useLayoutEffect(() => {
      if (!behindRoutedPage) {
        return undefined;
      }
      this._tabsBehindRoutedPage.add(props.id);
      return () => {
        this._tabsBehindRoutedPage.delete(props.id);
      };
    }, [behindRoutedPage, props.id]);
    return super.component({
      ...props,
      className: clsx('sui-compact', props.className),
      tabClassName: clsx('sui-compact', props.tabClassName),
    });
  }
}
