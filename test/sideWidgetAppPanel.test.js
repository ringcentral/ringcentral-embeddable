import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';

import { SideWidgetAppPanel } from '../src/app/views/SideWidgetView/SideWidgetAppPanel';

jest.mock('../src/app/views/SideWidgetView/i18n', () => {
  const enUS = jest.requireActual(
    '../src/app/views/SideWidgetView/i18n/en-US',
  ).default;
  return {
    __esModule: true,
    default: {},
    t: (key, options = {}) =>
      (enUS[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => options[name]),
  };
});

function createPageResponse(overrides = {}) {
  return {
    page: {
      type: 'json-schema',
      schema: { type: 'object' },
      uiSchema: {
        submitButtonOptions: { submitText: 'Save' },
      },
      formData: { name: 'Ada', unchanged: true },
      ...overrides.page,
    },
    actions: overrides.actions ?? [],
  };
}

function createProps(overrides = {}) {
  return {
    app: {
      id: 'crm',
      name: 'CRM',
      iconUri: 'crm.svg',
      pagePath: '/page',
      inputChangedPath: '/input',
      submitPath: '/submit',
      buttonEventPath: '/button',
    },
    contact: { id: 'contact' },
    isPinned: false,
    showBack: true,
    showCloseButton: true,
    onBack: jest.fn(),
    onClose: jest.fn(),
    onTogglePin: jest.fn(),
    onLoadApp: jest.fn(async () => createPageResponse()),
    ...overrides,
  };
}

describe('SideWidgetAppPanel', () => {
  beforeEach(() => {
    JSONSchemaPage.mockClear();
  });

  test('loads and renders a supported JSON schema page', async () => {
    const props = createProps();
    render(<SideWidgetAppPanel {...props} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading app')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('json-schema-page')).toBeInTheDocument());
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: props.contact,
      type: 'init',
    });
    expect(JSONSchemaPage).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: { type: 'object' },
        formData: { name: 'Ada', unchanged: true },
        hiddenSubmitButton: false,
      }),
      {},
    );
    expect(screen.getByTestId('sideWidgetAppHeader')).toHaveAttribute(
      'variant',
      'detached',
    );
    expect(screen.getByTestId('sideWidgetAppHeader')).toHaveStyle({
      paddingRight: 'var(--sui-spacing-24)',
    });
    expect(screen.getByTestId('sideWidgetAppHeaderCenter')).toContainElement(
      screen.getByText('CRM'),
    );
    expect(screen.getByLabelText('CRM')).toHaveAttribute('data-src', 'crm.svg');
  });

  test('wires back, pin, refresh, form, button, and submit actions', async () => {
    const props = createProps({ isPinned: true });
    render(<SideWidgetAppPanel {...props} />);
    await screen.findByTestId('json-schema-page');
    props.onLoadApp.mockClear();
    props.onLoadApp.mockResolvedValue(createPageResponse({
      page: { formData: { name: 'Before' } },
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Back to available apps' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Do not open this app in a tab for outgoing calls',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reload app' }));
    await waitFor(() => expect(props.onLoadApp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'refresh', formData: { name: 'Ada', unchanged: true } }),
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Change form' }));
    await waitFor(() => expect(props.onLoadApp).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'inputChanged',
        formData: { name: 'Updated' },
        changedKeys: ['name'],
      }),
    ));
    fireEvent.click(screen.getByRole('button', { name: 'Invalid form' }));
    await waitFor(() => expect(props.onLoadApp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'inputChanged', formData: {}, changedKeys: [] }),
    ));
    fireEvent.click(screen.getByRole('button', { name: 'Custom action' }));
    await waitFor(() => expect(props.onLoadApp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'buttonClick', button: { id: 'custom' } }),
    ));
    fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));
    await waitFor(() => expect(props.onLoadApp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'submit' }),
    ));

    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(props.onTogglePin).toHaveBeenCalledTimes(1);
  });

  test('shows action menu colors, runs page actions, and closes the tab', async () => {
    const actions = [
      { id: 'danger', label: 'Delete', color: 'danger.f02' },
      { id: 'warning', label: 'Warn', color: 'warning.f02' },
      { id: 'success', label: 'Complete', color: 'success.f02' },
      { id: 'primary', label: 'Open', color: 'primary.f02' },
      { id: 'neutral', label: 'Neutral', color: 'neutral.f02' },
    ];
    const props = createProps({
      onLoadApp: jest.fn(async () => createPageResponse({ actions })),
    });
    render(<SideWidgetAppPanel {...props} />);
    await screen.findByTestId('json-schema-page');
    props.onLoadApp.mockClear();
    props.onLoadApp.mockResolvedValue(createPageResponse({ actions }));

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Close' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await waitFor(() => expect(props.onLoadApp).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'buttonClick', button: { id: 'danger' } }),
    ));

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Close' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  test('uses a direct close button when there are no page actions', async () => {
    const props = createProps();
    render(<SideWidgetAppPanel {...props} />);
    await screen.findByTestId('json-schema-page');
    fireEvent.click(screen.getByRole('button', { name: 'Close app tab' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  test('hides optional header controls and uses the app id as its name', async () => {
    const props = createProps({
      app: { id: 'fallback', pagePath: '/page' },
      contact: null,
      showBack: false,
      showCloseButton: false,
    });
    render(<SideWidgetAppPanel {...props} />);
    await screen.findByTestId('json-schema-page');

    expect(screen.queryByRole('button', { name: 'Back to available apps' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Close app tab' })).toBeNull();
    expect(screen.getByLabelText('fallback')).toBeInTheDocument();
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: undefined,
      type: 'init',
    });
  });

  test('shows an unsupported-page state when loading fails validation', async () => {
    const props = createProps({
      onLoadApp: jest.fn(async () => ({ page: { type: 'html' } })),
    });
    render(<SideWidgetAppPanel {...props} />);

    expect(await screen.findByText('Unable to load app')).toBeInTheDocument();
    expect(screen.getByText('The app did not return a supported page.')).toBeInTheDocument();
    expect(JSONSchemaPage).not.toHaveBeenCalled();
  });

  test('ignores stale requests after app changes', async () => {
    let resolveFirst;
    const firstRequest = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const onLoadApp = jest
      .fn()
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce(createPageResponse({ page: { formData: { app: 'second' } } }));
    const props = createProps({ onLoadApp });
    const { rerender } = render(<SideWidgetAppPanel {...props} />);

    const secondApp = { ...props.app, id: 'tasks', name: 'Tasks' };
    rerender(<SideWidgetAppPanel {...props} app={secondApp} />);
    await screen.findByTestId('json-schema-page');
    resolveFirst(createPageResponse({ page: { formData: { app: 'first' } } }));
    await Promise.resolve();

    expect(JSONSchemaPage.mock.calls.at(-1)[0].formData).toEqual({ app: 'second' });
  });

  test('stops Enter key propagation inside schema content', async () => {
    const parentKeyDown = jest.fn();
    const props = createProps();
    render(
      <div onKeyDown={parentKeyDown}>
        <SideWidgetAppPanel {...props} />
      </div>,
    );
    await screen.findByTestId('json-schema-page');
    const page = screen.getByTestId('json-schema-page');
    fireEvent.keyDown(page, { key: 'Enter' });
    expect(parentKeyDown).not.toHaveBeenCalled();
    fireEvent.keyDown(page, { key: 'Escape' });
    expect(parentKeyDown).toHaveBeenCalledTimes(1);
  });
});
