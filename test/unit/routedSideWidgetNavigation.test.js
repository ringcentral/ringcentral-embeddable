import {
  decideCloseCompletion,
  decideMainColumnAfterFinish,
  decideMainNavigation,
  decideOpenerParking,
  decideRouteChange,
  decideRouteClose,
  resolveMainColumnPath,
} from '../../src/app/views/RoutedSideWidgetView/RoutedSideWidget.navigation';

const callDetails = {
  id: 'call-details',
  path: '/history/call-1',
  backgroundPaths: ['/dialer'],
  closeWhenLeft: false,
  collapseWhenLeft: false,
};

const logCall = {
  id: 'log-call',
  path: '/log/call/call-1',
  backgroundPaths: ['/dialer', '/history'],
  closeWhenLeft: true,
  collapseWhenLeft: false,
};

const disposition = {
  id: 'cx-disposition',
  path: '/agent/calls/uii/disposition',
  backgroundPaths: ['/agent/home/dialer'],
  closeWhenLeft: true,
  collapseWhenLeft: true,
};

function change(overrides = {}) {
  return {
    path: '/messages',
    previousPath: null,
    isTabActivation: false,
    isRoutedPath: false,
    pages: [],
    currentTabId: 'side-widget-apps',
    expanded: true,
    mainPath: null,
    ownsRouter: (path) => path.startsWith('/agent/home'),
    ...overrides,
  };
}

describe('decideRouteChange', () => {
  describe('the router moved to an open routed page', () => {
    test('does nothing when its tab is already active', () => {
      expect(
        decideRouteChange(
          change({
            path: callDetails.path,
            isRoutedPath: true,
            pages: [callDetails],
            currentTabId: 'call-details',
          }),
        ),
      ).toEqual({ type: 'none' });
    });

    test('selects its tab otherwise', () => {
      expect(
        decideRouteChange(
          change({
            path: callDetails.path,
            isRoutedPath: true,
            pages: [callDetails],
          }),
        ),
      ).toEqual({ type: 'selectPage', pageId: 'call-details' });
    });
  });

  test('leaves a routed page not open yet to open itself', () => {
    expect(
      decideRouteChange(change({ path: '/history/call-2', isRoutedPath: true })),
    ).toEqual({ type: 'none' });
  });

  describe('the router left a form page', () => {
    test('finishes it when it returns to its background, keeping a docked drawer', () => {
      expect(
        decideRouteChange(
          change({
            path: '/history',
            previousPath: logCall.path,
            pages: [logCall],
            currentTabId: 'log-call',
          }),
        ),
      ).toEqual({
        type: 'finishLeftPage',
        pageId: 'log-call',
        selectPageId: null,
        collapseWhenLast: false,
        handedOver: false,
        returnedToBackground: true,
      });
    });

    test('folds the drawer for a page the app opened on its own', () => {
      expect(
        decideRouteChange(
          change({
            path: '/agent/home/dialer',
            previousPath: disposition.path,
            pages: [disposition],
            currentTabId: 'cx-disposition',
          }),
        ),
      ).toMatchObject({ type: 'finishLeftPage', collapseWhenLast: true });
    });

    test('closes a folded overlay on any navigation', () => {
      expect(
        decideRouteChange(
          change({
            path: '/messages',
            previousPath: logCall.path,
            pages: [logCall],
            currentTabId: 'log-call',
            expanded: false,
          }),
        ),
      ).toMatchObject({
        type: 'finishLeftPage',
        collapseWhenLast: true,
        returnedToBackground: false,
      });
    });

    test('hands over to the routed page that took over, selecting it first', () => {
      expect(
        decideRouteChange(
          change({
            path: callDetails.path,
            previousPath: logCall.path,
            isRoutedPath: true,
            pages: [logCall, callDetails],
            currentTabId: 'log-call',
          }),
        ),
      ).toMatchObject({
        type: 'finishLeftPage',
        pageId: 'log-call',
        selectPageId: 'call-details',
        handedOver: true,
      });
    });

    test('finishes it for a route that owns the router', () => {
      expect(
        decideRouteChange(
          change({
            path: '/agent/home/history',
            previousPath: logCall.path,
            pages: [logCall],
            currentTabId: 'log-call',
          }),
        ),
      ).toMatchObject({ type: 'finishLeftPage', pageId: 'log-call' });
    });

    test('keeps a docked form when the user only switches the main page', () => {
      expect(
        decideRouteChange(
          change({
            path: '/messages',
            previousPath: logCall.path,
            pages: [logCall],
            currentTabId: 'log-call',
          }),
        ),
      ).toEqual({
        type: 'keepDockedPage',
        pageId: 'log-call',
        pagePath: logCall.path,
        mainPath: '/messages',
      });
    });

    test('ignores a move the side widget asked for to switch tabs', () => {
      expect(
        decideRouteChange(
          change({
            path: callDetails.path,
            previousPath: logCall.path,
            isTabActivation: true,
            isRoutedPath: true,
            pages: [logCall, callDetails],
            currentTabId: 'log-call',
          }),
        ),
      ).toEqual({ type: 'selectPage', pageId: 'call-details' });
    });
  });

  describe('the router moved to a main page', () => {
    test('keeps the docked page and parks the new page, for a host navigation', () => {
      expect(
        decideRouteChange(
          change({
            path: '/contacts',
            pages: [callDetails],
            currentTabId: 'call-details',
          }),
        ),
      ).toEqual({
        type: 'keepDockedPage',
        pageId: 'call-details',
        pagePath: callDetails.path,
        mainPath: '/contacts',
      });
    });

    test('returns to the parked page when the active page goes to its background', () => {
      expect(
        decideRouteChange(
          change({
            path: '/dialer',
            pages: [callDetails],
            currentTabId: 'call-details',
            mainPath: '/contacts',
          }),
        ),
      ).toEqual({
        type: 'returnToParkedPage',
        pageId: 'call-details',
        collapseWhenLast: false,
        mainPath: '/contacts',
      });
    });

    test('closes the active page when it returns to its background', () => {
      expect(
        decideRouteChange(
          change({
            path: '/dialer',
            pages: [callDetails],
            currentTabId: 'call-details',
          }),
        ),
      ).toEqual({
        type: 'showMainPage',
        closePage: { pageId: 'call-details', collapseWhenLast: false },
      });
    });

    test('closes the active page for a route that owns the router, even docked', () => {
      expect(
        decideRouteChange(
          change({
            path: '/agent/home/history',
            pages: [callDetails],
            currentTabId: 'call-details',
          }),
        ),
      ).toEqual({
        type: 'showMainPage',
        closePage: { pageId: 'call-details', collapseWhenLast: false },
      });
    });

    test('closes the active page and the overlay when folded', () => {
      expect(
        decideRouteChange(
          change({
            path: '/contacts',
            pages: [callDetails],
            currentTabId: 'call-details',
            expanded: false,
          }),
        ),
      ).toEqual({
        type: 'showMainPage',
        closePage: { pageId: 'call-details', collapseWhenLast: true },
      });
    });

    test('has nothing to close without an active routed page', () => {
      expect(
        decideRouteChange(change({ path: '/contacts', pages: [callDetails] })),
      ).toEqual({ type: 'showMainPage', closePage: null });
    });
  });
});

describe('decideMainColumnAfterFinish', () => {
  const finished = {
    path: '/history',
    parkedMainPath: null,
    returnedToBackground: true,
    expanded: true,
    nextTabIsRouted: false,
    ownsRouter: (path) => path.startsWith('/agent/home'),
  };

  test('shows the page the router returned to', () => {
    expect(decideMainColumnAfterFinish(finished)).toEqual({
      type: 'show',
      mainPath: '/history',
    });
  });

  test('keeps the page the user switched to over the form’s background', () => {
    expect(
      decideMainColumnAfterFinish({ ...finished, parkedMainPath: '/contacts' }),
    ).toEqual({ type: 'show', mainPath: '/contacts' });
  });

  test('parks the main page while the next routed tab owns the router', () => {
    expect(
      decideMainColumnAfterFinish({ ...finished, nextTabIsRouted: true }),
    ).toEqual({ type: 'park', mainPath: '/history' });
  });

  test('cannot park a page that owns the router', () => {
    expect(
      decideMainColumnAfterFinish({
        ...finished,
        path: '/agent/home/dialer',
        nextTabIsRouted: true,
      }),
    ).toEqual({ type: 'show', mainPath: '/agent/home/dialer' });
  });

  test('does not park while the drawer is folded', () => {
    expect(
      decideMainColumnAfterFinish({
        ...finished,
        expanded: false,
        nextTabIsRouted: true,
      }),
    ).toEqual({ type: 'show', mainPath: '/history' });
  });
});

describe('decideRouteClose', () => {
  const closing = {
    currentPath: '/history/call-1',
    requestedPath: null,
    pagePath: '/history/call-1',
    backgroundPath: '/dialer',
    nextRoutedPath: null,
  };

  test('routes to the background page when nothing routed takes over', () => {
    expect(decideRouteClose(closing)).toEqual({
      type: 'toBackground',
      backgroundPath: '/dialer',
    });
  });

  test('lets the next routed tab take the router', () => {
    expect(
      decideRouteClose({
        ...closing,
        nextRoutedPath: '/conversations/conversation-1',
      }),
    ).toEqual({
      type: 'handOver',
      requestedPath: '/conversations/conversation-1',
    });
  });

  test('also routes when the router is heading to the page', () => {
    expect(
      decideRouteClose({
        ...closing,
        currentPath: '/messages',
        requestedPath: '/history/call-1',
      }),
    ).toMatchObject({ type: 'toBackground' });
  });

  test('stays when the router is on another page', () => {
    expect(
      decideRouteClose({ ...closing, currentPath: '/conversations/c-2' }),
    ).toEqual({ type: 'stay' });
  });
});

describe('decideMainNavigation', () => {
  const navigation = {
    path: '/contacts',
    currentPath: '/history/call-1',
    hasActiveRoutedPage: true,
    expanded: true,
    ownsRouter: (path) => path.startsWith('/agent'),
  };

  test('parks the page next to a docked routed page', () => {
    expect(decideMainNavigation(navigation)).toEqual({ type: 'park' });
  });

  test('routes when folded, without a routed page, or to a router-owning page', () => {
    expect(decideMainNavigation({ ...navigation, expanded: false })).toEqual({
      type: 'push',
    });
    expect(
      decideMainNavigation({ ...navigation, hasActiveRoutedPage: false }),
    ).toEqual({ type: 'push' });
    expect(decideMainNavigation({ ...navigation, path: '/agent' })).toEqual({
      type: 'push',
    });
  });

  test('does nothing for the page already shown', () => {
    expect(
      decideMainNavigation({ ...navigation, path: '/history/call-1' }),
    ).toEqual({ type: 'none' });
  });
});

describe('decideOpenerParking', () => {
  const opening = {
    mainPath: null,
    openerPath: '/history',
    preserveBackground: false,
    backgroundPaths: ['/dialer'],
    ownsRouter: (path) => path.startsWith('/agent'),
  };

  test('parks the page the routed page was opened from', () => {
    expect(decideOpenerParking(opening)).toBe('/history');
  });

  test('parks nothing when the opener already is the background', () => {
    expect(
      decideOpenerParking({ ...opening, openerPath: '/dialer' }),
    ).toBeNull();
  });

  test('parks nothing over a parked page, for preserved backgrounds, or router owners', () => {
    expect(decideOpenerParking({ ...opening, mainPath: '/contacts' })).toBeNull();
    expect(
      decideOpenerParking({ ...opening, preserveBackground: true }),
    ).toBeNull();
    expect(decideOpenerParking({ ...opening, openerPath: '/agent' })).toBeNull();
    expect(decideOpenerParking({ ...opening, openerPath: null })).toBeNull();
  });
});

describe('decideCloseCompletion', () => {
  test('routes to the background when the close aimed there but did not land', () => {
    expect(
      decideCloseCompletion({
        currentPath: '/history/call-1',
        navigated: true,
        backgroundPath: '/dialer',
      }),
    ).toBe('/dialer');
  });

  test('leaves the router alone once there, or when the close stayed', () => {
    expect(
      decideCloseCompletion({
        currentPath: '/dialer',
        navigated: true,
        backgroundPath: '/dialer',
      }),
    ).toBeNull();
    expect(
      decideCloseCompletion({
        currentPath: '/history/call-1',
        navigated: false,
        backgroundPath: '/dialer',
      }),
    ).toBeNull();
  });
});

describe('resolveMainColumnPath', () => {
  const routedPage = {
    backgroundPath: '/dialer',
    preserveBackground: false,
    rendersOwnBackground: false,
  };
  const preservedPage = {
    backgroundPath: '/dialer',
    preserveBackground: true,
    rendersOwnBackground: false,
  };

  test('renders a main route itself, even with a stale parked page', () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/contacts',
        mainPath: '/messages',
        routedPage: null,
        lastMainPath: '/messages',
      }),
    ).toBe('/contacts');
  });

  test('renders the parked page behind a routed page', () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/history/call-1',
        mainPath: '/agent/home',
        routedPage,
        lastMainPath: '/dialer',
      }),
    ).toBe('/agent/home');
  });

  test("renders a routed page's own background when nothing is parked", () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/history/call-1',
        mainPath: null,
        routedPage,
        lastMainPath: '/messages',
      }),
    ).toBe('/dialer');
  });

  test('keeps the page a preserved page was opened from', () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/customized/crm-details',
        mainPath: null,
        routedPage: preservedPage,
        lastMainPath: '/messages',
      }),
    ).toBe('/messages');
  });

  test('falls back to the background when no main page preceded a preserved page', () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/log/call/call-1',
        mainPath: null,
        routedPage: preservedPage,
        lastMainPath: null,
      }),
    ).toBe('/dialer');
  });

  test('stays on a route that renders its own background', () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/extension/page-1',
        mainPath: null,
        routedPage: { ...routedPage, rendersOwnBackground: true },
        lastMainPath: '/messages',
      }),
    ).toBe('/extension/page-1');
  });

  test('renders a parked page over a route with its own background', () => {
    expect(
      resolveMainColumnPath({
        currentPath: '/extension/page-1',
        mainPath: '/contacts',
        routedPage: { ...routedPage, rendersOwnBackground: true },
        lastMainPath: '/messages',
      }),
    ).toBe('/contacts');
  });
});
