import React from 'react';
import { render, screen } from '@testing-library/react';

import { HeaderPanel as BaseHeaderPanel } from '@ringcentral-integration/micro-core/src/app/views/HeaderView/HeaderPanel';

import { HeaderPanel } from '../src/app/views/HeaderView/HeaderPanel';

jest.mock(
  '@ringcentral-integration/micro-core/src/app/views/HeaderView/HeaderPanel',
  () => ({
    HeaderPanel: jest.fn(({ children }) => (
      <div data-sign="baseHeaderPanel">{children}</div>
    )),
  }),
);

describe('HeaderPanel', () => {
  beforeEach(() => {
    BaseHeaderPanel.mockClear();
  });

  test('reduces the shared header gap for constrained layouts', () => {
    const props = {
      currentPath: '/customizedTabs/crm-tab',
      currentLocale: 'en-US',
      onCurrentCallBtnClick: jest.fn(),
      onViewCallBtnClick: jest.fn(),
      setAvailable: jest.fn(),
      setBusy: jest.fn(),
      setDoNotDisturb: jest.fn(),
      setInvisible: jest.fn(),
    };

    render(
      <HeaderPanel {...props}>
        <main>Customized tab</main>
      </HeaderPanel>,
    );

    expect(screen.getByTestId('embeddableHeaderPanel')).toHaveClass(
      'contents',
      '[&>div>header>div]:gap-3',
    );
    expect(BaseHeaderPanel).toHaveBeenCalledWith(
      expect.objectContaining(props),
      {},
    );
    expect(screen.getByText('Customized tab')).toBeInTheDocument();
  });
});
