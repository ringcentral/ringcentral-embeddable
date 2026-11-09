import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { t } from '../../src/app/i18n';
import { CustomizedPageView } from '../../src/app/views/CustomizedPageView';

jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  ...jest.requireActual('@ringcentral-integration/micro-phone/src/app/services'),
  CALLING_ROUTE_PATH: '/calling',
}));

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

/** next-core binds these on a real module; the mock's `autobind` does not. */
function bindView(view) {
  view.CustomizedPage = view.CustomizedPage.bind(view);
  return view;
}

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
    const view = bindView(new CustomizedPageView(thirdParty, router));
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
    const view = bindView(
      new CustomizedPageView(
        {
          getCustomizedPage: jest.fn(() => undefined),
        },
        {},
      ),
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

describe('CustomizedPageView from the call page', () => {
  const pages = {
    crm: {
      id: 'crm',
      title: 'CRM record',
      type: 'page',
      schema: { type: 'object' },
      uiSchema: {},
      formData: {},
    },
  };

  function createRouter(currentPath = '/calling') {
    return {
      currentPath,
      goBack: jest.fn(),
      push: jest.fn().mockResolvedValue(undefined),
    };
  }

  function createSideWidgetView() {
    const handles = [];
    return {
      handles,
      createContent: jest.fn((options) => {
        const handle = { options };
        handles.push(handle);
        return handle;
      }),
      openContent: jest.fn(),
      closeTabFromPanel: jest.fn().mockResolvedValue(undefined),
    };
  }

  function createView({ router = createRouter(), sideWidgetView } = {}) {
    const thirdParty = {
      getCustomizedPage: jest.fn((id) => pages[id]),
      onClickButtonInCustomizedPage: jest.fn(async () => {}),
      onCustomizedPageInputChanged: jest.fn(async () => {}),
      onClickCustomizedTabAction: jest.fn(async () => {}),
    };
    return bindView(new CustomizedPageView(thirdParty, router, sideWidgetView));
  }

  test('opens the page in a side widget tab and stays on the call page', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await expect(view.openCustomizedPage('/customized/crm')).resolves.toBe(
      true,
    );

    expect(handle.options).toEqual(
      expect.objectContaining({
        id: 'call-page-customized-page',
        scope: 'global',
      }),
    );
    expect(handle.options.getName()).toBe('CRM record');
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle);
    expect(router.push).not.toHaveBeenCalled();
  });

  test('routes to the page outside the call page', async () => {
    const router = createRouter('/dialer');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await expect(view.openCustomizedPage('/customized/crm')).resolves.toBe(
      true,
    );

    expect(router.push).toHaveBeenCalledWith('/customized/crm');
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();
    expect(sideWidgetView.closeTabFromPanel).not.toHaveBeenCalled();
  });

  test('does not route again to the page the router is already on', async () => {
    const router = createRouter('/customized/crm');
    const view = createView({ router, sideWidgetView: createSideWidgetView() });

    await view.openCustomizedPage('/customized/crm');

    expect(router.push).not.toHaveBeenCalled();
  });

  test('routes to the page when there is no side widget', async () => {
    const router = createRouter('/calling');
    const view = createView({ router });

    await view.openCustomizedPage('/customized/crm');

    expect(router.push).toHaveBeenCalledWith('/customized/crm');
  });

  test.each(['/customizedTabs/crm', '/customized/', '/customized/crm/x', '/dialer'])(
    'leaves %s to the caller',
    async (path) => {
      const router = createRouter('/calling');
      const sideWidgetView = createSideWidgetView();
      const view = createView({ router, sideWidgetView });

      await expect(view.openCustomizedPage(path)).resolves.toBe(false);

      expect(router.push).not.toHaveBeenCalled();
      expect(sideWidgetView.openContent).not.toHaveBeenCalled();
    },
  );

  test('closes the call page tab when the page opens as a routed page', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await view.openCustomizedPage('/customized/crm');
    router.currentPath = '/dialer';
    await view.openCustomizedPage('/customized/crm');

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      'call-page-customized-page',
    );
    expect(router.push).toHaveBeenCalledWith('/customized/crm');
  });

  test('leaves side widget tabs alone once the call page tab closed', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;

    await view.openCustomizedPage('/customized/crm');
    handle.options.onClose(null);
    router.currentPath = '/dialer';
    await view.openCustomizedPage('/customized/crm');

    expect(sideWidgetView.closeTabFromPanel).not.toHaveBeenCalled();
    expect(handle.options.getName()).toBe(t('page'));
  });

  test('closes the tab for the host going back, instead of leaving the call page', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await expect(view.closeCallPageCustomizedPage()).resolves.toBe(false);
    await view.openCustomizedPage('/customized/crm');
    await expect(view.closeCallPageCustomizedPage()).resolves.toBe(true);

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      'call-page-customized-page',
    );
    expect(router.goBack).not.toHaveBeenCalled();
  });

  test('lets the host go back once the router left the call page', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });

    await view.openCustomizedPage('/customized/crm');
    router.currentPath = '/dialer';

    await expect(view.closeCallPageCustomizedPage()).resolves.toBe(false);
    expect(sideWidgetView.closeTabFromPanel).not.toHaveBeenCalled();
  });

  test('renders the page in its tab and closes the tab from the page back button', async () => {
    const router = createRouter('/calling');
    const sideWidgetView = createSideWidgetView();
    const view = createView({ router, sideWidgetView });
    const [handle] = sideWidgetView.handles;
    const TabView = handle.options.view.bind(view);

    await view.openCustomizedPage('/customized/crm');
    render(<TabView showCloseButton />);
    fireEvent.click(screen.getByRole('button', { name: 'back' }));

    expect(sideWidgetView.closeTabFromPanel).toHaveBeenCalledWith(
      'call-page-customized-page',
    );
    expect(router.goBack).not.toHaveBeenCalled();
  });

  test('renders nothing in the tab once it closed', () => {
    const sideWidgetView = createSideWidgetView();
    const view = createView({ sideWidgetView });
    const [handle] = sideWidgetView.handles;
    const TabView = handle.options.view.bind(view);

    const { container } = render(<TabView showCloseButton />);

    expect(container).toBeEmptyDOMElement();
  });
});
