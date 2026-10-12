import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { ApplicationLogsView } from '../../src/app/views/ApplicationLogsView/ApplicationLogs.view';
import { ApplicationLogsPanel } from '../../src/app/views/ApplicationLogsView/ApplicationLogsPanel';

jest.mock(
  '../../src/app/views/ApplicationLogsView/ApplicationLogsPanel',
  () => ({ ApplicationLogsPanel: jest.fn(() => null) }),
);

jest.mock('../../src/app/views/ApplicationLogsView/i18n', () => ({
  __esModule: true,
  default: { getString: (key) => key },
}));

jest.mock('@ringcentral-integration/micro-core/src/app/services', () => ({
  BrowserLogger: class BrowserLogger {},
  Toast: class Toast {},
}));

function renderView(view) {
  const Component = () => view.component();
  return render(<Component />);
}

describe('ApplicationLogsView', () => {
  beforeEach(() => {
    ApplicationLogsPanel.mockClear();
  });

  test('connects download state and navigation', () => {
    const browserLogger = { downloading: true, saveLog: jest.fn() };
    const router = { goBack: jest.fn() };
    const toast = { danger: jest.fn(), success: jest.fn() };
    const view = new ApplicationLogsView(browserLogger, router, toast);
    renderView(view);

    const props = ApplicationLogsPanel.mock.calls[0][0];
    expect(props.isDownloading).toBe(true);
    props.onBack();
    expect(router.goBack).toHaveBeenCalledTimes(1);
  });

  test('downloads logs locally and reports success', async () => {
    const browserLogger = {
      downloading: false,
      saveLog: jest.fn().mockResolvedValue(undefined),
    };
    const toast = { danger: jest.fn(), success: jest.fn() };
    const view = new ApplicationLogsView(
      browserLogger,
      { goBack: jest.fn() },
      toast,
    );
    renderView(view);

    ApplicationLogsPanel.mock.calls[0][0].onDownload();

    await waitFor(() => {
      expect(browserLogger.saveLog).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith({
        message: 'downloadSuccess',
      });
    });
    expect(toast.danger).not.toHaveBeenCalled();
  });

  test('reports a local download failure without submitting anything', async () => {
    const error = new Error('storage unavailable');
    const browserLogger = {
      downloading: false,
      saveLog: jest.fn().mockRejectedValue(error),
    };
    const toast = { danger: jest.fn(), success: jest.fn() };
    const view = new ApplicationLogsView(
      browserLogger,
      { goBack: jest.fn() },
      toast,
    );
    renderView(view);

    ApplicationLogsPanel.mock.calls[0][0].onDownload();

    await waitFor(() => {
      expect(toast.danger).toHaveBeenCalledWith({
        message: 'downloadFailure',
      });
    });
    expect(view.logger.error).toHaveBeenCalledWith(
      'Failed to download application logs',
      error,
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
