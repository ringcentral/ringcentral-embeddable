import { render } from '@testing-library/react';
import React from 'react';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  useAppFooter: () => ({ footer: null }),
  useAppHeader: () => ({ nav: null }),
}));

import { SideWidgetContentPage } from '../../src/app/views/SideWidgetView/SideWidgetContentPage';
import { useSideWidgetBack } from '../../src/app/views/SideWidgetView/useSideWidgetBack';

function renderPage(onBack) {
  let back;
  const Page = () => {
    back = useSideWidgetBack();
    return null;
  };
  render(
    <SideWidgetContentPage onBack={onBack} showCloseButton>
      <Page />
    </SideWidgetContentPage>,
  );
  return back;
}

describe('SideWidgetContentPage', () => {
  test("hands the tab's back to the page, for a back the page triggers itself", () => {
    const onBack = jest.fn();

    renderPage(onBack)();

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('leaves a page that keeps its own back navigation alone', () => {
    expect(renderPage(undefined)).toBeNull();
  });

  test('has no back outside a side widget tab', () => {
    let back;
    const Page = () => {
      back = useSideWidgetBack();
      return null;
    };
    render(<Page />);

    expect(back).toBeNull();
  });
});
