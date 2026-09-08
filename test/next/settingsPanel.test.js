import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { createSettingsPanel } from '../../next/app/views/SettingsView/createSettingsPanel';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: ({ children }) => <header>{children}</header>,
}));

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/components/Section',
  () => ({
    Section: ({ children, headerEndAdornment, label, ...props }) => (
      <section aria-label={label} {...props}>
        {label ? <h2>{label}</h2> : null}
        {headerEndAdornment}
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
  SwitchLine: ({ children, checked, disabled, onChange, ...props }) => (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => onChange?.(!checked)}
      {...props}
    >
      {children}
    </div>
  ),
}));

function createPanel({
  hasVoicemailDropPermission = false,
  smartNotes: smartNotesOverrides = {},
  thirdParty: thirdPartyOverrides = {},
} = {}) {
  const thirdParty = {
    authorizationLogo: null,
    authorizationLinks: [],
    authorizationRegistered: false,
    authorized: null,
    authorizedAccount: null,
    authorizedTitle: '',
    authorizeService: jest.fn(),
    contactSyncing: false,
    displayName: null,
    licenseDescription: '',
    licenseStatus: '',
    licenseStatusColor: '',
    onClickLicenseRefreshButton: jest.fn(),
    serviceInfo: null,
    serviceName: null,
    showAuthButton: false,
    showAuthRedDot: false,
    unauthorizedTitle: '',
    ...thirdPartyOverrides,
  };
  const smartNotes = {
    autoStartSmartNote: false,
    autoStartSmartNoteReadOnly: false,
    autoStartSmartNoteReadOnlyReason: '',
    clientInitialized: false,
    hasPermission: false,
    showSmartNote: true,
    toggleAutoStartSmartNote: jest.fn(),
    ...smartNotesOverrides,
  };
  const voicemailDrop = { hasVoicemailDropPermission };
  const onVoicemailDropSettingsLinkClick = jest.fn();
  const Panel = createSettingsPanel({
    smartNotes,
    thirdParty,
    voicemailDrop,
    onVoicemailDropSettingsLinkClick,
  });
  return {
    onVoicemailDropSettingsLinkClick,
    Panel,
    smartNotes,
    thirdParty,
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
  test('renders registered third-party service information and actions first', () => {
    const { Panel, thirdParty } = createPanel({
      thirdParty: {
        authorizationLogo: 'https://example.com/crm.png',
        authorizationLinks: [
          { label: 'Support', uri: 'https://example.com/support' },
          { label: 'Terms', uri: 'https://example.com/terms' },
        ],
        authorizationRegistered: true,
        authorized: true,
        authorizedAccount: 'user@example.com',
        authorizedTitle: 'Disconnect',
        displayName: 'Example CRM',
        licenseDescription:
          'Manage the license at [Support](https://example.com).',
        licenseStatus: 'License active',
        licenseStatusColor: 'success.f02',
        serviceInfo: 'CRM contacts and activity synchronization',
        serviceName: 'example-crm',
        showAuthButton: true,
      },
    });
    render(<Panel {...baseProps} showAudio />);

    const thirdPartyGroup = screen.getByTestId(
      'third-party-auth-settings-group',
    );
    const phoneGroup = screen.getByTestId('phone-settings-group');
    expect(
      thirdPartyGroup.compareDocumentPosition(phoneGroup) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const thirdPartySetting = screen.getByTestId('thirdPartyAuthSetting');
    expect(thirdPartySetting).toHaveClass('!px-0');
    expect(thirdPartySetting.firstElementChild).toHaveClass('!px-0', '!pb-0');
    expect(screen.getByText('Example CRM')).toBeInTheDocument();
    expect(
      screen.getByText('Example CRM').parentElement?.parentElement,
    ).toHaveClass('ml-0');
    expect(screen.getByText('connectedAs')).toHaveClass('truncate');
    expect(screen.getByText('connectedAs')).toHaveAttribute(
      'title',
      'connectedAs',
    );
    const serviceInfo = screen.getByText(
      'CRM contacts and activity synchronization',
    );
    expect(serviceInfo).toHaveClass('truncate');
    expect(serviceInfo).toHaveAttribute(
      'title',
      'CRM contacts and activity synchronization',
    );
    expect(screen.getByText('License active')).toHaveClass('text-success-f');
    expect(screen.getByRole('img', { name: 'Example CRM' })).toHaveAttribute(
      'src',
      'https://example.com/crm.png',
    );
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    fireEvent.click(screen.getByTestId('thirdPartyLicenseRefresh'));
    expect(thirdParty.authorizeService).toHaveBeenCalledTimes(1);
    expect(thirdParty.onClickLicenseRefreshButton).toHaveBeenCalledTimes(1);
  });

  test('hides third-party service information without authorization', () => {
    const { Panel } = createPanel({
      thirdParty: {
        serviceInfo: 'Hidden service information',
        serviceName: 'example-crm',
      },
    });
    render(<Panel {...baseProps} />);

    expect(screen.queryByTestId('third-party-auth-settings-group')).toBeNull();
    expect(screen.queryByText('Hidden service information')).toBeNull();
  });

  test('hides the third-party service logo when it fails to load', () => {
    const { Panel } = createPanel({
      thirdParty: {
        authorizationLogo: 'https://example.com/missing-logo.png',
        authorizationRegistered: true,
        serviceName: 'Example CRM',
      },
    });
    render(<Panel {...baseProps} />);

    const serviceLogo = screen.getByRole('img', { name: 'Example CRM' });
    fireEvent.error(serviceLogo);

    expect(
      screen.queryByRole('img', { name: 'Example CRM' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Example CRM')).toBeInTheDocument();
  });

  test('renders the configured unauthorized action with its attention badge', () => {
    const { Panel } = createPanel({
      thirdParty: {
        authorizationRegistered: true,
        authorized: false,
        serviceName: 'example-crm',
        showAuthButton: true,
        showAuthRedDot: true,
        unauthorizedTitle: 'Connect CRM',
      },
    });
    render(<Panel {...baseProps} />);

    const connectButton = screen.getByRole('button', { name: 'Connect CRM' });
    expect(connectButton.parentElement).toHaveAttribute(
      'data-badge-color',
      'danger',
    );
    expect(connectButton.parentElement).toHaveAttribute(
      'data-badge-type',
      'dot',
    );
  });

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

  test('renders the message logging setting and its managed reason', () => {
    const { Panel } = createPanel();
    render(
      <Panel
        {...baseProps}
        autoLogSMSEnabled
        autoLogSMSReadOnlyReason="Managed by an administrator"
        autoLogSMSTitle="CRM message logging"
        disableAutoLogSMSEnabled
        showAutoLogSMS
      />,
    );

    const setting = screen.getByTestId('AutoLogSMS');
    expect(setting).toHaveTextContent('CRM message logging');
    expect(setting).toHaveAttribute('aria-checked', 'true');
    expect(setting).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('AutoLogSMS-info')).toBeInTheDocument();
  });

  test('renders the call logging setting and its third-party policy', () => {
    const { Panel } = createPanel();
    render(
      <Panel
        {...baseProps}
        autoLogDescription="Log every call"
        autoLogEnabled
        autoLogReadOnlyReason="Managed by an administrator"
        autoLogTitle="CRM call logging"
        disableAutoLogEnabled
        showAutoLog
      />,
    );

    const setting = screen.getByTestId('AutoLogCall');
    expect(setting).toHaveTextContent('CRM call logging');
    expect(setting).toHaveAttribute('aria-checked', 'true');
    expect(setting).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('AutoLogCall-info')).toBeInTheDocument();
    expect(screen.getByTestId('log-settings-group')).toBeInTheDocument();
  });

  test('hides the Log group when its additional-items fragment is empty', () => {
    const { Panel } = createPanel();
    render(<Panel {...baseProps} additionalLogItems={<></>} />);

    expect(screen.queryByTestId('log-settings-group')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'log' })).toBeNull();
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

  test('shows the legacy AI Assistant auto-start setting when ready', () => {
    const { Panel, smartNotes } = createPanel({
      smartNotes: {
        autoStartSmartNote: true,
        clientInitialized: true,
        hasPermission: true,
      },
    });
    render(<Panel {...baseProps} />);

    const setting = screen.getByTestId('AIAssistantAutoStart');
    expect(setting).toHaveAttribute('role', 'switch');
    expect(setting).toHaveAttribute('aria-checked', 'true');
    expect(setting).toHaveTextContent('autoStartAiAssistant');
    fireEvent.click(setting);
    expect(smartNotes.toggleAutoStartSmartNote).toHaveBeenCalledTimes(1);
  });

  test('hides the AI Assistant setting until permission and client initialization', () => {
    const { Panel, smartNotes } = createPanel({
      smartNotes: { hasPermission: true },
    });
    const { rerender } = render(<Panel {...baseProps} />);
    expect(screen.queryByTestId('AIAssistantAutoStart')).toBeNull();

    smartNotes.clientInitialized = true;
    rerender(<Panel {...baseProps} />);
    expect(screen.getByTestId('AIAssistantAutoStart')).toBeInTheDocument();
  });
});
