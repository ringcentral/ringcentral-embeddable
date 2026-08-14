import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  HeaderNavViewSpring: class HeaderNavViewSpring {
    constructor(locale, router, options) {
      this._locale = locale;
      this._router = router;
      this._headerNavViewOptions = options;
    }

    get dialTab() {
      return { title: 'Phone', to: '/dialer' };
    }

    get textTab() {
      return { title: 'Text', to: '/messages' };
    }

    get faxTab() {
      return { title: 'Fax', to: '/fax' };
    }

    get settingsTab() {
      return { title: 'Settings', to: '/settings' };
    }
  },
}));

jest.mock(
  '../../next/app/views/HeaderNavView/components/HeaderNavWithOverflow',
  () => ({
    HeaderNavWithOverflow: () => null,
  }),
);

jest.mock('../../next/app/views/RoutedSideWidgetView', () => ({
  RoutedSideWidgetView: class RoutedSideWidgetView {},
}));

import { HeaderNavViewSpring } from '../../next/app/views/HeaderNavView';

describe('customized tabs navigation', () => {
  function createView() {
    const router = {
      currentPath: '/customizedTabs/dark-tab',
      push: jest.fn(),
    };
    const thirdParty = {
      customizedTabs: [
        {
          id: 'first-tab',
          label: 'First',
          iconUri: 'first.svg',
          path: '/customizedTabs/first-tab',
          priority: 0,
          unreadCount: 3,
          actions: [],
        },
        {
          id: 'dark-tab',
          label: 'Dark',
          iconUri: 'light.svg',
          darkIconUri: 'dark.svg',
          activeIconUri: 'active.svg',
          path: '/customizedTabs/dark-tab',
          priority: 31,
          unreadCount: 12,
          actions: [],
        },
        {
          id: 'hidden-tab',
          label: 'Hidden',
          path: '/customizedTabs/hidden-tab',
          priority: 1,
          hidden: true,
          actions: [],
        },
        {
          id: 'last-tab',
          path: '/customizedTabs/last-tab',
          actions: [],
        },
      ],
    };
    const routedSideWidgetView = { navigateMain: jest.fn() };
    const view = new HeaderNavViewSpring(
      {},
      router,
      { isRCV: true },
      thirdParty,
      { themeType: 'dark' },
      routedSideWidgetView,
      { enableVideoTab: true },
    );
    view._appFeatures = {
      isCallingEnabled: true,
      hasReadExtensionCallLog: true,
      hasReadTextPermission: true,
      hasReadFaxPermission: true,
      hasMeetingsPermission: true,
      isContactsEnabled: true,
    };
    return { routedSideWidgetView, view };
  }

  test('merges visible custom tabs by priority with badges and active state', () => {
    const tabs = createView().view.tabs;

    expect(tabs.map(({ to }) => to)).toEqual([
      '/customizedTabs/first-tab',
      '/dialer',
      '/messages',
      '/contacts',
      '/customizedTabs/dark-tab',
      '/meeting',
      '/fax',
      '/settings',
      '/customizedTabs/last-tab',
    ]);
    expect(
      tabs.find(({ to }) => to === '/customizedTabs/hidden-tab'),
    ).toBeUndefined();
    expect(
      tabs.find(({ to }) => to === '/customizedTabs/dark-tab'),
    ).toEqual(
      expect.objectContaining({
        title: 'Dark',
        active: true,
        BadgeProps: {
          count: 12,
          max: 99,
        },
      }),
    );
    expect(
      tabs.find(({ to }) => to === '/customizedTabs/last-tab').title,
    ).toBe('last-tab');
  });

  test('uses theme and active image URLs and hides a failed remote icon', () => {
    const tab = createView().view.tabs.find(
      ({ to }) => to === '/customizedTabs/dark-tab',
    );
    const InactiveIcon = tab.symbol;
    const ActiveIcon = tab.activeSymbol;
    const inactive = render(<InactiveIcon className="custom-icon" />);
    const active = render(<ActiveIcon />);
    const inactiveImage = inactive.container.querySelector('img');
    const activeImage = active.container.querySelector('img');

    expect(inactiveImage).toHaveAttribute('src', 'dark.svg');
    expect(activeImage).toHaveAttribute('src', 'active.svg');
    expect(inactiveImage.style.height).toBe('');
    expect(inactiveImage.style.width).toBe('');

    fireEvent.error(inactiveImage);
    expect(inactive.container.querySelector('img')).toBeNull();
  });

  test('keeps routed side-widget content when changing main tabs', () => {
    const { routedSideWidgetView, view } = createView();

    view.getUIFunctions().onChange('/messages');

    expect(routedSideWidgetView.navigateMain).toHaveBeenCalledWith(
      '/messages',
    );
  });
});
