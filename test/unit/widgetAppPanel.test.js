/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WidgetAppPanel } from '../../src/components/WidgetAppsPanel/WidgetAppPanel';

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => {
    function MockIcon() {
      return <span data-icon={name} />;
    }
    MockIcon.displayName = name;
    return MockIcon;
  };
  return {
    ArrowLeft2: createIcon('ArrowLeft2'),
    Reset: createIcon('Reset'),
    MoreVert: createIcon('MoreVert'),
    Unpin: createIcon('Unpin'),
    Pin: createIcon('Pin'),
    Close: createIcon('Close'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !key.startsWith('$') &&
      !['symbol', 'size', 'color', 'loading', 'innerRef', 'anchorEl', 'primaryTypographyProps'].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  const createComponent = (tag) => React.forwardRef((props, ref) => (
    React.createElement(tag, { ...cleanProps(props), ref }, props.children)
  ));
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => createComponent('div');
  styled.img = () => createComponent('img');
  const getButtonText = (props) => (
    props.title ||
    props['aria-label'] ||
    props.symbol?.displayName ||
    'icon-button'
  );
  return {
    RcIconButton: React.forwardRef((props, ref) => (
      <button
        {...cleanProps(props)}
        ref={ref}
        type="button"
        onClick={props.onClick}
      >
        {getButtonText(props)}
      </button>
    )),
    RcListItem: createComponent('div'),
    RcListItemAvatar: createComponent('div'),
    RcListItemSecondaryAction: createComponent('div'),
    RcListItemText: ({ primary, secondary }) => (
      <span>
        <span>{primary}</span>
        <span>{secondary}</span>
      </span>
    ),
    RcMenu: ({ open, children }) => (
      open ? <div role="menu">{children}</div> : null
    ),
    RcMenuItem: ({ children, onClick }) => (
      <button type="button" role="menuitem" onClick={onClick}>
        {children}
      </button>
    ),
    RcTypography: createComponent('span'),
    palette2: jest.fn(() => '#000'),
    styled,
  };
});

jest.mock('@ringcentral-integration/jsonschema-page', () => ({
  JSONSchemaPage: ({
    formData,
    hiddenSubmitButton,
    onButtonClick,
    onFormDataChange,
    onSubmit,
  }) => (
    <div data-sign="json-schema-page" data-testid="json-schema-page">
      <span>{JSON.stringify(formData)}</span>
      <button
        type="button"
        onClick={() => onFormDataChange({ ...formData, name: 'Grace' })}
      >
        change-form
      </button>
      <button
        type="button"
        onClick={() => onButtonClick('schema-action')}
      >
        schema-action
      </button>
      {!hiddenSubmitButton && (
        <button type="button" onClick={onSubmit}>
          submit-form
        </button>
      )}
      {hiddenSubmitButton && <span>submit-hidden</span>}
    </div>
  ),
}));

function createPage(formData = { name: 'Ada' }) {
  return {
    type: 'json-schema',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    },
    uiSchema: {
      submitButtonOptions: {
        submitText: 'Save',
      },
    },
    formData,
  };
}

function createProps(overrides = {}) {
  return {
    app: {
      id: 'app-1',
      name: 'CRM App',
      description: 'CRM workflow',
      iconUri: 'https://example.com/icon.png',
      submitPath: '/submit',
    },
    appId: 'app-1',
    contact: { id: 'contact-1' },
    isPinned: false,
    onBack: jest.fn(),
    onClose: jest.fn(),
    onLoadApp: jest.fn(),
    onPinChanged: jest.fn(),
    showBack: true,
    showCloseButton: true,
    showPin: true,
    ...overrides,
  };
}

describe('WidgetAppPanel', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads widget app pages and handles header, menu, and schema actions', async () => {
    const props = createProps();
    props.onLoadApp
      .mockResolvedValueOnce({
        page: createPage({ name: 'Ada' }),
        actions: [{ id: 'archive', label: 'Archive', color: 'danger.f02' }],
      })
      .mockResolvedValueOnce({
        page: createPage({ name: 'Archived' }),
        actions: [],
      })
      .mockResolvedValueOnce({
        page: createPage({ name: 'Reloaded' }),
        actions: [],
      })
      .mockResolvedValueOnce({
        page: createPage({ name: 'Grace' }),
        actions: [],
      })
      .mockResolvedValueOnce({
        page: createPage({ name: 'Button clicked' }),
        actions: [],
      })
      .mockResolvedValueOnce({
        page: createPage({ name: 'Submitted' }),
        actions: [],
      });

    render(<WidgetAppPanel {...props} />);

    await waitFor(() => {
      expect(props.onLoadApp).toHaveBeenCalledWith({
        app: props.app,
        contact: props.contact,
        type: 'init',
      });
    });
    expect(screen.getByText('CRM App')).toBeTruthy();
    expect(screen.getByText('CRM workflow')).toBeTruthy();
    expect(screen.getByText(/"name":"Ada"/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'ArrowLeft2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open this app as new tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'MoreVert' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'MoreVert' }));
    fireEvent.click(screen.getByRole('button', { name: 'MoreVert' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
    await waitFor(() => {
      expect(screen.getByText(/"name":"Archived"/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reload the app' }));
    await waitFor(() => {
      expect(screen.getByText(/"name":"Reloaded"/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'change-form' }));
    await waitFor(() => {
      expect(screen.getByText(/"name":"Grace"/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'schema-action' }));
    await waitFor(() => {
      expect(screen.getByText(/"name":"Button clicked"/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'submit-form' }));
    await waitFor(() => {
      expect(screen.getByText(/"name":"Submitted"/)).toBeTruthy();
    });

    expect(props.onBack).toHaveBeenCalled();
    expect(props.onPinChanged).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: props.contact,
      formData: { name: 'Ada' },
      type: 'buttonClick',
      button: { id: 'archive' },
    });
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: props.contact,
      formDataState: { name: 'Archived' },
      type: 'refresh',
    });
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: props.contact,
      formData: { name: 'Grace' },
      changedKeys: ['name'],
      type: 'inputChanged',
    });
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: props.contact,
      formData: { name: 'Grace' },
      type: 'buttonClick',
      button: { id: 'schema-action' },
    });
    expect(props.onLoadApp).toHaveBeenCalledWith({
      app: props.app,
      contact: props.contact,
      formData: { name: 'Button clicked' },
      type: 'submit',
    });
  });

  it('supports direct page responses, hidden submit buttons, and loading state', async () => {
    const pageProps = createProps({
      app: {
        id: 'app-2',
        name: 'Read Only App',
        iconUri: 'https://example.com/icon.png',
      },
      appId: 'app-2',
      showBack: false,
      showCloseButton: false,
      showPin: false,
    });
    pageProps.onLoadApp.mockResolvedValueOnce(createPage({ name: 'Direct' }));
    render(<WidgetAppPanel {...pageProps} />);
    await waitFor(() => {
      expect(screen.getByText(/"name":"Direct"/)).toBeTruthy();
    });
    expect(screen.getByText('submit-hidden')).toBeTruthy();

    const loadingProps = createProps({
      appId: 'app-3',
      onLoadApp: jest.fn(async () => null),
    });
    render(<WidgetAppPanel {...loadingProps} />);
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeTruthy();
    });
  });

  it('logs schema interaction errors without replacing the current page', async () => {
    const props = createProps();
    props.onLoadApp
      .mockResolvedValueOnce(createPage({ name: 'Initial' }))
      .mockRejectedValueOnce(new Error('change failed'))
      .mockRejectedValueOnce(new Error('button failed'));
    render(<WidgetAppPanel {...props} />);
    await waitFor(() => {
      expect(screen.getByText(/"name":"Initial"/)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'change-form' }));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
    fireEvent.click(screen.getByRole('button', { name: 'schema-action' }));
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText(/"name":"Grace"/)).toBeTruthy();
  });
});
