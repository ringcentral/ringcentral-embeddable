import React from 'react';

jest.mock('@ringcentral-integration/next-core', () => ({
  PortManager: class PortManager {},
  RouterPlugin: class RouterPlugin {},
  injectable: () => (target) => target,
  optional: () => () => {},
}));

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  SyncTabView: class SyncTabView {
    component(props) {
      const React = jest.requireActual('react');

      return React.createElement('div', props);
    }
  },
}));

import { SyncTabView } from '../../src/app/views/SyncTabView';

describe('SyncTabView', () => {
  test('applies Spring UI compact mode while preserving caller classes', () => {
    const view = new SyncTabView({}, {});
    const component = view.component({
      id: 'tabs',
      tabs: [],
      className: 'tabs-class',
      tabClassName: 'tab-class',
    });

    expect(component.props.className).toContain('sui-compact');
    expect(component.props.className).toContain('tabs-class');
    expect(component.props.tabClassName).toContain('sui-compact');
    expect(component.props.tabClassName).toContain('tab-class');
  });
});
