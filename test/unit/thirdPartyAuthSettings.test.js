import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({
    t: (key) => key,
  }),
}));

jest.mock('@ringcentral-integration/jsonschema-spring-page', () => ({
  TextWithMarkdown: ({ text }) => text,
}));

jest.mock('@ringcentral/spring-ui', () => {
  const React = require('react');
  return {
    ...jest.requireActual('@ringcentral/spring-ui'),
    // The shared mock drops `className`, which carries the dot spacing.
    Badge: ({ children, className, color, type }) =>
      React.createElement(
        'span',
        {
          className,
          'data-badge-color': color,
          'data-badge-type': type,
        },
        children,
      ),
  };
});

import { ThirdPartyAuthSettings } from '../../src/app/components/ThirdPartyAuthSettings';

describe('ThirdPartyAuthSettings', () => {
  function renderSettings(props = {}) {
    return render(
      <ThirdPartyAuthSettings
        authorized={false}
        onAuthorize={jest.fn()}
        onLicenseRefresh={jest.fn()}
        serviceName="TestService"
        showAuthButton
        unauthorizedTitle="Connect"
        {...props}
      />,
    );
  }

  test('keeps the auth red dot clear of the row edge', () => {
    renderSettings({ showAuthRedDot: true });

    const badge = screen.getByText('Connect').closest('button').parentElement;

    expect(badge).toHaveAttribute('data-badge-type', 'dot');
    expect(badge).toHaveAttribute('data-badge-color', 'danger');
    expect(badge).toHaveClass('mr-1', 'flex-none');
  });

  test('renders no red dot once authorized', () => {
    renderSettings({ authorized: true, showAuthRedDot: true });

    screen.getByText('unauthorize');

    expect(document.querySelector('[data-badge-type="dot"]')).toBeNull();
  });
});
