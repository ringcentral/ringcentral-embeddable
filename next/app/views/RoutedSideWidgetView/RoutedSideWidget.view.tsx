import {
  injectable,
  matchPath,
  RcViewModule,
  Root,
  Route as RouterRoute,
  RouterPlugin,
  watch,
} from '@ringcentral-integration/next-core';
import React, { useLayoutEffect } from 'react';

import {
  SideWidgetView,
  type SideWidgetContentHandle,
  type SideWidgetContentOptions,
  type SideWidgetContentViewProps,
} from '../SideWidgetView';

import type {
  RoutedSideWidgetConfig,
  RoutedSideWidgetRouteDefinition,
  RoutedSideWidgetViewProps,
} from './RoutedSideWidget.view.interface';

interface RoutedSideWidgetEntry extends RoutedSideWidgetConfig {
  component: RoutedSideWidgetViewProps['detailComponent'];
  /**
   * Whether the contact context of the current path has already been handed to
   * the side widget. Re-opening the same page must not apply it twice, because
   * a contact change closes the sibling contact-scoped tabs.
   */
  contactApplied: boolean;
  handle: SideWidgetContentHandle;
  path: string;
  props: Record<string, unknown>;
  routeExact?: boolean;
  routePath: string;
}

@injectable({
  name: 'RoutedSideWidgetView',
})
export class RoutedSideWidgetView extends RcViewModule {
  constructor(
    private readonly _sideWidgetView: SideWidgetView,
    private readonly _router: RouterPlugin,
    private readonly _root: Root
  ) {
    super();
  }

  private readonly _entries = new Map<string, RoutedSideWidgetEntry>();

  private readonly _contentViews = new Map<
    string,
    (props: SideWidgetContentViewProps) => React.ReactElement | null
  >();

  private _routes: readonly RoutedSideWidgetRouteDefinition[] = [];

  private _stopWatchingPath: (() => void) | null = null;

  override onInit(): void {
    this._syncRegisteredPath(this._router.currentPath);
    this._stopWatchingPath = watch(
      this,
      () => this._router.currentPath,
      (path) => this._syncRegisteredPath(path)
    );
  }

  override onReset(): void {
    this._stopWatchingPath?.();
    this._stopWatchingPath = null;
  }

  registerRoutes(routes: readonly RoutedSideWidgetRouteDefinition[]): void {
    this._routes = routes;
  }

  /**
   * React treats a new function as a new component type, so re-opening a page
   * would unmount and remount it. That destroys the page state and lets the
   * outgoing instance clean up data the remounted one just loaded, leaving an
   * empty tab. Keep one view per page instead.
   */
  private _getContentView(
    id: string
  ): (props: SideWidgetContentViewProps) => React.ReactElement | null {
    const existingView = this._contentViews.get(id);
    if (existingView) {
      return existingView;
    }
    const view = (props: SideWidgetContentViewProps) =>
      this._renderRoute(id, props);
    this._contentViews.set(id, view);
    return view;
  }

  private _createContentOptions(
    config: RoutedSideWidgetConfig
  ): SideWidgetContentOptions {
    const { id, name, scope } = config;
    return {
      id,
      name,
      scope,
      onActivate: () => this._activateRoute(id),
      onClose: (nextTabId: string | null) => this._closeRoute(id, nextTabId),
      view: this._getContentView(id),
    };
  }

  open({
    config,
    contact,
    detailComponent,
    detailProps,
    expand = true,
    path,
    routeExact,
    routePath,
  }: RoutedSideWidgetViewProps): void {
    const existingEntry = this._entries.get(config.id);
    // Re-mounting the same page (tab activation, layout change, route
    // re-render) must not re-apply its contact context: the side widget closes
    // the other contact-scoped tabs whenever the contact changes.
    const contactApplied =
      existingEntry?.path === path && existingEntry.contactApplied;
    const applyContact = contact !== undefined && !contactApplied;
    const handle = this._sideWidgetView.createOrUpdateContent(
      this._createContentOptions(config)
    );
    this._entries.set(config.id, {
      ...config,
      component: detailComponent,
      contactApplied: contactApplied || applyContact,
      handle,
      path,
      props: detailProps,
      routeExact,
      routePath,
    });
    this._sideWidgetView.openContent(handle, {
      ...(applyContact ? { contact } : {}),
      ...(expand ? {} : { expand: false }),
    });
  }

  syncPath(path: string, isRoutedPath = false): void {
    const matchedEntry = Array.from(this._entries.values()).find(
      (entry) => entry.path === path
    );
    if (matchedEntry) {
      if (this._sideWidgetView.currentTabId !== matchedEntry.id) {
        this._sideWidgetView.selectTab(matchedEntry.id);
      }
      return;
    }
    if (isRoutedPath) {
      return;
    }
    const activeEntry = this._entries.get(this._sideWidgetView.currentTabId);
    if (activeEntry && activeEntry.path !== path) {
      this._sideWidgetView.closeContent(activeEntry.handle);
    }
  }

  private _syncRegisteredPath(path: string): void {
    const route = this._routes.find(({ routeExact, routePath }) =>
      Boolean(
        matchPath(path, {
          exact: routeExact,
          path: routePath,
        })
      )
    );
    if (!route) {
      this.syncPath(path);
      return;
    }
    const existingEntry = this._entries.get(route.config.id);
    if (existingEntry?.path === path) {
      this.syncPath(path, true);
      return;
    }
    this.open({
      config: route.config,
      detailComponent: route.detailComponent,
      detailProps: {},
      expand: this._root.expanded,
      path,
      routeExact: route.routeExact,
      routePath: route.routePath,
    });
  }

  private _isRoutedTab(tabId: string | null): boolean {
    return Boolean(tabId && this._entries.has(tabId));
  }

  private _activateRoute(id: string): void {
    const entry = this._entries.get(id);
    if (entry && this._router.currentPath !== entry.path) {
      void this._router.push(entry.path);
    }
  }

  private _closeRoute(id: string, nextTabId: string | null): void {
    const entry = this._entries.get(id);
    if (!entry || this._router.currentPath !== entry.path) {
      return;
    }
    if (!this._isRoutedTab(nextTabId)) {
      void this._router.push(entry.backgroundPath);
    }
  }

  private _renderRoute(
    id: string,
    _props: SideWidgetContentViewProps
  ): React.ReactElement | null {
    const entry = this._entries.get(id);
    if (!entry) {
      return null;
    }
    const DetailComponent = entry.component;
    return (
      <RouterRoute
        path={entry.routePath}
        exact={entry.routeExact}
        render={({ location }) =>
          location.pathname === entry.path ? (
            <DetailComponent {...entry.props} />
          ) : null
        }
      />
    );
  }

  component(props: RoutedSideWidgetViewProps): null {
    const contactPhoneNumbers = props.contact?.phoneNumbers
      ?.map(({ phoneNumber }) => phoneNumber)
      .join(',');
    useLayoutEffect(() => {
      this.open(props);
    }, [
      props.config.id,
      props.contact?.id,
      props.contact?.name,
      props.contact?.phoneNumber,
      contactPhoneNumbers,
      props.expand,
      props.path,
      props.routeExact,
      props.routePath,
    ]);
    return null;
  }
}
