import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { CustomizedPageView } from '../../src/app/views/CustomizedPageView';

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components/AppContext/AppFooter',
  () => ({
    AppFooterNav: ({ children }) => children,
  }),
);

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components/AppContext/AppHeader',
  () => ({
    AppHeaderNav: ({ children }) => children,
  }),
);

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: ({ children, endAdornment, onBackClick }) => (
    <header>
      {onBackClick ? (
        <button type="button" aria-label="back" onClick={onBackClick}>
          Back
        </button>
      ) : null}
      {children}
      {endAdornment}
    </header>
  ),
}));

describe('CustomizedPageView', () => {
  test('connects route actions to the third-party service', () => {
    const page = {
      id: 'custom-page',
      title: 'Custom page',
      type: 'page',
      schema: { type: 'object' },
      uiSchema: { submitButtonOptions: { submitText: 'Save page' } },
      formData: { name: 'Ada' },
    };
    const thirdParty = {
      getCustomizedPage: jest.fn(() => page),
      onClickButtonInCustomizedPage: jest.fn(async () => {}),
      onCustomizedPageInputChanged: jest.fn(async () => {}),
      onClickCustomizedTabAction: jest.fn(async () => {}),
    };
    const router = {
      goBack: jest.fn(),
    };
    const view = new CustomizedPageView(thirdParty, router);
    const Component = view.component.bind(view);

    render(
      <Component
        match={{ params: { pageId: 'custom-page' } }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change form' }));
    fireEvent.click(screen.getByRole('button', { name: 'Custom action' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save page' }));

    expect(router.goBack).toHaveBeenCalledTimes(1);
    expect(thirdParty.onCustomizedPageInputChanged).toHaveBeenCalledWith({
      pageId: 'custom-page',
      formData: { name: 'Updated' },
      keys: ['name'],
    });
    expect(thirdParty.onClickButtonInCustomizedPage).toHaveBeenCalledWith(
      'custom',
      'button',
      { name: 'Updated' },
    );
    expect(thirdParty.onClickButtonInCustomizedPage).toHaveBeenCalledWith(
      'custom-page',
      'submit',
      { name: 'Updated' },
    );
  });

  test('renders nothing until the registered page is available', () => {
    const view = new CustomizedPageView(
      {
        getCustomizedPage: jest.fn(() => undefined),
      },
      {},
    );
    const Component = view.component.bind(view);
    const { container } = render(
      <Component match={{ params: { pageId: 'missing' } }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('provides the host page title for its side widget tab', () => {
    const pages = { crm: { id: 'crm', title: 'CRM record' }, blank: { id: 'blank', title: '' } };
    const view = new CustomizedPageView(
      { getCustomizedPage: jest.fn((id) => pages[id]) },
      {},
    );

    expect(view.getPageTitle('crm')).toBe('CRM record');
    expect(view.getPageTitle('blank')).toBeUndefined();
    expect(view.getPageTitle('missing')).toBeUndefined();
  });
});
