/** A routed page open in a side widget tab, as route decisions see it. */
export interface RoutedPage {
  id: string;
  path: string;
  /** The paths that count as the page's background. */
  backgroundPaths: readonly string[];
  /** Leaving the page finishes it, like a form's back, save or send. */
  closeWhenLeft: boolean;
  /** The app opened the page on its own, so returning folds an empty drawer. */
  collapseWhenLeft: boolean;
}

export interface RouteChange {
  path: string;
  previousPath: string | null;
  /** The router moved for a tab switch the side widget asked for. */
  isTabActivation: boolean;
  /** The new path is a routed side widget page. */
  isRoutedPath: boolean;
  pages: readonly RoutedPage[];
  currentTabId: string;
  /** Whether the drawer is docked in the expanded layout. */
  expanded: boolean;
  /** The page parked in the main column while a routed page owns the router. */
  mainPath: string | null;
  /** Whether a path renders its own router, so it cannot be parked. */
  ownsRouter: (path: string) => boolean;
}

export type RouteChangeDecision =
  /** Nothing to do: the tab already shows the page, or it opens on its own. */
  | { type: 'none' }
  /** Select the tab of the page the router moved to. */
  | { type: 'selectPage'; pageId: string }
  /**
   * Finish the form page the router left. When another routed page took
   * over (`handedOver`), select it first; otherwise the main column is
   * settled once the page closed, see {@link decideMainColumnAfterFinish}.
   */
  | {
      type: 'finishLeftPage';
      pageId: string;
      selectPageId: string | null;
      collapseWhenLast: boolean;
      handedOver: boolean;
      returnedToBackground: boolean;
    }
  /**
   * The main page changed another way than the navigation bar, such as a
   * host navigation: park it in the main column and route back to the docked
   * page, like `navigateMain` does.
   */
  | { type: 'keepDockedPage'; pageId: string; pagePath: string; mainPath: string }
  /**
   * The active page returned to its background while the user had parked
   * another page in the main column: close the tab and route to that page.
   */
  | {
      type: 'returnToParkedPage';
      pageId: string;
      collapseWhenLast: boolean;
      mainPath: string;
    }
  /**
   * The router is on a main page: drop a parked page, and close the active
   * routed tab the router left, if any.
   */
  | {
      type: 'showMainPage';
      closePage: { pageId: string; collapseWhenLast: boolean } | null;
    };

function isBackgroundPath(page: RoutedPage, path: string): boolean {
  return page.backgroundPaths.includes(path);
}

/**
 * Whether leaving a `closeWhenLeft` page finishes it: a hand-over to another
 * routed page, a return to its background (its back, save or send), a route
 * that owns the router, or any navigation while the drawer is an overlay. A
 * docked page survives the user switching to an unrelated main page.
 */
function isFinishingLeftPage(
  page: RoutedPage,
  { path, expanded, ownsRouter }: RouteChange,
  handedOver: boolean,
): boolean {
  return (
    handedOver || !expanded || isBackgroundPath(page, path) || ownsRouter(path)
  );
}

/** Decides what a router move means for the routed side widget tabs. */
export function decideRouteChange(change: RouteChange): RouteChangeDecision {
  const {
    path,
    previousPath,
    isTabActivation,
    isRoutedPath,
    pages,
    currentTabId,
    expanded,
    mainPath,
    ownsRouter,
  } = change;
  const matchedPage = pages.find((page) => page.path === path);
  const leftPage =
    previousPath && !isTabActivation
      ? pages.find((page) => page.path === previousPath)
      : undefined;
  const handedOver = isRoutedPath || !!matchedPage;
  if (leftPage?.closeWhenLeft && isFinishingLeftPage(leftPage, change, handedOver)) {
    const returnedToBackground = isBackgroundPath(leftPage, path);
    return {
      type: 'finishLeftPage',
      pageId: leftPage.id,
      // Select the page that took over first, so closing the form does not
      // activate some other tab and navigate away from it.
      selectPageId:
        matchedPage && matchedPage.id !== currentTabId ? matchedPage.id : null,
      // A folded drawer is an overlay over the page the router returned to,
      // so it closes when empty instead of covering that page.
      collapseWhenLast:
        !expanded || (leftPage.collapseWhenLeft && returnedToBackground),
      handedOver,
      returnedToBackground,
    };
  }
  if (matchedPage) {
    return matchedPage.id === currentTabId
      ? { type: 'none' }
      : { type: 'selectPage', pageId: matchedPage.id };
  }
  if (isRoutedPath) {
    return { type: 'none' };
  }
  const activePage = pages.find((page) => page.id === currentTabId);
  if (
    activePage &&
    expanded &&
    !isBackgroundPath(activePage, path) &&
    !ownsRouter(path)
  ) {
    return {
      type: 'keepDockedPage',
      pageId: activePage.id,
      pagePath: activePage.path,
      mainPath: path,
    };
  }
  if (
    activePage &&
    mainPath &&
    mainPath !== path &&
    isBackgroundPath(activePage, path)
  ) {
    // A routed page returning to its own background, a submitted
    // disposition for example, would otherwise pull the main column off the
    // page the user switched to while the drawer was open. The tab closes
    // while that page is still parked, so it does not route to its own
    // background.
    return {
      type: 'returnToParkedPage',
      pageId: activePage.id,
      collapseWhenLast: activePage.collapseWhenLeft,
      mainPath,
    };
  }
  // The page returned to its own background, the drawer was folded, or the
  // new page owns the router. Losing the routed page the drawer was showing is
  // not a request to fold it: only the stale tab closes. A page the app opened
  // on its own folds the drawer when it returns to its background, and a
  // folded drawer is an overlay over the page, so it closes when empty.
  return {
    type: 'showMainPage',
    closePage:
      activePage && activePage.path !== path
        ? {
            pageId: activePage.id,
            collapseWhenLast:
              !expanded ||
              (activePage.collapseWhenLeft &&
                isBackgroundPath(activePage, path)),
          }
        : null,
  };
}

export interface FinishedPageMainColumn {
  /** Where the router went after leaving the finished page. */
  path: string;
  /** The page parked in the main column before the page closed. */
  parkedMainPath: string | null;
  returnedToBackground: boolean;
  /** Whether the drawer is docked, after the page closed. */
  expanded: boolean;
  /** Whether the tab active after the close is another routed page. */
  nextTabIsRouted: boolean;
  ownsRouter: (path: string) => boolean;
}

export type FinishedPageMainColumnDecision =
  /** Keep the page parked in the main column; the next routed tab owns the router. */
  | { type: 'park'; mainPath: string }
  /** Show the page in the main column, routing there when it is elsewhere. */
  | { type: 'show'; mainPath: string };

/**
 * Settles the main column once a finished form page closed without another
 * routed page taking over. Returning to its own background while the user had
 * switched the main column elsewhere keeps the page the user switched to.
 */
export function decideMainColumnAfterFinish({
  path,
  parkedMainPath,
  returnedToBackground,
  expanded,
  nextTabIsRouted,
  ownsRouter,
}: FinishedPageMainColumn): FinishedPageMainColumnDecision {
  const mainPath =
    parkedMainPath && returnedToBackground ? parkedMainPath : path;
  if (expanded && nextTabIsRouted && !ownsRouter(mainPath)) {
    return { type: 'park', mainPath };
  }
  return { type: 'show', mainPath };
}

export interface RouteClose {
  currentPath: string;
  /** The path the side widget last asked the router to go to. */
  requestedPath: string | null;
  pagePath: string;
  /** The page parked in the main column, or else the page's own background. */
  backgroundPath: string;
  /** The path of the routed tab active after the close, if it is one. */
  nextRoutedPath: string | null;
}

export type RouteCloseDecision =
  /** The router is elsewhere, so closing the page moves nothing. */
  | { type: 'stay' }
  /** The next routed tab takes the router; its activation routes there. */
  | { type: 'handOver'; requestedPath: string }
  /** Nothing routed takes over: route to the background page. */
  | { type: 'toBackground'; backgroundPath: string };

/** Decides where the router goes when a routed tab closes. */
export function decideRouteClose({
  currentPath,
  requestedPath,
  pagePath,
  backgroundPath,
  nextRoutedPath,
}: RouteClose): RouteCloseDecision {
  const shouldNavigate =
    currentPath === backgroundPath ||
    currentPath === pagePath ||
    requestedPath === pagePath;
  if (!shouldNavigate) {
    return { type: 'stay' };
  }
  if (nextRoutedPath) {
    return { type: 'handOver', requestedPath: nextRoutedPath };
  }
  return { type: 'toBackground', backgroundPath };
}

export interface MainNavigation {
  path: string;
  currentPath: string;
  /** Whether the active tab is a routed page. */
  hasActiveRoutedPage: boolean;
  expanded: boolean;
  ownsRouter: (path: string) => boolean;
}

export type MainNavigationDecision =
  | { type: 'none' }
  /** Show the page in the main column; the docked routed page keeps the router. */
  | { type: 'park' }
  /** Route to the page. */
  | { type: 'push' };

/**
 * Decides how the navigation bar changes the main page. A docked routed page
 * keeps the router, and the new page is parked in the main column; a route
 * that owns the router must see the real location, so it cannot be parked.
 */
export function decideMainNavigation({
  path,
  currentPath,
  hasActiveRoutedPage,
  expanded,
  ownsRouter,
}: MainNavigation): MainNavigationDecision {
  if (!path || currentPath === path) {
    return { type: 'none' };
  }
  if (hasActiveRoutedPage && expanded && !ownsRouter(path)) {
    return { type: 'park' };
  }
  return { type: 'push' };
}

export interface OpenerParking {
  /** The page already parked in the main column. */
  mainPath: string | null;
  /** The main page the user was on when the routed page opened. */
  openerPath: string | null;
  /** The page returns to where it was opened from, so nothing is parked. */
  preserveBackground: boolean;
  /** The paths the routed page's own background renders. */
  backgroundPaths: readonly string[];
  ownsRouter: (path: string) => boolean;
}

/**
 * The main page to park when a routed page opens, so the main column keeps the
 * page the user opened it from, such as the call history a contact record was
 * opened from, rather than switching to the route's own background.
 */
export function decideOpenerParking({
  mainPath,
  openerPath,
  preserveBackground,
  backgroundPaths,
  ownsRouter,
}: OpenerParking): string | null {
  if (
    mainPath ||
    !openerPath ||
    preserveBackground ||
    ownsRouter(openerPath) ||
    backgroundPaths.includes(openerPath)
  ) {
    return null;
  }
  return openerPath;
}

export interface CloseCompletion {
  currentPath: string;
  /** Whether the close routed toward the background page. */
  navigated: boolean;
  backgroundPath: string;
}

/**
 * After the last tab closed and the drawer folded, routes to the background
 * page when the close routed there but the router is elsewhere.
 */
export function decideCloseCompletion({
  currentPath,
  navigated,
  backgroundPath,
}: CloseCompletion): string | null {
  return navigated && currentPath !== backgroundPath ? backgroundPath : null;
}

/** The routed page the router is on, as the main column sees it. */
export interface MainColumnRoutedPage {
  /** The page's background, resolved for its params. */
  backgroundPath: string;
  /** The page keeps the main page it was opened from. */
  preserveBackground: boolean;
  /**
   * The route renders its own background component at its own path, for a
   * background that no main route can show.
   */
  rendersOwnBackground: boolean;
}

export interface MainColumnPathOptions {
  currentPath: string;
  /** The page parked in the main column, if any. */
  mainPath: string | null;
  /** The routed page the router is on, or `null` on a main route. */
  routedPage: MainColumnRoutedPage | null;
  /**
   * The last main page that can be shown behind a routed page, for a page
   * that preserves its background. Pages that close with what they show,
   * such as a call page, are skipped.
   */
  lastMainPath: string | null;
}

/**
 * Resolves the location the main column renders. On a routed side widget page
 * that is the page behind it: the parked page, else the page it preserves,
 * else its own background. The main column then keeps the same route element,
 * so the page behind a routed page is not remounted when it opens or closes.
 *
 * A parked page left over on a main route is stale, so a main route always
 * renders itself.
 */
export function resolveMainColumnPath({
  currentPath,
  mainPath,
  routedPage,
  lastMainPath,
}: MainColumnPathOptions): string {
  if (!routedPage) {
    return currentPath;
  }
  if (mainPath) {
    return mainPath;
  }
  if (routedPage.rendersOwnBackground) {
    return currentPath;
  }
  if (routedPage.preserveBackground) {
    return lastMainPath ?? routedPage.backgroundPath;
  }
  return routedPage.backgroundPath;
}
