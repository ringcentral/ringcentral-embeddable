import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import {
  AppExpandedContent,
  AppFooterNav,
  AppHeaderNav,
  AppProvider,
  useAppFooter,
  useAppHeader,
} from '@ringcentral-integration/micro-core/src/app/components';

import { ExpandedRouteView } from '../../next/app/views/ExpandedRouteView';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => {
  const ReactModule = require('react');
  const AppContext = ReactModule.createContext(null);

  function useAppContext() {
    const context = ReactModule.useContext(AppContext);
    if (!context) {
      throw new Error('AppProvider is required');
    }
    return context;
  }

  function AppProvider({ children }) {
    const [nav, setNav] = ReactModule.useState(null);
    const [footer, setFooter] = ReactModule.useState(null);
    const value = ReactModule.useMemo(
      () => ({ footer, nav, setFooter, setNav }),
      [footer, nav],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
  }

  function AppHeaderNav({ children }) {
    const { setNav } = useAppContext();
    ReactModule.useLayoutEffect(() => {
      setNav(children);
      return () => setNav(null);
    }, [children, setNav]);
    return null;
  }

  function AppFooterNav({ children = null }) {
    const { setFooter } = useAppContext();
    ReactModule.useLayoutEffect(() => {
      setFooter(children);
      return () => setFooter(null);
    }, [children, setFooter]);
    return null;
  }

  function useAppHeader({ defaultNav }) {
    const { nav } = useAppContext();
    return { nav: nav || defaultNav };
  }

  function useAppFooter({ defaultFooter }) {
    const { footer } = useAppContext();
    return { footer: <footer>{footer || defaultFooter}</footer> };
  }

  return {
    AppExpandedContent: jest.fn(({ children }) => (
      <aside data-sign="appExpandedContent">{children}</aside>
    )),
    AppFooterNav,
    AppHeaderNav,
    AppProvider,
    useAppFooter,
    useAppHeader,
  };
});

function OuterChrome({ children }) {
  const { nav } = useAppHeader({ defaultNav: 'Default header' });
  const { footer } = useAppFooter({ defaultFooter: 'Default footer' });

  return (
    <>
      <div data-sign="outerHeader">{nav}</div>
      {children}
      <div data-sign="outerFooter">{footer}</div>
    </>
  );
}

function Background() {
  return (
    <>
      <AppHeaderNav>Master header</AppHeaderNav>
      <div data-sign="masterPage">Master page</div>
      <AppFooterNav>Master footer</AppFooterNav>
    </>
  );
}

function Detail({ label = 'Detail page', onBack }) {
  return (
    <>
      <AppHeaderNav>
        <button type="button" onClick={onBack}>
          Back
        </button>
        Detail header
      </AppHeaderNav>
      <div data-sign="detailPage">{label}</div>
      <AppFooterNav>Detail footer</AppFooterNav>
    </>
  );
}

function renderExpandedRoute({ expanded }) {
  const root = {
    expanded,
    setExpanded: jest.fn(),
  };
  const view = new ExpandedRouteView(root);
  const Component = view.component.bind(view);
  const onBack = jest.fn();

  const renderTree = (
    label = 'Detail page',
    routeKey = 'initial-detail-route',
  ) => (
    <AppProvider>
      <OuterChrome>
        <Component
          key={routeKey}
          background={<Background />}
          detail={<Detail label={label} onBack={onBack} />}
        />
      </OuterChrome>
    </AppProvider>
  );
  const renderResult = render(renderTree());

  return {
    onBack,
    rerenderDetail: (label) =>
      renderResult.rerender(renderTree(label, 'other-detail-route')),
    root,
  };
}

describe('ExpandedRouteView', () => {
  beforeEach(() => {
    AppExpandedContent.mockClear();
  });

  test('keeps the master page in the main column and isolates detail chrome', () => {
    const { root } = renderExpandedRoute({ expanded: true });

    expect(screen.getByTestId('masterPage')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('outerHeader')).getByText('Master header'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('outerFooter')).getByText('Master footer'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('expandedRouteHeader')).getByText(
        'Detail header',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('expandedRouteFooter')).getByText(
        'Detail footer',
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('appExpandedContent')).getByTestId(
        'detailPage',
      ),
    ).toBeInTheDocument();
    expect(AppExpandedContent).toHaveBeenCalledTimes(1);
    expect(root.setExpanded).not.toHaveBeenCalled();
  });

  test('keeps detail content in the expanded column when its route remounts', () => {
    const { rerenderDetail, root } = renderExpandedRoute({ expanded: true });

    rerenderDetail('Other detail page');

    expect(screen.queryByText('Detail page')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('appExpandedContent')).getByText(
        'Other detail page',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('appExpandedContent')).toHaveLength(1);
    expect(root.setExpanded).not.toHaveBeenCalled();
  });

  test('keeps the detail header in the outer page context when folded', () => {
    const { onBack, root } = renderExpandedRoute({ expanded: false });

    expect(screen.queryByTestId('masterPage')).not.toBeInTheDocument();
    expect(screen.getByTestId('detailPage')).toBeInTheDocument();
    expect(screen.queryByTestId('appExpandedContent')).not.toBeInTheDocument();
    expect(screen.queryByTestId('expandedRoutePage')).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('outerHeader')).getByText('Detail header'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('outerFooter')).getByText('Detail footer'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Default header')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(root.setExpanded).not.toHaveBeenCalled();
  });
});
