import {
  action,
  injectable,
  matchPath,
  RcViewModule,
  Root,
  Route as RouterRoute,
  RouterPlugin,
  state,
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
  RoutedSideWidgetContactResolver,
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

interface ClosedRoutedSideWidgetEntry {
  backgroundPath: string;
  path: string;
  shouldNavigateToBackground: boolean;
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

  private readonly _closedPaths = new Map<
    string,
    ClosedRoutedSideWidgetEntry
  >();

  private readonly _contentViews = new Map<
    string,
    (props: SideWidgetContentViewProps) => React.ReactElement | null
  >();

  private _routes: readonly RoutedSideWidgetRouteDefinition[] = [];

  private _resolveContact?: RoutedSideWidgetContactResolver;

  private _stopWatchingPath: (() => void) | null = null;

  @state
  mainPath: string | null = null;

  /**
   * Main paths whose page renders its own nested router instead of being
   * driven by `mainPath` alone.
   *
   * Such a page (`/agent`, the RingCX shell) reads the real location, so it
   * cannot be shown behind a parked route: its nested `<Switch>` would match
   * nothing and its fallback `<Redirect>` would replace the real route,
   * destroying the entry the user came from. Navigation to those paths always
   * uses the real router.
   */
  private _routerOwningPaths: readonly string[] = [];

  @action
  private _setMainPath(path: string | null): void {
    this.mainPath = path;
  }

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

  registerRoutes(
    routes: readonly RoutedSideWidgetRouteDefinition[],
    resolveContact?: RoutedSideWidgetContactResolver,
  ): void {
    this._routes = routes;
    this._resolveContact = resolveContact;
  }

  /**
   * Declares main paths that own the router themselves. Switching to one of
   * them cannot keep a routed side-widget page visible, so the navigation uses
   * the real router and the routed tab closes instead.
   */
  setRouterOwningPaths(paths: readonly string[]): void {
    this._routerOwningPaths = paths;
  }

  private _ownsRouter(path: string): boolean {
    return this._routerOwningPaths.some(
      (owning) => path === owning || path.startsWith(`${owning}/`),
    );
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
      onCloseComplete: () => this._completeRouteClose(id),
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
    if (path !== this._router.currentPath) {
      return;
    }
    const closedEntry = this._closedPaths.get(config.id);
    if (closedEntry?.path === path) {
      return;
    }
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
    // A page is now open at the router's own path, so the widget has settled
    // and no pending close can still be undone by a stale render of the route
    // it closed. Keeping those tombstones would ignore the user navigating back
    // to that page for the rest of the session, leaving the panel blank.
    this._closedPaths.clear();
  }

  syncPath(path: string, isRoutedPath = false): void {
    // A confirmed router update supersedes any tab navigation that was queued
    // for the route being left (for example, Conversation's direct back
    // navigation to /messages).
    this._requestedPath = path;
    const matchedEntry = Array.from(this._entries.values()).find(
      (entry) => entry.path === path
    );
    const activeEntry = this._entries.get(this._sideWidgetView.currentTabId);
    if (matchedEntry) {
      if (this._sideWidgetView.currentTabId !== matchedEntry.id) {
        this._sideWidgetView.selectTab(matchedEntry.id);
      }
      return;
    }
    if (isRoutedPath) {
      return;
    }
    // The main column only renders `mainPath` while a routed page owns the
    // router. Once the router itself points at a main route, that preserved
    // path is stale and would keep the navigation highlighting the tab the
    // user left.
    if (this.mainPath) {
      this._setMainPath(null);
    }
    if (activeEntry && activeEntry.path !== path) {
      // The user opened the drawer on purpose earlier, so losing the routed
      // page it was showing is not a request to fold it. Only the stale tab is
      // closed; the Apps tab is not opened in its place either.
      this._sideWidgetView.closeContent(activeEntry.handle, {
        collapseWhenLast: false,
      });
    }
  }

  /**
   * Changes the main navigation route without discarding the user's active
   * routed side-widget tab.
   */
  navigateMain(path: string): void {
    if (!path || this._router.currentPath === path) {
      return;
    }
    const activeEntry = this._entries.get(this._sideWidgetView.currentTabId);
    // A route that owns the router must see the real location, so it cannot be
    // parked behind the routed page the way a host-rendered tab can.
    if (activeEntry && this._root.expanded && !this._ownsRouter(path)) {
      this._setMainPath(path);
      return;
    }
    this._setMainPath(null);
    void this._router.push(path);
  }

  private _syncRegisteredPath(path: string): void {
    let params: Record<string, string | undefined> = {};
    const route = this._routes.find(({ routeExact, routePath }) => {
      const match = matchPath<Record<string, string | undefined>>(path, {
        exact: routeExact,
        path: routePath,
      });
      if (!match) {
        return false;
      }
      params = match.params;
      return true;
    });
    if (!route) {
      this.syncPath(path);
      return;
    }
    const existingEntry = this._entries.get(route.config.id);
    if (existingEntry?.path === path) {
      this.syncPath(path, true);
      return;
    }
    // Resolved from app state rather than from a render, so the shared worker
    // registers the page with the same contact the client sees. Without it the
    // worker keeps the previous contact's tab, and its state replaces the
    // client's on the next full sync.
    const contact = this._resolveContact?.(route.config.id, params);
    this.open({
      config: route.config,
      ...(contact === undefined ? {} : { contact }),
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

  private _requestedPath: string | null = null;

  private _navigationQueue: Promise<void> = Promise.resolve();

  private _navigate(path: string): Promise<void> {
    this._requestedPath = path;
    if (this._router.currentPath === path) {
      return Promise.resolve();
    }
    this._navigationQueue = this._navigationQueue
      .catch((error: unknown) => {
        this.logger.error(
          '[RoutedSideWidget] previous navigation failed',
          error,
        );
      })
      .then(async () => {
        if (this._requestedPath !== path) {
          return;
        }
        if (this._router.currentPath !== path) {
          await this._router.push(path);
        }
      });
    return this._navigationQueue;
  }

  private async _activateRoute(id: string): Promise<void> {
    const entry = this._entries.get(id);
    if (entry) {
      await this._navigate(entry.path);
    }
  }

  private async _closeRoute(
    id: string,
    nextTabId: string | null,
  ): Promise<void> {
    const entry = this._entries.get(id);
    if (!entry) {
      return;
    }
    const backgroundPath = this.mainPath ?? entry.backgroundPath;
    const shouldNavigateToBackground =
      this._router.currentPath === backgroundPath ||
      this._router.currentPath === entry.path ||
      this._requestedPath === entry.path;
    this._entries.delete(id);
    this._closedPaths.set(id, {
      backgroundPath,
      path: entry.path,
      shouldNavigateToBackground,
    });
    if (!shouldNavigateToBackground) {
      return;
    }
    if (this._isRoutedTab(nextTabId)) {
      this._requestedPath = this._entries.get(nextTabId!)?.path ?? null;
      return;
    }
    this._setMainPath(null);
    await this._navigate(backgroundPath);
  }

  private async _completeRouteClose(id: string): Promise<void> {
    const closedEntry = this._closedPaths.get(id);
    if (!closedEntry) {
      return;
    }
    if (
      closedEntry.shouldNavigateToBackground &&
      this._router.currentPath !== closedEntry.backgroundPath
    ) {
      await this._navigate(closedEntry.backgroundPath);
    }
    this._closedPaths.clear();
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
        render={({ location }) => {
          // Prefix routes such as /settings/agent keep this tab for nested
          // pages (session edit, manual dial). Requiring the exact last-opened
          // path would unmount the widget between those pages.
          const matched = matchPath(location.pathname, {
            exact: entry.routeExact,
            path: entry.routePath,
          });
          return matched ? <DetailComponent {...entry.props} /> : null;
        }}
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
