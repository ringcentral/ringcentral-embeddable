import React from 'react';
import { render, screen } from '@testing-library/react';

import { SideWidgetView } from '../../next/app/views/SideWidgetView/SideWidget.view';
import { SideWidgetPanel } from '../../next/app/views/SideWidgetView/SideWidgetPanel';

jest.mock('../../next/app/views/SideWidgetView/SideWidgetPanel', () => ({
  SideWidgetPanel: jest.fn(() => null),
}));

jest.mock('../../next/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

function createSideWidget(overrides = {}) {
  let expandedConfig;
  const expandedHandle = { id: 'side-widget' };
  const dependencies = {
    expandedView: {
      activeContentId: null,
      create: jest.fn((config) => {
        expandedConfig = config;
        return expandedHandle;
      }),
      open: jest.fn(),
      close: jest.fn(),
    },
    thirdParty: {
      apps: [
        { id: 'crm', name: 'CRM', description: 'Contacts', iconUri: 'crm.svg' },
        { id: 'tasks', name: 'Tasks' },
      ],
      pinAppIds: [],
      toggleAppPin: jest.fn(function toggleAppPin(appId) {
        const index = this.pinAppIds.indexOf(appId);
        if (index >= 0) {
          this.pinAppIds.splice(index, 1);
        } else {
          this.pinAppIds.push(appId);
        }
      }),
      loadAppPage: jest.fn(async () => ({ page: true })),
    },
    theme: { themeType: 'dark' },
    options: { enableSideWidget: true },
    ...overrides,
  };
  const view = new SideWidgetView(
    dependencies.expandedView,
    dependencies.thirdParty,
    dependencies.theme,
    dependencies.options,
  );
  return {
    dependencies,
    expandedHandle,
    getExpandedConfig: () => expandedConfig,
    view,
  };
}

describe('SideWidgetView', () => {
  beforeEach(() => {
    SideWidgetPanel.mockClear();
  });

  test('opens the apps view for a contact', () => {
    const { dependencies, expandedHandle, view } = createSideWidget();
    const contact = { id: 'contact', phoneNumber: '+16505550100' };

    view.openApps(contact);

    expect(view.currentContact).toBe(contact);
    expect(view.currentTabId).toBe('side-widget-apps');
    expect(view.selectedAppId).toBeNull();
    expect(dependencies.expandedView.open).toHaveBeenCalledWith(expandedHandle);
  });

  test('reports whether the shared side-widget content is active', () => {
    const { dependencies, view } = createSideWidget();
    expect(view.isOpen).toBe(false);
    dependencies.expandedView.activeContentId = 'side-widget';
    expect(view.isOpen).toBe(true);
  });

  test('does not open when disabled or when no apps are registered', () => {
    const disabled = createSideWidget({ options: { enableSideWidget: false } });
    expect(disabled.view.enabled).toBe(false);
    disabled.view.openApps({ id: 'contact' });
    expect(disabled.dependencies.expandedView.open).not.toHaveBeenCalled();

    const empty = createSideWidget({
      thirdParty: {
        apps: [],
        pinAppIds: [],
        toggleAppPin: jest.fn(),
        loadAppPage: jest.fn(),
      },
    });
    empty.view.openApps({ id: 'contact' });
    expect(empty.dependencies.expandedView.open).not.toHaveBeenCalled();

    const defaultOptions = createSideWidget({ options: undefined });
    expect(defaultOptions.view.enabled).toBe(false);
  });

  test('creates and updates app tabs while retaining unique ids', () => {
    const { view } = createSideWidget();
    const crm = { id: 'crm', name: 'CRM' };
    view.tabs = [];

    view.openAppTab(crm, { id: 'contact' });
    expect(view.tabs).toEqual([
      { id: 'side-widget-apps', name: 'Apps' },
      { id: 'side-widget-app-crm', appId: 'crm', name: 'CRM' },
    ]);
    expect(view.currentTabId).toBe('side-widget-app-crm');

    view.openAppTab({ id: 'crm', name: 'CRM Updated' }, null);
    expect(view.tabs).toHaveLength(2);
    expect(view.tabs[1].name).toBe('CRM Updated');
    view.openAppTab({ id: 'fallback-name' }, null);
    expect(view.tabs.at(-1).name).toBe('fallback-name');

    const disabled = createSideWidget({
      options: { enableSideWidget: false },
    }).view;
    disabled.openAppTab(crm, { id: 'contact' });
    expect(disabled.tabs).toEqual([{ id: 'side-widget-apps', name: 'Apps' }]);
  });

  test('selects existing tabs and ignores unknown tabs', () => {
    const { view } = createSideWidget();
    view.openAppTab({ id: 'crm', name: 'CRM' }, null);
    view.selectTab('side-widget-apps');
    expect(view.currentTabId).toBe('side-widget-apps');
    view.selectTab('unknown');
    expect(view.currentTabId).toBe('side-widget-apps');
  });

  test('selects unpinned apps and opens pinned apps in tabs', () => {
    const { dependencies, view } = createSideWidget();
    view.currentContact = { id: 'contact' };

    view.selectApp('crm');
    expect(view.selectedAppId).toBe('crm');
    view.selectApp('missing');
    expect(view.selectedAppId).toBe('crm');

    dependencies.thirdParty.pinAppIds.push('tasks');
    view.selectApp('tasks');
    expect(view.currentTabId).toBe('side-widget-app-tasks');
    expect(view.selectedAppId).toBeNull();
  });

  test('returns to the apps list', () => {
    const { view } = createSideWidget();
    view.currentTabId = 'other';
    view.selectedAppId = 'crm';
    view.showApps();
    expect(view.currentTabId).toBe('side-widget-apps');
    expect(view.selectedAppId).toBeNull();
  });

  test('closes app tabs and selects the preceding tab', () => {
    const { dependencies, expandedHandle, view } = createSideWidget();
    view.openAppTab({ id: 'crm', name: 'CRM' }, null);
    view.openAppTab({ id: 'tasks', name: 'Tasks' }, null);

    view.closeTab('side-widget-app-tasks');
    expect(view.currentTabId).toBe('side-widget-app-crm');
    expect(view.tabs.map(({ appId }) => appId).filter(Boolean)).toEqual([
      'crm',
    ]);
    view.closeTab('missing');
    expect(view.tabs).toHaveLength(2);
    view.closeTab('side-widget-apps');
    expect(view.tabs).toEqual([
      { id: 'side-widget-app-crm', appId: 'crm', name: 'CRM' },
    ]);
    expect(dependencies.expandedView.close).not.toHaveBeenCalled();
    view.closeTab('side-widget-app-crm');
    expect(dependencies.expandedView.close).toHaveBeenCalledWith(
      expandedHandle,
    );
  });

  test('keeps the current tab when closing a background tab', () => {
    const { view } = createSideWidget();
    view.openAppTab({ id: 'crm', name: 'CRM' }, null);
    view.openAppTab({ id: 'tasks', name: 'Tasks' }, null);
    view.selectTab('side-widget-apps');
    view.closeTab('side-widget-app-crm');
    expect(view.currentTabId).toBe('side-widget-apps');
  });

  test('selects the right-hand tab after closing the active tab', () => {
    const { view } = createSideWidget();
    view.openAppTab({ id: 'crm', name: 'CRM' }, null);
    view.openAppTab({ id: 'tasks', name: 'Tasks' }, null);
    view.selectTab('side-widget-app-crm');

    view.closeTab('side-widget-app-crm');

    expect(view.currentTabId).toBe('side-widget-app-tasks');
  });

  test('hosts reusable content tabs alongside app tabs', () => {
    const { dependencies, expandedHandle, getExpandedConfig, view } =
      createSideWidget();
    const onClose = jest.fn();
    const Content = jest.fn(() => <div>Voicemail picker</div>);
    const handle = view.createContent({
      id: 'voicemail-drop',
      name: 'Voicemail drop',
      onClose,
      view: Content,
    });

    view.openContent(handle);

    expect(view.tabs).toEqual([
      { id: 'side-widget-apps', name: 'Apps' },
      { id: 'voicemail-drop', name: 'Voicemail drop' },
    ]);
    expect(view.currentTabId).toBe('voicemail-drop');
    expect(dependencies.expandedView.open).toHaveBeenCalledWith(expandedHandle);

    const ExpandedContent = getExpandedConfig().view;
    render(<ExpandedContent />);
    const props = SideWidgetPanel.mock.calls.at(-1)[0];
    render(props.renderContent('voicemail-drop', false));
    expect(screen.getByText('Voicemail picker')).toBeInTheDocument();
    expect(Content).toHaveBeenCalledWith({ showCloseButton: false }, {});

    view.closeContent(handle);
    expect(view.tabs).toEqual([{ id: 'side-widget-apps', name: 'Apps' }]);
    expect(view.currentTabId).toBe('side-widget-apps');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dependencies.expandedView.close).not.toHaveBeenCalled();
  });

  test('can add content without replacing the active tab', () => {
    const { dependencies, expandedHandle, view } = createSideWidget();
    const handle = view.createContent({
      id: 'call-details',
      name: 'Call details',
      view: () => null,
    });

    view.openContent(handle, { activate: false });

    expect(view.tabs).toContainEqual({
      id: 'call-details',
      name: 'Call details',
    });
    expect(view.currentTabId).toBe('side-widget-apps');
    expect(dependencies.expandedView.open).toHaveBeenCalledWith(expandedHandle);
  });

  test('keeps content registration across close and reopen', () => {
    const { getExpandedConfig, view } = createSideWidget();
    const onClose = jest.fn();
    const Content = () => <div>Reusable content</div>;
    const handle = view.createContent({
      id: 'reusable-content',
      name: 'Reusable',
      onClose,
      view: Content,
    });

    view.openContent(handle);
    view.closeContent(handle);
    view.openContent(handle);

    expect(
      view.tabs.filter(({ id }) => id === 'reusable-content'),
    ).toHaveLength(1);
    const ExpandedContent = getExpandedConfig().view;
    render(<ExpandedContent />);
    const props = SideWidgetPanel.mock.calls.at(-1)[0];
    render(props.renderContent('reusable-content', true));
    expect(screen.getByText('Reusable content')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('preserves app tabs while opening and closing custom content', () => {
    const { dependencies, view } = createSideWidget();
    view.openAppTab({ id: 'crm', name: 'CRM' }, null);
    view.openAppTab({ id: 'tasks', name: 'Tasks' }, null);
    const handle = view.createContent({
      id: 'voicemail-drop',
      name: 'Voicemail drop',
      view: () => null,
    });

    view.openContent(handle);
    expect(view.tabs.map(({ id }) => id)).toEqual([
      'side-widget-apps',
      'side-widget-app-crm',
      'side-widget-app-tasks',
      'voicemail-drop',
    ]);

    view.closeContent(handle);
    expect(view.tabs.map(({ id }) => id)).toEqual([
      'side-widget-apps',
      'side-widget-app-crm',
      'side-widget-app-tasks',
    ]);
    expect(view.currentTabId).toBe('side-widget-app-tasks');
    expect(dependencies.expandedView.close).not.toHaveBeenCalled();
  });

  test('preserves content tabs when call contact state initializes', () => {
    const { dependencies, view } = createSideWidget();
    dependencies.thirdParty.pinAppIds = ['crm'];
    const handle = view.createContent({
      id: 'voicemail-drop',
      name: 'Voicemail drop',
      view: () => null,
    });
    view.openContent(handle);

    view.onCallInit({
      from: '+16505550100',
      to: '+16505550101',
      toUserName: 'Callee',
    });

    expect(view.tabs.map(({ id }) => id)).toEqual([
      'side-widget-apps',
      'voicemail-drop',
      'side-widget-app-crm',
    ]);
  });

  test('opens content without an Apps tab when side widgets are disabled', () => {
    const { dependencies, expandedHandle, getExpandedConfig, view } =
      createSideWidget({
        options: { enableSideWidget: false },
      });
    const onClose = jest.fn();
    const handle = view.createContent({
      id: 'voicemail-drop',
      name: 'Voicemail drop',
      onClose,
      view: () => null,
    });

    view.openContent(handle);
    expect(view.tabs).toEqual([
      { id: 'voicemail-drop', name: 'Voicemail drop' },
    ]);

    view.closeContent(handle);
    expect(dependencies.expandedView.close).toHaveBeenCalledTimes(1);
    expect(dependencies.expandedView.close).toHaveBeenCalledWith(
      expandedHandle,
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    getExpandedConfig().onClose();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('rejects content ids reserved for app tabs', () => {
    const { view } = createSideWidget();
    expect(() =>
      view.createContent({
        id: 'side-widget-apps',
        name: 'Collision',
        view: () => null,
      }),
    ).toThrow('Side widget content id is reserved');
    expect(() =>
      view.createContent({
        id: 'side-widget-app-crm',
        name: 'Collision',
        view: () => null,
      }),
    ).toThrow('Side widget content id is reserved');
  });

  test('rejects duplicate content ids without replacing the registered view', () => {
    const { view } = createSideWidget();
    const FirstContent = () => null;
    const firstHandle = view.createContent({
      id: 'voicemail-drop',
      name: 'Voicemail drop',
      view: FirstContent,
    });

    expect(() =>
      view.createContent({
        id: 'voicemail-drop',
        name: 'Replacement',
        view: () => null,
      }),
    ).toThrow('Side widget content id is already registered');
    expect(() => view.openContent(firstHandle)).not.toThrow();
  });

  test('pins apps into tabs and unpins without reopening', () => {
    const { dependencies, view } = createSideWidget();
    view.currentContact = { id: 'contact' };
    view.toggleAppPin('missing');
    expect(dependencies.thirdParty.toggleAppPin).not.toHaveBeenCalled();

    view.toggleAppPin('crm');
    expect(dependencies.thirdParty.pinAppIds).toContain('crm');
    expect(view.currentTabId).toBe('side-widget-app-crm');

    dependencies.thirdParty.toggleAppPin.mockClear();
    view.toggleAppPin('crm');
    expect(dependencies.thirdParty.toggleAppPin).toHaveBeenCalledWith('crm');
    expect(dependencies.thirdParty.pinAppIds).not.toContain('crm');
  });

  test('opens incoming and outgoing call contacts and pinned apps', () => {
    const { dependencies, view } = createSideWidget();
    dependencies.thirdParty.pinAppIds = ['crm', 'missing'];
    const session = {
      from: '+16505550100',
      fromUserName: 'Caller',
      to: '+16505550101',
      toUserName: 'Callee',
    };

    view.onCallRing(session);
    expect(view.currentContact).toEqual({
      phoneNumber: '+16505550100',
      name: 'Caller',
    });
    view.onCallInit(session);
    expect(view.currentContact).toEqual({
      phoneNumber: '+16505550101',
      name: 'Callee',
    });
    expect(view.tabs.some(({ appId }) => appId === 'crm')).toBe(true);
  });

  test('resets app state only when the contact changes', () => {
    const { view } = createSideWidget();
    view.currentContact = { id: 'contact', phoneNumber: '+1' };
    view.tabs = [
      { id: 'side-widget-apps', name: 'Apps' },
      { id: 'side-widget-app-crm', appId: 'crm', name: 'CRM' },
    ];
    view.selectedAppId = 'crm';

    view._setContact({ id: 'contact', phoneNumber: '+2' });
    expect(view.tabs).toHaveLength(2);
    expect(view.selectedAppId).toBe('crm');

    view._setContact({ id: 'different', phoneNumber: '+3' });
    expect(view.tabs).toEqual([{ id: 'side-widget-apps', name: 'Apps' }]);
    expect(view.selectedAppId).toBeNull();
  });

  test('renders expanded state and wires stable UI callbacks', async () => {
    const { dependencies, getExpandedConfig, view } = createSideWidget();
    view.currentContact = { id: 'contact' };
    view.openAppTab({ id: 'crm', name: 'CRM' }, null);
    const selectTab = jest.spyOn(view, 'selectTab');
    const selectApp = jest.spyOn(view, 'selectApp');
    const showApps = jest.spyOn(view, 'showApps');
    const close = jest.spyOn(view, 'close');
    const closeTab = jest.spyOn(view, 'closeTab');
    const toggleAppPin = jest.spyOn(view, 'toggleAppPin');
    const ExpandedContent = getExpandedConfig().view;

    render(<ExpandedContent />);

    expect(SideWidgetPanel).toHaveBeenCalledTimes(1);
    const props = SideWidgetPanel.mock.calls[0][0];
    expect(props.apps).toEqual(dependencies.thirdParty.apps);
    expect(props.contact).toEqual({ id: 'contact' });
    expect(props.currentTabId).toBe('side-widget-app-crm');
    props.onTabChange('side-widget-apps');
    props.onSelectApp('crm');
    props.onBack();
    props.onClose();
    props.onCloseTab('side-widget-app-crm');
    props.onTogglePin('crm');
    await props.onLoadApp({ app: { id: 'crm' } });

    expect(selectTab).toHaveBeenCalledWith('side-widget-apps');
    expect(selectApp).toHaveBeenCalledWith('crm');
    expect(showApps).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(closeTab).toHaveBeenCalledWith('side-widget-app-crm');
    expect(toggleAppPin).toHaveBeenCalledWith('crm');
    expect(dependencies.thirdParty.loadAppPage).toHaveBeenCalledWith({
      app: { id: 'crm' },
      theme: 'dark',
    });
    expect(view.component()).toBeNull();
  });
});
