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

  private _stopWatchingPath: (() => void) | null = null;

  @state
  mainPath: string | null = null;

  @action
  private _setMainPath(path: string | null): void {
    this.mainPath = path;
  }

  private _debug(event: string, details: Record<string, unknown>): void {
    // if (process.env.NODE_ENV !== 'test') {
    //   console.info(`[SideWidgetDebug] ${event}`, details);
    // }
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
      this._debug('ignore stale routed page registration', {
        tabId: config.id,
        path,
        currentPath: this._router.currentPath,
      });
      return;
    }
    const closedEntry = this._closedPaths.get(config.id);
    if (closedEntry?.path === path) {
      this._debug('ignore reopening routed tab while closing', {
        tabId: config.id,
        path,
        currentPath: this._router.currentPath,
      });
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
    this._debug('sync path', {
      path,
      isRoutedPath,
      mainPath: this.mainPath,
      currentTabId: this._sideWidgetView.currentTabId,
      activeEntryPath: activeEntry?.path,
      matchedEntryId: matchedEntry?.id,
      expanded: this._root.expanded,
    });
    if (matchedEntry) {
      this._debug('matched routed path', {
        path,
        tabId: matchedEntry.id,
      });
      if (this._sideWidgetView.currentTabId !== matchedEntry.id) {
        this._sideWidgetView.selectTab(matchedEntry.id);
      }
      return;
    }
    if (isRoutedPath) {
      this._debug('wait for routed page registration', { path });
      return;
    }
    if (activeEntry && activeEntry.path !== path) {
      this._debug('close routed tab after navigation', {
        path,
        tabId: activeEntry.id,
        routedPath: activeEntry.path,
      });
      this._sideWidgetView.closeContent(activeEntry.handle);
    }
  }

  /**
   * Changes the main navigation route without discarding the user's active
   * routed side-widget tab.
   */
  navigateMain(path: string): void {
    this._debug('navigate main requested', {
      currentPath: this._router.currentPath,
      targetPath: path,
      currentTabId: this._sideWidgetView.currentTabId,
      expanded: this._root.expanded,
    });
    if (!path || this._router.currentPath === path) {
      this._debug('navigate main skipped', {
        currentPath: this._router.currentPath,
        targetPath: path,
      });
      return;
    }
    const activeEntry = this._entries.get(this._sideWidgetView.currentTabId);
    if (activeEntry && this._root.expanded) {
      this._setMainPath(path);
      this._debug('navigate main column with routed tab preserved', {
        mainPath: this.mainPath,
        currentTabId: this._sideWidgetView.currentTabId,
        routedPath: activeEntry.path,
      });
      return;
    }
    this._setMainPath(null);
    void this._router.push(path);
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

  private _requestedPath: string | null = null;

  private _navigationQueue: Promise<void> = Promise.resolve();

  private _navigate(path: string): Promise<void> {
    this._requestedPath = path;
    this._debug('routed navigation requested', {
      currentPath: this._router.currentPath,
      requestedPath: path,
    });
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
          this._debug('skip stale routed navigation', {
            stalePath: path,
            requestedPath: this._requestedPath,
          });
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
    this._entries.delete(id);
    this._closedPaths.set(id, {
      backgroundPath,
      path: entry.path,
    });
    this._debug('unregister closed routed tab', {
      tabId: id,
      path: entry.path,
      nextTabId,
      currentPath: this._router.currentPath,
      requestedPath: this._requestedPath,
    });
    if (
      this._router.currentPath !== entry.path &&
      this._requestedPath !== entry.path
    ) {
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
    if (this._router.currentPath !== closedEntry.backgroundPath) {
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
    this._debug('render routed tab', {
      tabId: id,
      routedPath: entry.path,
      currentPath: this._router.currentPath,
      mainPath: this.mainPath,
      expanded: this._root.expanded,
    });
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
