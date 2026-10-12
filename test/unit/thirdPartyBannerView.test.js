import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ThirdPartyBannerView } from '../../src/app/views/ThirdPartyBannerView';

function createView(customizedBanner = null) {
  const thirdParty = {
    customizedBanner,
    onBannerAction: jest.fn(),
    onBannerClose: jest.fn(),
  };
  const view = new ThirdPartyBannerView(thirdParty);
  const Component = () => view.component();
  return { Component, thirdParty };
}

describe('ThirdPartyBannerView', () => {
  test('does not render without a registered banner', () => {
    const { Component } = createView();
    const { container } = render(<Component />);

    expect(container).toBeEmptyDOMElement();
  });

  test('renders banner content and delegates its action', () => {
    const { Component, thirdParty } = createView({
      id: 'recording-error',
      message: 'Recording failed. Please try again.',
      severity: 'error',
      action: {
        label: 'Stop recording',
        variant: 'contained',
        color: 'danger.b04',
      },
    });
    render(<Component />);

    const banner = screen.getByTestId('thirdPartyBanner-recording-error');
    expect(banner).toHaveAttribute('data-spring-component', 'Announcement');
    expect(banner).toHaveAttribute('data-icon-hidden', 'true');
    expect(banner).toHaveAttribute('data-severity', 'error');
    expect(
      screen.getByText('Recording failed. Please try again.'),
    ).toBeInTheDocument();
    const action = screen.getByRole('button', { name: 'Stop recording' });
    expect(action).toHaveAttribute('variant', 'contained');
    expect(action).toHaveAttribute('color', 'danger');

    fireEvent.click(action);

    expect(thirdParty.onBannerAction).toHaveBeenCalledTimes(1);
  });

  test('renders a localized close action and delegates dismissal', () => {
    const { Component, thirdParty } = createView({
      id: 'connection-warning',
      message: 'CRM connection lost',
      severity: 'warning',
      closable: true,
    });
    render(<Component />);

    const closeButton = screen.getByRole('button', { name: 'close' });
    fireEvent.click(closeButton);

    expect(thirdParty.onBannerClose).toHaveBeenCalledTimes(1);
  });

  test('renders routine informational banners with neutral severity', () => {
    const { Component } = createView({
      id: 'information',
      message: 'CRM synchronization is enabled',
      severity: 'info',
    });
    render(<Component />);

    expect(screen.getByRole('alert')).toHaveAttribute(
      'data-severity',
      'neutral',
    );
  });

  test('uses a custom close label and announcement defaults', () => {
    const { Component } = createView({
      id: 'announcement',
      message: 'Scheduled maintenance',
      severity: 'announcement',
      closable: true,
      closeButtonLabel: 'Dismiss announcement',
    });
    render(<Component />);

    expect(screen.getByRole('alert')).toHaveAttribute('data-severity', 'info');
    expect(
      screen.getByRole('button', { name: 'Dismiss announcement' }),
    ).toHaveAttribute('data-variant', 'inverted');
  });

  test('normalizes legacy plain actions and unknown colors', () => {
    const { Component } = createView({
      id: 'retry',
      message: 'Retry the operation',
      severity: 'info',
      action: {
        label: 'Retry',
        variant: 'plain',
        color: 'custom-color',
      },
    });
    render(<Component />);

    const action = screen.getByRole('button', { name: 'Retry' });
    expect(action).toHaveAttribute('variant', 'text');
    expect(action).toHaveAttribute('color', 'primary');
  });
});
