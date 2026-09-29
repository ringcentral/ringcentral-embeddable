import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@ringcentral-integration/next-core', () => {
  const directDecorator = (_target, _key, descriptor) => descriptor;

  return {
    ...jest.requireActual('../test/mocks/nextCoreMock'),
    Root: class Root {},
    RouterPlugin: class RouterPlugin {},
    autobind: directDecorator,
    delegate: () => directDecorator,
    computed: (...args) =>
      args.length === 3 ? directDecorator(...args) : directDecorator,
    injectable: () => (target) => target,
    optional: () => () => {},
    useConnector: (selector) => selector(),
  };
});

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: () => null,
}));

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: ({ children }) => children,
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  SyncTabView: class SyncTabView {},
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring',
  () => ({ ConversationsViewSpring: class ConversationsViewSpring {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring',
  () => ({ CallsListViewSpring: class CallsListViewSpring {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/DialerView',
  () => ({ DialerView: class DialerView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/DialerPadView',
  () => {
    const React = jest.requireActual('react');

    return {
      DialerPadView: class DialerPadView {
        get tabs() {
          return [];
        }

        component() {
          return React.createElement('div', {
            className:
              '[&_.sui-tab]:max-w-none [&_.sui-tab]:flex-grow',
            variant: 'scrollable',
          });
        }
      },
    };
  },
);

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({ t: (key) => key }),
}));

jest.mock('../src/app/views/CallHUDView', () => ({
  CallHUDView: class CallHUDView {},
}));

jest.mock('../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

import { DialerPadView } from '../src/app/views/DialerPadView/DialerPad.view';

function createView({ enableSideWidget = true, fitsExpandedLayout = true } = {}) {
  return new DialerPadView(
    {},
    { hasHUDPermission: false },
    {},
    {},
    {},
    {},
    {},
    {},
    { expanded: false, setExpanded: jest.fn() },
    { showCallHUD: false },
    { enabled: enableSideWidget },
    { fitsExpandedLayout },
  );
}

function renderExpandHeader(view) {
  const ExpandHeader = () => view.ExpandHeader();
  render(<ExpandHeader />);
}

describe('DialerPadView', () => {
  test('shows the side widget toggle when the side widget is enabled', () => {
    renderExpandHeader(createView({ enableSideWidget: true }));

    expect(
      document.querySelector('[data-sign="toggleExpanded"]'),
    ).toBeInTheDocument();
  });

  test('hides the side widget toggle without enableSideWidget, like legacy', () => {
    renderExpandHeader(createView({ enableSideWidget: false }));

    expect(document.querySelector('[data-sign="toggleExpanded"]')).toBeNull();
    expect(screen.queryByText('collapse')).toBeNull();
  });

  test('hides the side widget toggle when the window is too narrow to expand', () => {
    renderExpandHeader(createView({ fitsExpandedLayout: false }));

    expect(document.querySelector('[data-sign="toggleExpanded"]')).toBeNull();
  });

  test('uses compact tabs in a non-scrolling Phone page container', () => {
    const view = createView();
    const component = view.component({});
    const tabComponent = React.Children.only(component.props.children);

    expect(component.props.className).toContain('overflow-hidden');
    expect(tabComponent.props.variant).toBe('moreMenu');
    expect(tabComponent.props.className).toBeUndefined();
  });
});
