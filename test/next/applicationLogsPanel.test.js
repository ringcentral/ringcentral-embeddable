import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ApplicationLogsPanel } from '../../next/app/views/ApplicationLogsView/ApplicationLogsPanel';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppFooterNav: ({ children }) => <footer>{children}</footer>,
  AppHeaderNav: ({ children }) => <div>{children}</div>,
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: ({ children, onBackClick }) => (
    <header>
      <button type="button" aria-label="back" onClick={onBackClick}>
        Back
      </button>
      {children}
    </header>
  ),
}));

describe('ApplicationLogsPanel', () => {
  test('explains local-only sharing and downloads logs', () => {
    const onBack = jest.fn();
    const onDownload = jest.fn();
    render(
      <ApplicationLogsPanel
        isDownloading={false}
        onBack={onBack}
        onDownload={onDownload}
      />,
    );

    expect(screen.getByText('localOnly')).toBeInTheDocument();
    expect(screen.getByText('shareInstructions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'download' }));
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  test('disables the download action while logs are being prepared', () => {
    render(
      <ApplicationLogsPanel
        isDownloading
        onBack={jest.fn()}
        onDownload={jest.fn()}
      />,
    );

    const downloadButton = screen.getByRole('button', { name: 'download' });
    expect(downloadButton).toBeDisabled();
    expect(downloadButton).toHaveAttribute('data-loading', 'true');
  });
});
