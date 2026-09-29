import { Subject } from 'rxjs';

const mockExpandRequests$ = new Subject();

jest.mock('@ringcentral-integration/next-core', () => ({
  ...jest.requireActual('../test/mocks/nextCoreMock'),
  fromWatch: jest.fn(() => mockExpandRequests$),
  PortManager: class PortManager {},
}));

jest.mock('../src/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

jest.mock('../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('../src/app/services/Adapter', () => ({
  Adapter: class Adapter {},
}));

jest.mock('../src/app/services/TabManager', () => ({
  TabManager: class TabManager {},
}));

import { PopupLayoutFit } from '../src/app/services/PopupLayoutFit';

function setWindowWidth(width) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function resizeWindow(width) {
  setWindowWidth(width);
  window.dispatchEvent(new Event('resize'));
}

function createPopupLayoutFit({ fromPopup = true, minExpandedWidth = 360 } = {}) {
  const expandedView = {
    expandRequests: 0,
    setFitsExpandedLayout: jest.fn().mockResolvedValue(undefined),
  };
  const adapter = { requestPopupWindowWidth: jest.fn() };
  const popupLayoutFit = new PopupLayoutFit(
    expandedView,
    { shared: false },
    { fromPopup },
    adapter,
    { minExpandedWidth },
  );
  return { adapter, expandedView, popupLayoutFit };
}

describe('PopupLayoutFit', () => {
  let current;

  afterEach(() => {
    current?.popupLayoutFit.onReset();
    current = undefined;
  });

  test('keeps both columns in a 500px window while a tab wants a wider panel', () => {
    setWindowWidth(500);
    current = createPopupLayoutFit({ minExpandedWidth: 360 });

    current.popupLayoutFit.onInit();

    expect(current.expandedView.setFitsExpandedLayout).toHaveBeenCalledWith(
      true,
      { windowOpened: true },
    );
  });

  test('folds a window narrower than 500px, reporting only changes', () => {
    setWindowWidth(660);
    current = createPopupLayoutFit();
    current.popupLayoutFit.onInit();
    current.expandedView.setFitsExpandedLayout.mockClear();

    resizeWindow(560);
    resizeWindow(499);
    resizeWindow(400);

    expect(current.expandedView.setFitsExpandedLayout.mock.calls).toEqual([
      [false, { windowOpened: false }],
    ]);
  });

  test('grows the window to the width the open tabs want', () => {
    setWindowWidth(300);
    current = createPopupLayoutFit({ minExpandedWidth: 360 });
    current.popupLayoutFit.onInit();

    mockExpandRequests$.next(1);

    expect(current.adapter.requestPopupWindowWidth).toHaveBeenCalledWith(660);
  });

  test('does not bind outside the popup window', () => {
    setWindowWidth(300);
    current = createPopupLayoutFit({ fromPopup: false });

    current.popupLayoutFit.onInit();
    mockExpandRequests$.next(1);

    expect(current.expandedView.setFitsExpandedLayout).not.toHaveBeenCalled();
    expect(current.adapter.requestPopupWindowWidth).not.toHaveBeenCalled();
  });
});
