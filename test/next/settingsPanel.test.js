import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { createSettingsPanel } from '../../next/app/views/SettingsView/createSettingsPanel';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: ({ children }) => <header>{children}</header>,
}));

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/components/Section',
  () => ({
    Section: ({ children, label, ...props }) => (
      <section aria-label={label} {...props}>
        {label ? <h2>{label}</h2> : null}
        {children}
      </section>
    ),
  }),
);

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/ClickToDial',
  () => ({ ClickToDial: () => null }),
);

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/PresenceSetting',
  () => ({ PresenceSetting: () => null }),
);

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/SelectToDial',
  () => ({ SelectToDial: () => null }),
);

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  Eula: ({ label }) => <span>{label}</span>,
  Line: ({ children, ...props }) => <div {...props}>{children}</div>,
  LinkLine: ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  RemoveMeetingWarn: () => null,
  SelectLine: ({ children, ...props }) => <div {...props}>{children}</div>,
  SwitchLine: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

function createPanel({ hasVoicemailDropPermission = false } = {}) {
  const voicemailDrop = { hasVoicemailDropPermission };
  const onVoicemailDropSettingsLinkClick = jest.fn();
  const Panel = createSettingsPanel({
    voicemailDrop,
    onVoicemailDropSettingsLinkClick,
  });
  return {
    onVoicemailDropSettingsLinkClick,
    Panel,
    voicemailDrop,
  };
}

const baseProps = {
  brandConfig: {},
  currentLocale: 'en-US',
  eulaLabel: 'terms',
  eulaLink: 'https://example.com/terms',
  loginNumber: '100',
  onLogoutButtonClick: jest.fn(),
  showFeedback: false,
  showPresenceSettings: false,
  showRemoveMeetingWarning: false,
  showTrackingIssue: false,
  version: '1.0.0',
};

describe('SettingsPanel', () => {
  test('renders voicemail drop inside Phone when it is the only phone item', () => {
    const { onVoicemailDropSettingsLinkClick, Panel } = createPanel({
      hasVoicemailDropPermission: true,
    });
    render(<Panel {...baseProps} />);

    const phoneGroup = screen.getByTestId('phone-settings-group');
    const generalGroup = screen.getByTestId('general-settings-group');
    const voicemailDropLink = within(phoneGroup).getByTestId(
      'voicemailDropSettings',
    );

    expect(
      within(generalGroup).queryByTestId('voicemailDropSettings'),
    ).toBeNull();
    fireEvent.click(voicemailDropLink);
    expect(onVoicemailDropSettingsLinkClick).toHaveBeenCalledTimes(1);
  });

  test('hides Phone when it has no visible items', () => {
    const { Panel } = createPanel();
    render(<Panel {...baseProps} />);

    expect(screen.queryByTestId('phone-settings-group')).toBeNull();
  });

  test.each([
    ['matched entities', { showMatchesToggle: true }, 'showMatchedEntities'],
    [
      'inbound call pop-up',
      { showPopUpForInboundCall: true },
      'popUpAppForInboundCall',
    ],
  ])('keeps Phone visible for the %s item', (_, props, itemDataSign) => {
    const { Panel } = createPanel();
    render(<Panel {...baseProps} {...props} />);

    const phoneGroup = screen.getByTestId('phone-settings-group');
    expect(within(phoneGroup).getByTestId(itemDataSign)).toBeInTheDocument();
    expect(
      within(phoneGroup).queryByTestId('voicemailDropSettings'),
    ).toBeNull();
  });

  test('updates Phone visibility with voicemail permission', () => {
    const { Panel, voicemailDrop } = createPanel();
    const { rerender } = render(<Panel {...baseProps} />);

    expect(screen.queryByTestId('phone-settings-group')).toBeNull();
    voicemailDrop.hasVoicemailDropPermission = true;
    rerender(<Panel {...baseProps} />);

    expect(screen.getByTestId('phone-settings-group')).toBeInTheDocument();
    expect(screen.getByTestId('voicemailDropSettings')).toBeInTheDocument();
  });
});
