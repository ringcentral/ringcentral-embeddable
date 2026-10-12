import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  Accordion: ({ header, children }) => (
    <section>
      {header}
      {children}
    </section>
  ),
  AccordionHeader: ({ children }) => <h3>{children}</h3>,
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
}));

jest.mock(
  '@ringcentral-integration/micro-auth/src/app/services/AppFeatures',
  () => ({ AppFeatures: class AppFeatures {} }),
);

jest.mock('../../src/app/services/MonitoredExtensions', () => ({
  MonitoredExtensions: class MonitoredExtensions {},
}));

jest.mock('../../src/app/views/CallHUDView/AddExtensionDialog', () => ({
  AddExtensionContent: () => null,
}));

jest.mock('../../src/app/views/CallHUDView/SearchAndFilter', () => ({
  SearchAndFilter: () => <div data-sign="searchAndFilter" />,
}));

jest.mock('../../src/app/views/CallHUDView/i18n', () => {
  const enUS = jest.requireActual(
    '../../src/app/views/CallHUDView/i18n/en-US',
  ).default;
  return {
    __esModule: true,
    default: {},
    t: (key) => enUS[key] ?? key,
  };
});

jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

const { CallHUDView } = require('../../src/app/views/CallHUDView/CallHUD.view');

function createView() {
  const handle = {};
  const sideWidgetView = {
    isOpen: false,
    tabs: [],
    createContent: jest.fn((options) => {
      handle.options = options;
      return handle;
    }),
    openContent: jest.fn(() => {
      sideWidgetView.isOpen = true;
      sideWidgetView.tabs = [{ id: 'call-hud', name: 'HUD', scope: 'global' }];
    }),
    closeContent: jest.fn(() => {
      sideWidgetView.tabs = [];
    }),
  };
  const modalView = { create: jest.fn(() => ({})), open: jest.fn() };
  const monitoredExtensions = {
    monitoredExtensions: [],
    parkLocations: [],
    groupCallPickupList: [],
    callQueuePickupList: [],
  };
  const view = new CallHUDView(
    { expanded: true },
    monitoredExtensions,
    { activeSession: null },
    { isIdle: true },
    { formatNumber: (value) => value },
    { hasHUDPermission: true, hasEditMonitoredExtensionsPermission: true },
    { fromNumber: '+16505550100' },
    { data: [] },
    { accessToken: 'token' },
    { id: 1 },
    { push: jest.fn() },
    modalView,
    sideWidgetView,
  );
  return { handle, sideWidgetView, view };
}

describe('CallHUDView', () => {
  test('registers HUD as a global side widget tab with a localized name', () => {
    const { handle } = createView();

    expect(handle.options).toEqual(
      expect.objectContaining({ id: 'call-hud', name: 'HUD', scope: 'global' }),
    );
    expect(handle.options.getName()).toBe('HUD');
  });

  test('toggles the HUD tab and reports it from the side widget state', async () => {
    const { handle, sideWidgetView, view } = createView();
    expect(view.showCallHUD).toBe(false);

    await view.toggleCallHUD();
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle);
    expect(view.showCallHUD).toBe(true);

    await view.toggleCallHUD();
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(handle);
    expect(view.showCallHUD).toBe(false);
  });

  test('is not shown while the drawer is not the expanded content', () => {
    const { sideWidgetView, view } = createView();
    sideWidgetView.tabs = [{ id: 'call-hud', name: 'HUD', scope: 'global' }];
    sideWidgetView.isOpen = false;

    expect(view.showCallHUD).toBe(false);
  });

  test('renders its own title and close button only as the only tab', async () => {
    const { handle, sideWidgetView } = createView();
    const Content = handle.options.view;

    const { rerender } = render(<Content showCloseButton />);
    expect(screen.getByText('HUD')).toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-sign="callHUDClose"]'));
    await Promise.resolve();
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(handle);

    rerender(<Content showCloseButton={false} />);
    expect(document.querySelector('[data-sign="callHUDHeader"]')).toBeNull();
  });
});
