import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';
import { AppFooterNav } from '@ringcentral-integration/micro-core/src/app/components/AppContext/AppFooter';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components/AppContext/AppHeader';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';

import { CustomizedPagePanel } from '../../next/app/views/CustomizedPageView/CustomizedPagePanel';

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components/AppContext/AppFooter',
  () => ({
    AppFooterNav: jest.fn(({ children }) => (
      <div data-sign="appFooterNav">{children}</div>
    )),
  }),
);

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: jest.fn(({ children, endAdornment, onBackClick }) => (
    <header data-sign="customizedPageHeader">
      {onBackClick ? (
        <button type="button" aria-label="back" onClick={onBackClick}>
          Back
        </button>
      ) : null}
      {children}
      {endAdornment}
    </header>
  )),
}));

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components/AppContext/AppHeader',
  () => ({
    AppHeaderNav: jest.fn(({ children, override, title }) => (
      <div data-override={Boolean(override)} data-sign="appHeaderNav">
        {title}
        {children}
      </div>
    )),
  }),
);

function createPage(overrides = {}) {
  return {
    id: 'custom-page',
    title: 'CRM details',
    type: 'page',
    schema: {
      type: 'object',
      required: ['name'],
    },
    uiSchema: {
      submitButtonOptions: {
        submitText: 'Store',
      },
    },
    formData: {
      name: 'Ada',
      unchanged: true,
    },
    ...overrides,
  };
}

function createProps(overrides = {}) {
  return {
    page: createPage(),
    onBack: jest.fn(),
    onButtonClick: jest.fn(),
    onFormDataChange: jest.fn(),
    onSubmit: jest.fn(),
    onTabActionClick: jest.fn(),
    ...overrides,
  };
}

describe('CustomizedPagePanel', () => {
  beforeEach(() => {
    AppFooterNav.mockClear();
    AppHeaderNav.mockClear();
    PageHeader.mockClear();
    JSONSchemaPage.mockClear();
  });

  test('renders a customized page and preserves its legacy callbacks', () => {
    const props = createProps();
    render(<CustomizedPagePanel {...props} />);

    expect(screen.getByText('CRM details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Store' })).toHaveAttribute(
      'data-full-width',
      'true',
    );
    expect(screen.getByTestId('customizedPageSaveFooter')).toContainElement(
      screen.getByRole('button', { name: 'Store' }),
    );
    expect(screen.getByTestId('customizedPageSaveFooter')).toHaveClass(
      'border-t',
      'border-neutral-b4/50',
      'p-3',
    );
    expect(AppHeaderNav).toHaveBeenCalledWith(
      expect.objectContaining({ override: true }),
      {},
    );
    expect(AppFooterNav).toHaveBeenCalledTimes(1);
    expect(PageHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        children: 'CRM details',
        onBackClick: props.onBack,
      }),
      {},
    );
    expect(screen.getByTestId('customizedPageContent')).not.toHaveClass(
      'mt-3',
    );
    expect(JSONSchemaPage).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: props.page.schema,
        uiSchema: props.page.uiSchema,
        formData: props.page.formData,
        hiddenSubmitButton: true,
      }),
      {},
    );

    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change form' }));
    fireEvent.click(screen.getByRole('button', { name: 'Custom action' }));
    fireEvent.click(screen.getByRole('button', { name: 'Store' }));

    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(props.onFormDataChange).toHaveBeenCalledWith(
      'custom-page',
      { name: 'Updated' },
      ['name'],
    );
    expect(props.onButtonClick).toHaveBeenCalledWith(
      'custom',
      { name: 'Updated' },
    );
    expect(props.onSubmit).toHaveBeenCalledWith(
      'custom-page',
      { name: 'Updated' },
    );
  });

  test('disables page save until required fields are filled', () => {
    const props = createProps({
      page: createPage({ formData: { name: '' } }),
    });
    render(<CustomizedPagePanel {...props} />);

    expect(screen.getByRole('button', { name: 'Store' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Change form' }));
    expect(screen.getByRole('button', { name: 'Store' })).toBeEnabled();
  });

  test('does not render the fixed save action when the page has no submit configuration', () => {
    const props = createProps({
      page: createPage({ uiSchema: {} }),
    });
    render(<CustomizedPagePanel {...props} />);

    expect(screen.queryByTestId('customizedPageSave')).toBeNull();
    expect(screen.queryByTestId('customizedPageSaveFooter')).toBeNull();
    expect(AppFooterNav).toHaveBeenCalledTimes(1);
  });

  test('renders tab submit and supported header actions', () => {
    const props = createProps({
      page: createPage({
        id: 'crm-tab',
        type: 'tab',
        actions: [
          { id: 'settings', icon: 'settings', title: 'Settings' },
          { id: 'newRecord', icon: 'new', title: 'New record' },
          { id: 'refreshData', icon: 'refresh', title: 'Refresh data' },
          { id: 'download', icon: 'download', title: 'Download' },
          { id: 'edit', icon: 'edit', title: 'Edit' },
          { id: 'unknown', icon: 'unsupported', title: 'Unknown' },
        ],
      }),
    });
    render(<CustomizedPagePanel {...props} />);

    expect(screen.queryByRole('button', { name: 'back' })).toBeNull();
    expect(screen.queryByTestId('customizedPageHeader')).toBeNull();
    expect(PageHeader).not.toHaveBeenCalled();
    expect(AppHeaderNav).toHaveBeenCalledWith(
      expect.objectContaining({ override: false, title: 'CRM details' }),
      {},
    );
    expect(AppFooterNav).not.toHaveBeenCalled();
    expect(screen.getByTestId('customizedPageContent')).not.toHaveClass(
      'mt-3',
    );
    const tabActions = screen.getByTestId('customizedTabActions');
    expect(tabActions).toHaveClass(
      'flex',
      'items-center',
      'justify-end',
      'gap-1',
    );
    expect(tabActions).not.toHaveClass('px-3');
    expect(tabActions.querySelectorAll('button')).toHaveLength(5);
    expect(JSONSchemaPage).toHaveBeenCalledWith(
      expect.objectContaining({
        hiddenSubmitButton: false,
      }),
      {},
    );
    expect(
      screen.queryByRole('button', { name: 'Unknown' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));

    expect(props.onTabActionClick).toHaveBeenCalledWith(
      'crm-tab',
      'refreshData',
    );
    expect(props.onSubmit).toHaveBeenCalledWith(
      'crm-tab',
      props.page.formData,
    );
  });

  test('hides the optional back button and stops Enter propagation', () => {
    const onKeyDown = jest.fn();
    const props = createProps({
      page: createPage({ hideBackButton: true }),
    });
    render(
      <div onKeyDown={onKeyDown}>
        <CustomizedPagePanel {...props} />
      </div>,
    );

    expect(screen.queryByRole('button', { name: 'back' })).toBeNull();
    expect(PageHeader).toHaveBeenCalledWith(
      expect.objectContaining({ onBackClick: undefined }),
      {},
    );
    const content = screen.getByTestId('customizedPageContent');
    fireEvent.keyDown(content, { key: 'Enter' });
    fireEvent.keyDown(content, { key: 'Escape' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
