import {
  action,
  delegate,
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
  type SideWidgetCloseReason,
  type SideWidgetContentHandle,
  type SideWidgetContentOptions,
  type SideWidgetContentViewProps,
} from '../SideWidgetView';

import {
  decidePageContact,
  type PageContactDecision,
  type PageContactState,
} from './RoutedSideWidget.contact';
import {
  decideCloseCompletion,
  decideMainColumnAfterFinish,
  decideMainNavigation,
  decideOpenerParking,
  decideRouteChange,
  decideRouteClose,
  resolveMainColumnPath,
  type RoutedPage,
  type RouteChangeDecision,
  type RouteCloseDecision,
} from './RoutedSideWidget.navigation';
import type {
  RoutedSideWidgetConfig,
  RoutedSideWidgetContactResolver,
  RoutedSideWidgetRouteDefinition,
  RoutedSideWidgetRouterOwner,
  RoutedSideWidgetViewProps,
} from './RoutedSideWidget.view.interface';

/**
 * How long a `deferBlankContact` page waits for its contact before it is
 * treated as having none. Long enough for a click-to-SMS to request its
 * recipient after navigating, short enough to go unnoticed.
 */
const BLANK_CONTACT_SETTLE_MS = 200;

/** Whether a path is one of the routes, or a page nested under one. */
function matchesPathPrefix(path: string, routes: readonly string[]): boolean {
  return routes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

interface RoutedSideWidgetEntry extends RoutedSideWidgetConfig {
  component: RoutedSideWidgetViewProps['detailComponent'];
  /**
   * Whether the contact context of the current path has already been handed to
   * the side widget. Re-opening the same page must not apply it twice, because
   * a contact change closes the sibling contact-scoped tabs.
   */
  contactApplied: boolean;
  /** The contact applied was `null`; a real contact arriving later replaces it. */
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
  /**
   * The page closed because the router left it, so the router arriving at it
   * again is the user going back to it, such as when a call that took the
   * router ends, not a stale render of the close.
   */
  routerLeft: boolean;
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

  private _stopWatchingParkable: (() => void) | null = null;

  private _stopWatchingContact: (() => void) | null = null;

  /** The last path handed to {@link syncPath}, to handle each change once. */
  private _syncedPath: string | null = null;

  /** The main-column page the user was last on. */
  private _lastMainPath: string | null = null;

  /**
   * The main page a `preserveBackground` page returns to: the last one that
   * can be shown behind a routed page, see {@link _rememberMainPath}.
   */
  private _lastReturnPath: string | null = null;

  /** A route change is closing the page the router left. */
  private _closingLeftPage = false;

  private readonly _blankContactTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  @state
  mainPath: string | null = null;

  /**
   * Main paths whose page renders its own nested router, or sits outside the
   * signed-in shell.
   *
   * The main column hands its location to a nested router, so such a page
   * can be parked once it says where (`resolveParkedPath`), such as the
   * RingCX agent home in a ready session. Anything else it shows reads the
   * real location or redirects, which would replace the real route and
   * destroy the entry the user came from, so navigation to it uses the real
   * router.
   */
  private _routerOwners: readonly RoutedSideWidgetRouterOwner[] = [];

  /** Main paths outside the signed-in shell, such as the call page. */
  private _outsideShellPaths: readonly string[] = [];

  @action
  private _updateMainPath(path: string | null): void {
    this.mainPath = path;
  }

  /**
   * Parks a main page, as the page its router owner shows for it: closing the
   * routed page then routes to the location the main column already shows,
   * not to a path the owner would redirect, which would remount it.
   */
  private _setMainPath(path: string | null): void {
    const mainPath = path ? this._toParkedPath(path) : null;
    if (mainPath) {
      this._rememberMainPath(mainPath);
    }
    this._updateMainPath(mainPath);
  }

  /**
   * Records the main page the user was on. A page outside the signed-in
   * shell, such as the call page, closes with its call, so the page from
   * before it stays the one to return to.
   *
   * A `preserveBackground` page also skips a router-owning page that cannot
   * be parked, such as a RingCX call page: it reads the real route, so behind
   * a routed page, like the log page a disposition hands over to, it would
   * render nothing, and its call has usually ended by then.
   */
  private _rememberMainPath(path: string): void {
    if (this.isOutsideShellPath(path)) {
      return;
    }
    this._lastMainPath = path;
    if (!this._ownsRouter(path)) {
      this._lastReturnPath = path;
    }
  }

  /** The page a `preserveBackground` page returns to, if it still can be. */
  private _getReturnPath(): string | null {
    const path = this._lastReturnPath;
    return path && !this._ownsRouter(path) ? path : null;
  }

  override onInit(): void {
    this._sideWidgetView.setMainPathResolver(
      () => this.mainPath ?? this._router.currentPath,
    );
    this._syncRegisteredPath(this._router.currentPath);
    // A page's contact often loads after the router opened it, such as a
    // contact's details. The shared worker renders no route to apply it, so it
    // would keep the previous contact's tabs, and hand them back to the client
    // on its next tab update.
    this._stopWatchingContact = watch(
      this,
      () => this._getResolvedContactKey(),
      () => this._applyResolvedContact(),
    );
    this._stopWatchingPath = watch(
      this,
      () => this._router.currentPath,
      (path) => this._syncRegisteredPath(path)
    );
    // A parked page can stop being parkable, such as the agent home when the
    // RingCX session ends. Its nested router would then redirect and take
    // the real route over, so the main column returns to the routed page's
    // background instead.
    this._stopWatchingParkable = watch(
      this,
      () => !!this.mainPath && this._ownsRouter(this.mainPath),
      (unparkable) => {
        if (unparkable) {
          this._updateMainPath(null);
        }
      },
    );
  }

  override onReset(): void {
    this._stopWatchingContact?.();
    this._stopWatchingContact = null;
    this._stopWatchingPath?.();
    this._stopWatchingPath = null;
    this._stopWatchingParkable?.();
    this._stopWatchingParkable = null;
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
   * them keeps a routed side-widget page visible only while it can be parked;
   * otherwise the navigation uses the real router and the routed tab closes.
   */
  setRouterOwners(owners: readonly RoutedSideWidgetRouterOwner[]): void {
    this._routerOwners = owners;
  }

  /**
   * Declares main paths outside the signed-in shell, such as the call page.
   * They close with what they show, so they never become the page behind a
   * routed page.
   */
  setOutsideShellPaths(paths: readonly string[]): void {
    this._outsideShellPaths = paths;
  }

  isOutsideShellPath(path: string): boolean {
    return matchesPathPrefix(path, this._outsideShellPaths);
  }

  private _findRouterOwner(
    path: string,
  ): RoutedSideWidgetRouterOwner | undefined {
    return this._routerOwners.find((owner) =>
      matchesPathPrefix(path, [owner.path]),
    );
  }

  private _ownsRouter(path: string): boolean {
    const owner = this._findRouterOwner(path);
    return !!owner && !owner.resolveParkedPath?.(path);
  }

  private _toParkedPath(path: string): string {
    return this._findRouterOwner(path)?.resolveParkedPath?.(path) ?? path;
  }

  private _findRoute(path: string):
    | {
        route: RoutedSideWidgetRouteDefinition;
        params: Record<string, string | undefined>;
      }
    | undefined {
    for (const route of this._routes) {
      const match = matchPath<Record<string, string | undefined>>(path, {
        exact: route.routeExact,
        path: route.routePath,
      });
      if (match) {
        return { route, params: match.params };
      }
    }
    return undefined;
  }

  /** Whether the router is on a routed side widget page. */
  isOnRoutedPage(): boolean {
    const path = this._router.currentPath;
    return !!path && !!this._findRoute(path);
  }

  /**
   * The location the main column renders, see {@link resolveMainColumnPath}.
   * Read it in a connector: a background that follows state, such as the
   * agent tab picked behind a RingCX history detail, changes with that state.
   */
  getMainColumnPath(): string {
    const currentPath = this._router.currentPath ?? '/';
    const found = this._findRoute(currentPath);
    const config = found?.route.config;
    return resolveMainColumnPath({
      currentPath,
      mainPath: this.mainPath,
      routedPage:
        found && config
          ? {
              backgroundPath:
                config.resolveBackgroundPath?.(found.params) ??
                config.backgroundPath,
              preserveBackground: !!config.preserveBackground,
              rendersOwnBackground: !!found.route.rendersOwnBackground,
            }
          : null,
      lastMainPath: this._getReturnPath(),
    });
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
    config: RoutedSideWidgetConfig,
    getName: () => string,
  ): SideWidgetContentOptions {
    const { id, scope } = config;
    return {
      id,
      name: getName(),
      getName,
      scope,
      onActivate: () => this._activateRoute(id),
      onClose: (nextTabId: string | null, reason?: SideWidgetCloseReason) =>
        this._closeRoute(id, nextTabId, reason),
      onCloseComplete: () => this._completeRouteClose(id),
      ...(config.keepBackNavigation
        ? {}
        : { onBack: () => this._closeFromBack(id) }),
      view: this._getContentView(id),
    };
  }

  /**
   * The back button of a routed tab closes the tab, the same as its close
   * button: a docked drawer stays open on its blank view when it was the last
   * tab, and the main column keeps the page the user is on.
   */
  private _closeFromBack(id: string): void {
    if (this._entries.has(id)) {
      void this._sideWidgetView.closeTabFromPanel(id);
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
      // A client runs no router watcher, and the route opens before
      // `syncPath` hears of the move, so the record of a page the router left
      // and came back to, such as a disposition behind a RingEX call, is
      // cleared here. Otherwise the tab stays open without its page.
      if (!closedEntry.routerLeft) {
        return;
      }
      this._closedPaths.delete(config.id);
    }
    const existingEntry = this._entries.get(config.id);
    const isSamePage = existingEntry?.path === path;
    // Re-mounting the same page (tab activation, layout change, route
    // re-render) must not re-apply its contact context: the side widget closes
    // the other contact-scoped tabs whenever the contact changes.
    const appliedContact: PageContactState = isSamePage
      ? {
          contactApplied: existingEntry.contactApplied,
          blankContactApplied: existingEntry.blankContactApplied,
        }
      : { contactApplied: false, blankContactApplied: false };
    const contactDecision = decidePageContact(
      appliedContact,
      contact,
      !!config.deferBlankContact,
    );
    const nextContact =
      contactDecision.type === 'apply' ? contactDecision.next : appliedContact;
    if (!isSamePage) {
      this._parkOpenerMainPath(config, path, routePath, routeExact);
    }
    const handle = this._sideWidgetView.createOrUpdateContent(
      this._createContentOptions(config, () =>
        this._resolveName(config, path, routePath, routeExact),
      ),
    );
    this._entries.set(config.id, {
      ...config,
      ...nextContact,
      component: detailComponent,
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
      ...(contactDecision.type === 'apply'
        ? { contact: contactDecision.contact }
        : {}),
      ...(expand ? {} : { expand: false }),
    });
    if (contactDecision.type === 'defer') {
      // A page that may get its contact just after opening does not act on a
      // missing one yet; the settled contact is applied later instead.
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
    this._pruneClosedEntries();
    const isTabActivation = this._requestedPath === path;
    // A confirmed router update supersedes any tab navigation that was queued
    // for the route being left (for example, Conversation's direct back
    // navigation to /messages).
    this._requestedPath = path;
    const parkedMainPath = this.mainPath;
    const decision = decideRouteChange({
      path,
      previousPath,
      isTabActivation,
      isRoutedPath,
      pages: this._getRoutedPages(),
      currentTabId: this._sideWidgetView.currentTabId,
      expanded: this._root.expanded,
      mainPath: parkedMainPath,
      ownsRouter: (target) => this._ownsRouter(target),
    });
    switch (decision.type) {
      case 'none':
        return;
      case 'selectPage':
        this._sideWidgetView.selectTab(decision.pageId);
        return;
      case 'finishLeftPage':
        this._finishLeftPage(decision, path, parkedMainPath);
        return;
      case 'keepDockedPage':
        this._setMainPath(decision.mainPath);
        this._requestedPath = decision.pagePath;
        void this._router.replace(decision.pagePath);
        return;
      case 'returnToParkedPage':
        this._closeEntry(decision.pageId, decision.collapseWhenLast);
        this._setMainPath(null);
        this._requestedPath = decision.mainPath;
        void this._router.replace(decision.mainPath);
        return;
      case 'showMainPage':
        // The main column only renders `mainPath` while a routed page owns
        // the router. Once the router itself points at a main route, that
        // preserved path is stale and would keep the navigation highlighting
        // the tab the user left.
        if (this.mainPath) {
          this._setMainPath(null);
        }
        this._rememberMainPath(path);
        if (decision.closePage) {
          this._closeEntry(
            decision.closePage.pageId,
            decision.closePage.collapseWhenLast,
          );
        }
        return;
      default:
        return;
    }
  }

  /**
   * Drops the pages whose tab another port closed, such as the server closing
   * one from the panel. That port ran the page's close, and this one only kept
   * its record, which route decisions would otherwise still act on. The page
   * the router is on stays: its tab can still be on its way from the port that
   * opened it.
   */
  private _pruneClosedEntries(): void {
    const openTabIds = new Set(this._sideWidgetView.tabs.map(({ id }) => id));
    Array.from(this._entries.entries()).forEach(([id, entry]) => {
      if (!openTabIds.has(id) && entry.path !== this._router.currentPath) {
        this._entries.delete(id);
      }
    });
  }

  /** The open routed pages, as route decisions see them. */
  private _getRoutedPages(): RoutedPage[] {
    return Array.from(this._entries.values()).map((entry) => ({
      id: entry.id,
      path: entry.path,
      backgroundPaths: [entry.backgroundPath, this._getBackgroundPath(entry)],
      closeWhenLeft: !!entry.closeWhenLeft,
      collapseWhenLeft: !!entry.collapseWhenLeft,
    }));
  }

  /** Closes a page the router left, see `ClosedRoutedSideWidgetEntry`. */
  private _closeEntry(id: string, collapseWhenLast: boolean): void {
    const entry = this._entries.get(id);
    if (!entry) {
      return;
    }
    this._closingLeftPage = true;
    try {
      this._sideWidgetView.closeContent(entry.handle, { collapseWhenLast });
    } finally {
      this._closingLeftPage = false;
    }
  }

  /**
   * Closes a form page the router just left. Its back, save or send navigated
   * away on purpose, so the tab is done, but the page the router went to must
   * still be the one the user sees.
   */
  private _finishLeftPage(
    decision: Extract<RouteChangeDecision, { type: 'finishLeftPage' }>,
    path: string,
    parkedMainPath: string | null,
  ): void {
    if (decision.selectPageId) {
      this._sideWidgetView.selectTab(decision.selectPageId);
    }
    this._closeEntry(decision.pageId, decision.collapseWhenLast);
    if (decision.handedOver) {
      // Another routed page took over, such as the conversation a sent text
      // opens. It is already the active tab.
      return;
    }
    const mainColumn = decideMainColumnAfterFinish({
      path,
      parkedMainPath,
      returnedToBackground: decision.returnedToBackground,
      expanded: this._root.expanded,
      nextTabIsRouted: this._isRoutedTab(this._sideWidgetView.currentTabId),
      ownsRouter: (target) => this._ownsRouter(target),
    });
    if (mainColumn.type === 'park') {
      // The next routed tab takes the router back, so the main page is parked
      // to stay visible in the main column.
      this._setMainPath(mainColumn.mainPath);
      return;
    }
    this._setMainPath(null);
    this._rememberMainPath(mainColumn.mainPath);
    if (mainColumn.mainPath !== path) {
      this._requestedPath = mainColumn.mainPath;
      void this._router.replace(mainColumn.mainPath);
    }
  }

  /**
   * The contact the page the router is on resolved to, when the page has not
   * applied it yet. A blank contact is left to the settle timer of a
   * `deferBlankContact` page, and a page that applied a blank contact still
   * takes a real one that arrives afterwards.
   */
  private _getUnappliedContact(): {
    entry: RoutedSideWidgetEntry;
    decision: Extract<PageContactDecision, { type: 'apply' }>;
  } | null {
    const path = this._router.currentPath;
    const entry = Array.from(this._entries.values()).find(
      (item) => item.path === path,
    );
    if (!entry) {
      return null;
    }
    const params =
      matchPath<Record<string, string | undefined>>(path, {
        exact: entry.routeExact,
        path: entry.routePath,
      })?.params ?? {};
    const decision = decidePageContact(
      entry,
      this._resolveContact?.(entry.id, params),
      !!entry.deferBlankContact,
    );
    return decision.type === 'apply' ? { entry, decision } : null;
  }

  private _getResolvedContactKey(): string | null {
    const unapplied = this._getUnappliedContact();
    if (!unapplied) {
      return null;
    }
    const { entry, decision } = unapplied;
    const { contact } = decision;
    const contactKey = contact
      ? [contact.id, contact.phoneNumber, contact.name].join('|')
      : 'none';
    return `${entry.id}:${entry.path}:${contactKey}`;
  }

  private _applyResolvedContact(): void {
    const unapplied = this._getUnappliedContact();
    if (!unapplied) {
      return;
    }
    const { entry, decision } = unapplied;
    this._entries.set(entry.id, { ...entry, ...decision.next });
    this._sideWidgetView.openContent(entry.handle, {
      activate: false,
      contact: decision.contact,
      expand: false,
    });
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
    if (!entry || entry.path !== path || this._router.currentPath !== path) {
      return;
    }
    const match = matchPath<Record<string, string | undefined>>(path, {
      exact: entry.routeExact,
      path: entry.routePath,
    });
    const decision = decidePageContact(
      entry,
      this._resolveContact?.(id, match?.params ?? {}),
      // The opening has settled, so no contact now means none.
      false,
    );
    if (decision.type !== 'apply') {
      return;
    }
    this._entries.set(id, { ...entry, ...decision.next });
    this._sideWidgetView.openContent(entry.handle, {
      activate: false,
      contact: decision.contact,
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
    const params =
      matchPath<Record<string, string | undefined>>(path, {
        exact: routeExact,
        path: routePath,
      })?.params ?? {};
    const openerPath = decideOpenerParking({
      mainPath: this.mainPath,
      openerPath: this._lastMainPath,
      preserveBackground: !!config.preserveBackground,
      backgroundPaths: [
        config.backgroundPath,
        config.resolveBackgroundPath?.(params) ?? config.backgroundPath,
      ],
      ownsRouter: (target) => this._ownsRouter(target),
    });
    if (openerPath) {
      this._setMainPath(openerPath);
    }
  }

  private _resolveName(
    config: RoutedSideWidgetConfig,
    path: string,
    routePath: string,
    routeExact?: boolean,
  ): string {
    if (typeof config.name === 'string') {
      return config.name;
    }
    const params =
      matchPath<Record<string, string | undefined>>(path, {
        exact: routeExact,
        path: routePath,
      })?.params ?? {};
    return config.name(params);
  }

  private _resolveOpenedBackgroundPath(
    config: RoutedSideWidgetConfig,
  ): string | undefined {
    if (!config.preserveBackground) {
      return undefined;
    }
    return this.mainPath ?? this._getReturnPath() ?? config.backgroundPath;
  }

  /**
   * Changes the main navigation route without discarding the user's active
   * routed side-widget tab.
   *
   * Runs on the server port, which also closes the routed tabs. Parked only on
   * a client, the page the user switched to is unknown there, so closing the
   * tab would return the main column to the page the tab was opened from.
   */
  @delegate('server')
  async navigateMain(path: string): Promise<void> {
    const decision = decideMainNavigation({
      path,
      currentPath: this._router.currentPath,
      hasActiveRoutedPage: this._isRoutedTab(this._sideWidgetView.currentTabId),
      expanded: this._root.expanded,
      ownsRouter: (target) => this._ownsRouter(target),
    });
    if (decision.type === 'park') {
      this._setMainPath(path);
    } else if (decision.type === 'push') {
      this._setMainPath(null);
      void this._router.push(path);
    }
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
    // The router arriving at a closed page is the user opening it again, such
    // as the same contact's details, not a stale render of the close. Only a
    // render clears the record otherwise, and the shared worker never renders.
    if (this._closedPaths.get(route.config.id)?.path === path) {
      this._closedPaths.delete(route.config.id);
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
    reason?: SideWidgetCloseReason,
  ): Promise<void> {
    const entry = this._entries.get(id);
    if (!entry) {
      return;
    }
    const backgroundPath = this.mainPath ?? this._getBackgroundPath(entry);
    // A contact change, such as a new call opening its apps, is not the user
    // leaving the page: the router stays where it is, or goes where the call
    // sends it. Routing to the page's background from the port that closed
    // the tab would land after, and undo, the call page navigation.
    const decision: RouteCloseDecision =
      reason === 'contactChange'
        ? { type: 'stay' }
        : decideRouteClose({
            currentPath: this._router.currentPath,
            requestedPath: this._requestedPath,
            pagePath: entry.path,
            backgroundPath,
            nextRoutedPath: nextTabId
              ? (this._entries.get(nextTabId)?.path ?? null)
              : null,
          });
    this._entries.delete(id);
    this._closedPaths.set(id, {
      backgroundPath,
      path: entry.path,
      shouldNavigateToBackground: decision.type !== 'stay',
      routerLeft: this._closingLeftPage,
    });
    if (decision.type === 'handOver') {
      this._requestedPath = decision.requestedPath;
    } else if (decision.type === 'toBackground') {
      // The parked page stays until the router lands on it (`syncPath` drops
      // it on `showMainPage`). Dropping it first would render the routed
      // page's own background for a frame in between.
      await this._navigate(decision.backgroundPath);
    }
  }

  private async _completeRouteClose(id: string): Promise<void> {
    const closedEntry = this._closedPaths.get(id);
    if (!closedEntry) {
      return;
    }
    const backgroundPath = decideCloseCompletion({
      currentPath: this._router.currentPath,
      navigated: closedEntry.shouldNavigateToBackground,
      backgroundPath: closedEntry.backgroundPath,
    });
    if (backgroundPath) {
      await this._navigate(backgroundPath);
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
