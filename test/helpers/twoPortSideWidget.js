/**
 * A server and a client port of the side widget, as in the shared-worker app.
 *
 * The server owns the synced state. After a server operation, the fields it
 * changed are copied to the client, as a shared-app state patch would; a
 * client-only change stays until the server changes that field. Methods
 * delegated to the server run on the server port. Both ports share the router
 * and `Root`, which the app keeps in sync, and the client renders the route
 * of the current path, which the server never does.
 *
 * Requires the test to mock `@ringcentral-integration/micro-core` components
 * and `../src/app/views/ExpandedView`.
 */
const {
  SideWidgetView,
} = require('../../src/app/views/SideWidgetView/SideWidget.view');
const {
  RoutedSideWidgetView,
} = require('../../src/app/views/RoutedSideWidgetView/RoutedSideWidget.view');
const { matchPath } = require('react-router-dom');

const SIDE_WIDGET_STATE = ['tabs', 'currentTabId', 'selectedAppId', 'currentContact'];
const SERVER_DELEGATES = [
  '_closeOnServer',
  '_closeTabOnServer',
  '_selectTabOnServer',
  '_selectAppOnServer',
  '_showAppsOnServer',
  '_toggleAppPinOnServer',
];

function createExpandedView(root) {
  const handles = new Map();
  return {
    activeContentId: null,
    isOpen: false,
    create(options) {
      const handle = { options };
      handles.set(options.id, handle);
      return handle;
    },
    open(handle, { expand = true } = {}) {
      this.activeContentId = handle.options.id;
      this.isOpen = true;
      if (expand) {
        root.setExpanded(true);
      }
    },
    close(handle, { collapseLayout = true } = {}) {
      const active = handles.get(this.activeContentId);
      if (handle && handle !== active) {
        return Promise.resolve();
      }
      this.activeContentId = null;
      this.isOpen = false;
      if (collapseLayout) {
        root.setExpanded(false);
      }
      active?.options.onClose?.();
      return Promise.resolve();
    },
  };
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createTwoPortSideWidget({
  initialPath = '/dialer',
  expanded = true,
  routes = [],
  resolveContact = () => undefined,
} = {}) {
  const root = {
    expanded,
    setExpanded(value) {
      root.expanded = value;
    },
  };
  let onRouteChange = () => {};
  const history = [initialPath];
  const router = {
    currentPath: initialPath,
    history,
    push: jest.fn(async (path) => {
      history.push(path);
      onRouteChange(path);
    }),
    replace: jest.fn(async (path) => {
      history[history.length - 1] = path;
      onRouteChange(path);
    }),
    goBack: jest.fn(async () => {
      history.pop();
      onRouteChange(history[history.length - 1]);
    }),
  };
  const thirdParty = {
    apps: [],
    pinAppIds: [],
    toggleAppPin: jest.fn(),
    loadAppPage: jest.fn(),
  };

  function createPort(role) {
    const expandedView = createExpandedView(root);
    const sideWidgetView = new SideWidgetView(
      expandedView,
      thirdParty,
      { themeType: 'light' },
      { enableSideWidget: true },
      root,
    );
    const routedSideWidgetView = new RoutedSideWidgetView(
      sideWidgetView,
      router,
      root,
    );
    routedSideWidgetView.registerRoutes(routes, resolveContact);
    return { expandedView, role, routedSideWidgetView, sideWidgetView };
  }

  const server = createPort('server');
  const client = createPort('client');

  function snapshot() {
    return {
      side: SIDE_WIDGET_STATE.map((key) => server.sideWidgetView[key]),
      expanded: [server.expandedView.activeContentId, server.expandedView.isOpen],
      mainPath: server.routedSideWidgetView.mainPath,
    };
  }

  function applyPatch(before) {
    SIDE_WIDGET_STATE.forEach((key, index) => {
      if (server.sideWidgetView[key] !== before.side[index]) {
        client.sideWidgetView[key] = server.sideWidgetView[key];
      }
    });
    if (server.expandedView.activeContentId !== before.expanded[0]) {
      client.expandedView.activeContentId = server.expandedView.activeContentId;
    }
    if (server.expandedView.isOpen !== before.expanded[1]) {
      client.expandedView.isOpen = server.expandedView.isOpen;
    }
    if (server.routedSideWidgetView.mainPath !== before.mainPath) {
      client.routedSideWidgetView.mainPath = server.routedSideWidgetView.mainPath;
    }
  }

  /** Runs a server operation and sends the state it changed to the client. */
  async function onServer(operation) {
    const before = snapshot();
    const result = await operation();
    await flush();
    applyPatch(before);
    return result;
  }

  SERVER_DELEGATES.forEach((name) => {
    if (typeof client.sideWidgetView[name] === 'function') {
      client.sideWidgetView[name] = (...args) =>
        onServer(() => server.sideWidgetView[name](...args));
    }
  });
  client.routedSideWidgetView.navigateMain = (path) =>
    onServer(() => server.routedSideWidgetView.navigateMain(path));

  function findRoute(path) {
    return routes.find(({ routePath, routeExact }) =>
      matchPath(path, { exact: routeExact, path: routePath }),
    );
  }

  onRouteChange = (path) => {
    router.currentPath = path;
    const before = snapshot();
    // The router watcher of each port, then the client's rendered route and
    // its AppView route sync.
    server.routedSideWidgetView._syncRegisteredPath(path);
    applyPatch(before);
    client.routedSideWidgetView._syncRegisteredPath(path);
    const route = findRoute(path);
    if (route) {
      const params =
        matchPath(path, { exact: route.routeExact, path: route.routePath })
          ?.params ?? {};
      const contact = resolveContact(route.config.id, params);
      client.routedSideWidgetView.open({
        config: route.config,
        ...(contact === undefined ? {} : { contact }),
        detailComponent: () => null,
        detailProps: {},
        expand: root.expanded,
        path,
        routeExact: route.routeExact,
        routePath: route.routePath,
      });
    }
    client.routedSideWidgetView.syncPath(path, Boolean(route));
  };

  /** A contact the app loaded; each port's contact watcher applies it. */
  async function applyResolvedContacts() {
    await onServer(() => server.routedSideWidgetView._applyResolvedContact());
    client.routedSideWidgetView._applyResolvedContact();
  }

  function tabIds(port) {
    return port.sideWidgetView.tabs.map(({ id }) => id);
  }

  async function settle() {
    for (let index = 0; index < 5; index += 1) {
      await flush();
    }
  }

  return {
    applyResolvedContacts,
    client,
    onServer,
    root,
    router,
    server,
    settle,
    tabIds,
  };
}

module.exports = { createTwoPortSideWidget };
