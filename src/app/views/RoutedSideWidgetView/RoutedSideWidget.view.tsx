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

/**
 * How long a `deferBlankContact` page waits for its contact before it is
 * treated as having none. Long enough for a click-to-SMS to request its
 * recipient after navigating, short enough to go unnoticed.
 */
const BLANK_CONTACT_SETTLE_MS = 200;

interface RoutedSideWidgetEntry extends RoutedSideWidgetConfig {
  component: RoutedSideWidgetViewProps['detailComponent'];
  /**
   * Whether the contact context of the current path has already been handed to
   * the side widget. Re-opening the same page must not apply it twice, because
   * a contact change closes the sibling contact-scoped tabs.
   */
  contactApplied: boolean;
  /**
   * The contact applied was `null`. A `deferBlankContact` page still takes a
   * real contact that arrives afterwards.
   */
  blankContactApplied: boolean;
  handle: SideWidgetContentHandle;
  /** The main page a `preserveBackground` page was opened from. */
  openedBackgroundPath?: string;
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

  /** The last path handed to {@link syncPath}, to handle each change once. */
  private _syncedPath: string | null = null;

  /** The main-column page the user was last on. */
  private _lastMainPath: string | null = null;

  private readonly _blankContactTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

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
  private _updateMainPath(path: string | null): void {
    this.mainPath = path;
  }

  private _setMainPath(path: string | null): void {
    if (path) {
      this._lastMainPath = path;
    }
    this._updateMainPath(path);
  }

  override onInit(): void {
    this._sideWidgetView.setMainPathResolver(
      () => this.mainPath ?? this._router.currentPath,
    );
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
    this._blankContactTimers.forEach((timer) => clearTimeout(timer));
    this._blankContactTimers.clear();
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
      ...(config.keepBackNavigation
        ? {}
        : { onBack: () => this._closeFromBack(id) }),
      view: this._getContentView(id),
    };
  }

  /**
   * The back button of a routed tab closes the tab, the same as its close
   * button: the last tab folds the drawer, and the main column keeps the page
   * the user is on.
   */
  private _closeFromBack(id: string): void {
    const entry = this._entries.get(id);
    if (entry) {
      this._sideWidgetView.closeContent(entry.handle);
    }
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
    const isSamePage = existingEntry?.path === path;
    // Re-mounting the same page (tab activation, layout change, route
    // re-render) must not re-apply its contact context: the side widget closes
    // the other contact-scoped tabs whenever the contact changes.
    const contactApplied = isSamePage && existingEntry.contactApplied;
    const blankContactApplied =
      isSamePage && existingEntry.blankContactApplied;
    // A page that may get its contact just after opening does not act on a
    // missing one yet; the settled contact is applied later instead.
    const deferBlankContact =
      !!config.deferBlankContact && contact === null && !contactApplied;
    const upgradeBlankContact =
      !!config.deferBlankContact &&
      blankContactApplied &&
      contact !== null &&
      contact !== undefined;
    const applyContact =
      contact !== undefined &&
      !deferBlankContact &&
      (!contactApplied || upgradeBlankContact);
    if (!isSamePage) {
      this._parkOpenerMainPath(config, path, routePath, routeExact);
    }
    const handle = this._sideWidgetView.createOrUpdateContent(
      this._createContentOptions(config)
    );
    this._entries.set(config.id, {
      ...config,
      blankContactApplied: applyContact ? contact === null : blankContactApplied,
      component: detailComponent,
      contactApplied: contactApplied || applyContact,
      handle,
      openedBackgroundPath: isSamePage
        ? existingEntry.openedBackgroundPath
        : this._resolveOpenedBackgroundPath(config),
      path,
      props: detailProps,
      routeExact,
      routePath,
    });
    this._sideWidgetView.openContent(handle, {
      ...(applyContact ? { contact } : {}),
      ...(expand ? {} : { expand: false }),
    });
    if (deferBlankContact) {
      this._scheduleBlankContact(config.id, path);
    }
    // A page is now open at the router's own path, so the widget has settled
    // and no pending close can still be undone by a stale render of the route
    // it closed. Keeping those tombstones would ignore the user navigating back
    // to that page for the rest of the session, leaving the panel blank.
    this._closedPaths.clear();
  }

  syncPath(path: string, isRoutedPath = false): void {
    // Both the router watcher and the app view report each route change.
    if (path === this._syncedPath) {
      return;
    }
    const previousPath = this._syncedPath;
    this._syncedPath = path;
    const isTabActivation = this._requestedPath === path;
    // A confirmed router update supersedes any tab navigation that was queued
    // for the route being left (for example, Conversation's direct back
    // navigation to /messages).
    this._requestedPath = path;
    const matchedEntry = Array.from(this._entries.values()).find(
      (entry) => entry.path === path
    );
    const leftEntry =
      previousPath && !isTabActivation
        ? Array.from(this._entries.values()).find(
            (entry) => entry.path === previousPath,
          )
        : undefined;
    if (
      leftEntry?.closeWhenLeft &&
      this._isFinishingLeftEntry(leftEntry, path, isRoutedPath || !!matchedEntry)
    ) {
      // Select the page that took over first, so closing the form does not
      // activate some other tab and navigate away from it.
      if (
        matchedEntry &&
        this._sideWidgetView.currentTabId !== matchedEntry.id
      ) {
        this._sideWidgetView.selectTab(matchedEntry.id);
      }
      this._closeLeftEntry(leftEntry, path, isRoutedPath || !!matchedEntry);
      return;
    }
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
    if (
      activeEntry &&
      this._root.expanded &&
      !this._isBackgroundPath(activeEntry, path) &&
      !this._ownsRouter(path)
    ) {
      // The left page changed some other way than the navigation bar (a host
      // navigation, a link in the page). Like `navigateMain`, the docked
      // drawer keeps its page and the new page is shown in the main column.
      this._setMainPath(path);
      this._requestedPath = activeEntry.path;
      void this._router.replace(activeEntry.path);
      return;
    }
    const parkedMainPath = this.mainPath;
    if (
      activeEntry &&
      parkedMainPath &&
      parkedMainPath !== path &&
      this._isBackgroundPath(activeEntry, path)
    ) {
      // A routed page returning to its own background, a submitted
      // disposition for example, would otherwise pull the main column off the
      // page the user switched to while the drawer was open. The tab closes
      // while that page is still parked, so it does not route to its own
      // background.
      this._sideWidgetView.closeContent(activeEntry.handle, {
        collapseWhenLast: !!activeEntry.collapseWhenLeft,
      });
      this._setMainPath(null);
      this._requestedPath = parkedMainPath;
      void this._router.replace(parkedMainPath);
      return;
    }
    // The main column only renders `mainPath` while a routed page owns the
    // router. Once the router itself points at a main route, that preserved
    // path is stale and would keep the navigation highlighting the tab the
    // user left.
    if (this.mainPath) {
      this._setMainPath(null);
    }
    this._lastMainPath = path;
    if (activeEntry && activeEntry.path !== path) {
      // The page returned to its own background, the drawer was folded, or
      // the new page owns the router. The user opened the drawer on purpose
      // earlier, so losing the routed page it was showing is not a request to
      // fold it. Only the stale tab is closed and the drawer shows its blank
      // view; the Apps tab is not opened in its place either. A page the app
      // opened on its own folds the drawer when it returns to its background.
      // A folded drawer is an overlay over the page, so it closes when empty.
      this._sideWidgetView.closeContent(activeEntry.handle, {
        collapseWhenLast:
          !this._root.expanded ||
          (!!activeEntry.collapseWhenLeft &&
            this._isBackgroundPath(activeEntry, path)),
      });
    }
  }

  /**
   * Whether leaving a `closeWhenLeft` page finishes it: a hand-over to another
   * routed page, a return to its background (its back, save or send), a route
   * that owns the router, or any navigation while the drawer is an overlay. A
   * docked page survives the user switching to an unrelated main page.
   */
  private _isFinishingLeftEntry(
    entry: RoutedSideWidgetEntry,
    path: string,
    isRoutedPath: boolean,
  ): boolean {
    return (
      isRoutedPath ||
      !this._root.expanded ||
      this._isBackgroundPath(entry, path) ||
      this._ownsRouter(path)
    );
  }

  /**
   * Closes a form page the router just left. Its back, save or send navigated
   * away on purpose, so the tab is done, but the page the router went to must
   * still be the one the user sees.
   */
  private _closeLeftEntry(
    entry: RoutedSideWidgetEntry,
    path: string,
    isRoutedPath: boolean,
  ): void {
    const parkedMainPath = this.mainPath;
    const returnedToBackground = this._isBackgroundPath(entry, path);
    // A folded drawer is an overlay over the page the router returned to,
    // such as the call history a saved log goes back to, so it closes when
    // empty instead of covering that page with the blank view.
    this._sideWidgetView.closeContent(entry.handle, {
      collapseWhenLast:
        !this._root.expanded ||
        (!!entry.collapseWhenLeft && returnedToBackground),
    });
    if (isRoutedPath) {
      // Another routed page took over, such as the conversation a sent text
      // opens. It is already the active tab.
      return;
    }
    // Returning to its own background while the user had switched the main
    // column elsewhere keeps the page the user switched to.
    const mainPath =
      parkedMainPath && returnedToBackground ? parkedMainPath : path;
    if (
      this._root.expanded &&
      this._isRoutedTab(this._sideWidgetView.currentTabId) &&
      !this._ownsRouter(mainPath)
    ) {
      // The next routed tab takes the router back, so the main page is parked
      // to stay visible in the main column.
      this._setMainPath(mainPath);
      return;
    }
    this._setMainPath(null);
    this._lastMainPath = mainPath;
    if (mainPath !== path) {
      this._requestedPath = mainPath;
      void this._router.replace(mainPath);
    }
  }

  private _scheduleBlankContact(id: string, path: string): void {
    if (this._blankContactTimers.has(id)) {
      return;
    }
    this._blankContactTimers.set(
      id,
      setTimeout(() => {
        this._blankContactTimers.delete(id);
        this._applySettledContact(id, path);
      }, BLANK_CONTACT_SETTLE_MS),
    );
  }

  /**
   * Applies the contact of a `deferBlankContact` page once its opening has
   * settled: the contact that arrived meanwhile, or none, which clears the
   * other contact tabs.
   */
  private _applySettledContact(id: string, path: string): void {
    const entry = this._entries.get(id);
    if (
      !entry ||
      entry.path !== path ||
      entry.contactApplied ||
      this._router.currentPath !== path
    ) {
      return;
    }
    const match = matchPath<Record<string, string | undefined>>(path, {
      exact: entry.routeExact,
      path: entry.routePath,
    });
    const contact = this._resolveContact?.(id, match?.params ?? {});
    if (contact === undefined) {
      return;
    }
    this._entries.set(id, {
      ...entry,
      blankContactApplied: contact === null,
      contactApplied: true,
    });
    this._sideWidgetView.openContent(entry.handle, {
      activate: false,
      contact,
      expand: false,
    });
  }

  /**
   * Keeps the main page the user opened a routed page from, such as the call
   * history a contact record was opened from. Otherwise the main column would
   * switch to the route's own background (the contact list), while opening a
   * side widget page must not change the page on the left.
   */
  private _parkOpenerMainPath(
    config: RoutedSideWidgetConfig,
    path: string,
    routePath: string,
    routeExact?: boolean,
  ): void {
    const openerPath = this._lastMainPath;
    if (
      this.mainPath ||
      !openerPath ||
      config.preserveBackground ||
      this._ownsRouter(openerPath)
    ) {
      return;
    }
    const params =
      matchPath<Record<string, string | undefined>>(path, {
        exact: routeExact,
        path: routePath,
      })?.params ?? {};
    const backgroundPath = config.resolveBackgroundPath
      ? config.resolveBackgroundPath(params)
      : config.backgroundPath;
    if (openerPath === config.backgroundPath || openerPath === backgroundPath) {
      return;
    }
    this._setMainPath(openerPath);
  }

  private _resolveOpenedBackgroundPath(
    config: RoutedSideWidgetConfig,
  ): string | undefined {
    if (!config.preserveBackground) {
      return undefined;
    }
    return this.mainPath ?? this._lastMainPath ?? config.backgroundPath;
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
    // The shared worker has no app view to report the route, so this watcher
    // is its only sync. Without it, the worker would not see the router leave
    // this page later, and its state would keep a tab the client closed.
    this.syncPath(path, true);
  }

  private _getBackgroundPath(entry: RoutedSideWidgetEntry): string {
    if (entry.openedBackgroundPath) {
      return entry.openedBackgroundPath;
    }
    if (!entry.resolveBackgroundPath) {
      return entry.backgroundPath;
    }
    const match = matchPath<Record<string, string | undefined>>(entry.path, {
      exact: entry.routeExact,
      path: entry.routePath,
    });
    return match
      ? entry.resolveBackgroundPath(match.params)
      : entry.backgroundPath;
  }

  private _isBackgroundPath(entry: RoutedSideWidgetEntry, path: string): boolean {
    return (
      path === entry.backgroundPath || path === this._getBackgroundPath(entry)
    );
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
    // A page the router opened itself, such as the log page a submitted
    // disposition hands over to, is activated while the router is already on
    // it. That is not a tab switch: requesting its path would make `syncPath`
    // take the navigation for one and keep the page the router just left.
    if (entry && this._router.currentPath !== entry.path) {
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
    const backgroundPath = this.mainPath ?? this._getBackgroundPath(entry);
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
        render={(routeProps) => {
          // Prefix routes such as /settings/agent keep this tab for nested
          // pages (session edit, manual dial). Requiring the exact last-opened
          // path would unmount the widget between those pages.
          const matched = matchPath(routeProps.location.pathname, {
            exact: entry.routeExact,
            path: entry.routePath,
          });
          // The live route props win over the ones captured when the page was
          // registered, which are empty when the router opened it before the
          // route rendered. Pages such as the log page read `match` directly.
          return matched ? (
            <DetailComponent {...entry.props} {...routeProps} />
          ) : null;
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
