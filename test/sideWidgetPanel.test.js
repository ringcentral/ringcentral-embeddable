import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SideWidgetPanel } from '../src/app/views/SideWidgetView/SideWidgetPanel';
import { SideWidgetAppPanel } from '../src/app/views/SideWidgetView/SideWidgetAppPanel';

jest.mock('../src/app/views/SideWidgetView/SideWidgetAppPanel', () => ({
  SideWidgetAppPanel: jest.fn(() => <div>Loaded app panel</div>),
}));

function createProps(overrides = {}) {
  return {
    apps: [],
    tabs: [{ id: 'side-widget-apps', name: 'Apps' }],
    currentTabId: 'side-widget-apps',
    selectedAppId: null,
    contact: { id: 'contact' },
    pinAppIds: [],
    onTabChange: jest.fn(),
    onSelectApp: jest.fn(),
    onBack: jest.fn(),
    onClose: jest.fn(),
    onCloseTab: jest.fn(),
    onTogglePin: jest.fn(),
    renderContent: jest.fn(() => null),
    onLoadApp: jest.fn(async () => null),
    ...overrides,
  };
}

describe('SideWidgetPanel', () => {
  beforeEach(() => {
    SideWidgetAppPanel.mockClear();
  });

  test('shows an empty app state and closes from the header', () => {
    const props = createProps();
    render(<SideWidgetPanel {...props} />);

    expect(screen.getByText('Available apps')).toBeInTheDocument();
    expect(screen.getByText('No available apps')).toBeInTheDocument();
    expect(screen.getByTestId('sideWidgetAvailableAppsHeader')).toHaveAttribute(
      'variant',
      'detached',
    );
    expect(
      screen.getByTestId('sideWidgetAvailableAppsHeaderCenter'),
    ).toContainElement(screen.getByText('Available apps'));
    fireEvent.click(screen.getByRole('button', { name: 'Close apps' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  test('renders available apps with names, fallbacks, and selection handlers', () => {
    const props = createProps({
      apps: [{ id: 'crm', name: 'CRM', iconUri: 'crm.svg' }, { id: 'tasks' }],
    });
    render(<SideWidgetPanel {...props} />);

    expect(
      screen.getByRole('list', { name: 'Available apps' }),
    ).toBeInTheDocument();
    expect(screen.getByText('CRM')).toBeInTheDocument();
    expect(screen.getByText('tasks')).toBeInTheDocument();
    expect(screen.getByLabelText('CRM')).toHaveAttribute('data-src', 'crm.svg');
    fireEvent.click(screen.getByRole('button', { name: 'Open CRM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open tasks' }));
    expect(props.onSelectApp).toHaveBeenNthCalledWith(1, 'crm');
    expect(props.onSelectApp).toHaveBeenNthCalledWith(2, 'tasks');
  });

  test('forwards tab context changes as strings', () => {
    const props = createProps();
    render(<SideWidgetPanel {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Change test tab' }));
    expect(props.onTabChange).toHaveBeenCalledWith('test-tab');
  });

  test('renders a selected unpinned app inside the apps tab', () => {
    const app = { id: 'crm', name: 'CRM' };
    const props = createProps({ apps: [app], selectedAppId: 'crm' });
    render(<SideWidgetPanel {...props} />);

    expect(screen.getByText('Loaded app panel')).toBeInTheDocument();
    const appProps = SideWidgetAppPanel.mock.calls[0][0];
    expect(appProps).toEqual(
      expect.objectContaining({
        app,
        contact: { id: 'contact' },
        isPinned: false,
        showBack: true,
        showCloseButton: false,
        onLoadApp: props.onLoadApp,
      }),
    );
    appProps.onBack();
    appProps.onClose();
    appProps.onTogglePin();
    expect(props.onBack).toHaveBeenCalledTimes(2);
    expect(props.onTogglePin).toHaveBeenCalledWith('crm');
  });

  test('falls back to available apps when the selected id is unknown', () => {
    const props = createProps({
      apps: [{ id: 'crm', name: 'CRM' }],
      selectedAppId: 'missing',
    });
    render(<SideWidgetPanel {...props} />);
    expect(screen.getByText('Available apps')).toBeInTheDocument();
    expect(SideWidgetAppPanel).not.toHaveBeenCalled();
  });

  test('renders pinned app tabs and wires tab-specific controls', () => {
    const app = { id: 'crm', name: 'CRM' };
    const props = createProps({
      apps: [app],
      pinAppIds: ['crm'],
      tabs: [
        { id: 'side-widget-apps', name: 'Apps' },
        { id: 'side-widget-app-crm', appId: 'crm', name: 'CRM' },
      ],
      currentTabId: 'side-widget-app-crm',
    });
    render(<SideWidgetPanel {...props} />);

    expect(screen.getByTestId('sideWidgetTabs')).toHaveClass(
      'h-9',
      'flex-none',
      'px-1',
    );
    expect(screen.getByRole('button', { name: 'Apps' })).toBeInTheDocument();
    expect(screen.getByTitle('CRM')).toHaveClass(
      'flex-1',
      'h-9',
      'p-0',
      'pl-2',
      'pr-2',
    );
    expect(screen.queryByRole('button', { name: 'Close Apps tab' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close CRM tab' }));
    const appProps = SideWidgetAppPanel.mock.calls[0][0];
    expect(appProps).toEqual(
      expect.objectContaining({
        app,
        isPinned: true,
        showBack: false,
        showCloseButton: false,
      }),
    );
    appProps.onBack();
    appProps.onClose();
    appProps.onTogglePin();
    expect(props.onTabChange).toHaveBeenCalledWith('side-widget-apps');
    expect(props.onCloseTab).toHaveBeenCalledWith('side-widget-app-crm');
    expect(props.onTogglePin).toHaveBeenCalledWith('crm');
  });

  test('renders an unavailable state for a removed tab app', () => {
    const props = createProps({
      tabs: [
        { id: 'side-widget-apps', name: 'Apps' },
        {
          id: 'side-widget-app-missing',
          appId: 'missing',
          name: 'Removed app',
        },
      ],
      currentTabId: 'side-widget-app-missing',
    });
    render(<SideWidgetPanel {...props} />);

    expect(screen.getByText('App unavailable')).toBeInTheDocument();
    expect(
      screen.getByText('This app is no longer registered.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close app tab' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Close Removed app tab' }),
    );
    expect(props.onCloseTab).toHaveBeenCalledWith('side-widget-app-missing');
  });

  test('renders custom content as another selectable side-widget tab', () => {
    const props = createProps({
      tabs: [
        { id: 'side-widget-apps', name: 'Apps' },
        { id: 'voicemail-drop', name: 'Voicemail drop' },
      ],
      currentTabId: 'voicemail-drop',
      renderContent: jest.fn((tabId) => (
        <div data-sign={`content-${tabId}`}>Voicemail picker</div>
      )),
    });

    render(<SideWidgetPanel {...props} />);

    expect(screen.getByRole('button', { name: 'Apps' })).toBeInTheDocument();
    expect(screen.getByTitle('Voicemail drop')).toBeInTheDocument();
    expect(screen.getByTestId('content-voicemail-drop')).toHaveTextContent(
      'Voicemail picker',
    );
    expect(
      screen.getByTestId('sideWidgetContent-voicemail-drop'),
    ).toHaveAttribute('data-keep-mounted', 'true');
    expect(props.renderContent).toHaveBeenCalledWith('voicemail-drop', false);
  });

  test('updates the active tab controls when selection changes externally', () => {
    const props = createProps({
      tabs: [
        { id: 'smart-notes', name: 'AI Assistant' },
        { id: 'call-details', name: 'Call details' },
      ],
      currentTabId: 'smart-notes',
    });
    const rendered = render(<SideWidgetPanel {...props} />);

    expect(
      screen.getByRole('button', { name: 'Close AI Assistant tab' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Close Call details tab' }),
    ).toBeNull();

    rendered.rerender(
      <SideWidgetPanel {...props} currentTabId="call-details" />,
    );

    expect(
      screen.queryByRole('button', { name: 'Close AI Assistant tab' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Close Call details tab' }),
    ).toBeInTheDocument();
  });

  test('lets a single custom content page render its own close button', () => {
    const props = createProps({
      tabs: [{ id: 'voicemail-drop', name: 'Voicemail drop' }],
      currentTabId: 'voicemail-drop',
    });

    render(<SideWidgetPanel {...props} />);

    expect(screen.queryByTitle('Voicemail drop')).toBeNull();
    expect(props.renderContent).toHaveBeenCalledWith('voicemail-drop', true);
  });

  test('closes the active tab and hides the page close button when tabs are shown', () => {
    const props = createProps({
      tabs: [
        { id: 'side-widget-apps', name: 'Apps' },
        { id: 'voicemail-drop', name: 'Voicemail drop' },
      ],
    });

    render(<SideWidgetPanel {...props} />);
    expect(screen.queryByRole('button', { name: 'Close apps' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close Apps tab' }));

    expect(props.onCloseTab).toHaveBeenCalledWith('side-widget-apps');
    expect(props.onClose).not.toHaveBeenCalled();
  });
});
