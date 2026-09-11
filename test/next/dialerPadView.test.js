import React from 'react';

jest.mock('@ringcentral-integration/next-core', () => {
  const directDecorator = (_target, _key, descriptor) => descriptor;

  return {
    Root: class Root {},
    RouterPlugin: class RouterPlugin {},
    autobind: directDecorator,
    computed: (...args) =>
      args.length === 3 ? directDecorator(...args) : directDecorator,
    injectable: () => (target) => target,
    optional: () => () => {},
    useConnector: (selector) => selector(),
  };
});

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

jest.mock('../../next/app/views/CallHUDView', () => ({
  CallHUDView: class CallHUDView {},
}));

import { DialerPadView } from '../../next/app/views/DialerPadView/DialerPad.view';

describe('DialerPadView', () => {
  test('uses compact tabs in a non-scrolling Phone page container', () => {
    const view = new DialerPadView({}, {}, {}, {}, {}, {}, {}, {}, {}, {});
    const component = view.component({});
    const tabComponent = React.Children.only(component.props.children);

    expect(component.props.className).toContain('overflow-hidden');
    expect(tabComponent.props.variant).toBe('moreMenu');
    expect(tabComponent.props.className).toBeUndefined();
  });
});
