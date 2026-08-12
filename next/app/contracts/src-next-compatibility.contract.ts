type CompatibilitySurface =
  | 'runtime-option'
  | 'adapter-message'
  | 'adapter-event'
  | 'adapter-request'
  | 'route'
  | 'integration';

type CompatibilityStatus =
  | 'verified'
  | 'implemented'
  | 'partial'
  | 'unsupported'
  | 'removed';

type CompatibilityRisk = 'critical' | 'high' | 'normal';

interface CompatibilityEntry {
  readonly id: string;
  readonly surface: CompatibilitySurface;
  readonly legacyNames: readonly string[];
  readonly status: CompatibilityStatus;
  readonly risk: CompatibilityRisk;
  readonly verification: readonly string[];
  readonly nextAction?: string;
  readonly decision?: string;
}

interface SrcNextCompatibilityContract {
  readonly policyVersion: 1;
  readonly source: 'src';
  readonly target: 'next';
  readonly statuses: Readonly<Record<CompatibilityStatus, string>>;
  readonly entries: readonly CompatibilityEntry[];
}

/**
 * Source-of-truth classification for public behavior that must be considered
 * before the legacy `src` application can be replaced by `next`.
 */
export const srcNextCompatibilityContract: SrcNextCompatibilityContract = {
  policyVersion: 1,
  source: 'src',
  target: 'next',
  statuses: {
    verified:
      'Behavioral parity is protected by an automated compatibility test.',
    implemented:
      'Target behavior exists but legacy parity is not yet contract-tested.',
    partial:
      'Some target behavior exists, but the legacy contract is incomplete.',
    unsupported: 'The legacy contract has no effective target behavior.',
    removed:
      'A reviewed compatibility decision explicitly removes the contract.',
  },
  entries: [
    {
      id: 'runtime.sdk-identity',
      surface: 'runtime-option',
      legacyNames: [
        'appKey',
        'clientId',
        'appSecret',
        'clientSecret',
        'prefix',
      ],
      status: 'verified',
      risk: 'critical',
      verification: [
        'test/next/adapterAuthentication.test.js',
        'test/next/createAppAuthentication.test.js',
        'test/next/runtimeSdkConfig.test.js',
      ],
    },
    {
      id: 'runtime.app-server',
      surface: 'runtime-option',
      legacyNames: ['appServer'],
      status: 'verified',
      risk: 'critical',
      verification: [
        'test/next/adapterAuthentication.test.js',
        'test/next/createAppAuthentication.test.js',
        'test/next/runtimeSdkConfig.test.js',
      ],
    },
    {
      id: 'runtime.host-shell',
      surface: 'runtime-option',
      legacyNames: [
        'defaultDirection',
        'disableMinimize',
        'enablePopup',
        'newAdapterUI',
        'notification',
        'popupPageUri',
        'zIndex',
      ],
      status: 'implemented',
      risk: 'normal',
      verification: [],
      nextAction: 'Add host adapter DOM and popup behavior contract tests.',
    },
    {
      id: 'runtime.shared-worker-tab-selection',
      surface: 'runtime-option',
      legacyNames: ['fromPopup', 'mainTab'],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Verify legacy active-tab and forced-webphone behavior against TabManager and PortManager.',
    },
    {
      id: 'runtime.next-feature-flags',
      surface: 'runtime-option',
      legacyNames: [
        'disableNoiseReduction',
        'enableSideWidget',
        'enableVoicemailDrop',
      ],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Add URL-to-feature behavior tests and preserve extension-specific noise-reduction defaults.',
    },
    {
      id: 'runtime.smart-note',
      surface: 'runtime-option',
      legacyNames: ['enableSmartNote'],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Connect the visible Smart Notes surface and test enabled and disabled states.',
    },
    {
      id: 'runtime.authentication',
      surface: 'runtime-option',
      legacyNames: [
        'authorizationCode',
        'authorizationCodeVerifier',
        'authProxy',
        'disableLoginPopup',
        'externalAuthId',
        'jwt',
        'jwtOwnerId',
        'proxyUri',
        'redirectUri',
      ],
      status: 'partial',
      risk: 'critical',
      verification: [
        'test/next/adapterAuthentication.test.js',
        'test/next/authenticationConfig.test.js',
        'test/next/authenticationService.test.js',
        'test/next/authCompatibility.test.js',
        'test/next/oauthCompatibility.test.js',
        'test/next/createAppAuthentication.test.js',
      ],
      nextAction:
        'Add real-DI browser coverage for direct iframe and adapter flows, then decide proxyUri and the unsupported next-only jwtOwnerId input.',
    },
    {
      id: 'runtime.feature-availability',
      surface: 'runtime-option',
      legacyNames: [
        'disableCall',
        'disableCallHistory',
        'disableConferenceInvite',
        'disableContacts',
        'disableGlip',
        'disableMeeting',
        'disableMessages',
        'disableReadText',
        'enableAudioInitPrompt',
        'enableLoadMoreCalls',
        'enableNoiseReductionSetting',
        'enableRingtoneSettings',
        'enableSharedMessages',
        'enableSMSTemplate',
        'showSignUpButton',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Map each flag to typed FeatureConfiguration or an explicit reviewed removal decision.',
    },
    {
      id: 'runtime.calling-behavior',
      surface: 'runtime-option',
      legacyNames: [
        'defaultCallWith',
        'disconnectInactiveWebphone',
        'enableFromNumberSetting',
        'enableRingoutCallerId',
        'enableWebRTCPlanB',
        'multipleTabsSupport',
        'showMyLocationNumbers',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Define next service options for calling and multi-tab behavior and add scenario tests.',
    },
    {
      id: 'runtime.host-integration-behavior',
      surface: 'runtime-option',
      legacyNames: [
        'disableInactiveTabCallEvent',
        'enableSmsSettingEvent',
        'enableTypingTimeTracking',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Restore event filtering and SMS host-integration options with postMessage tests.',
    },
    {
      id: 'runtime.logging-defaults',
      surface: 'runtime-option',
      legacyNames: [
        'defaultAutoLogCallEnabled',
        'defaultAutoLogMessageEnabled',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Map defaults to logger options and verify first-login and persisted behavior.',
    },
    {
      id: 'runtime.external-analytics',
      surface: 'runtime-option',
      legacyNames: ['enableAnalytics'],
      status: 'verified',
      risk: 'high',
      verification: [
        'test/next/analyticsCompatibility.test.js',
        'test/next/createAppAuthentication.test.js',
      ],
    },
    {
      id: 'runtime.branding-analytics-and-style',
      surface: 'runtime-option',
      legacyNames: [
        'appVersion',
        'brand',
        'enableErrorReport',
        'errorReportProjectId',
        'errorReportSampleRate',
        'errorReportToken',
        'stylesUri',
        'userAgent',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Define safe runtime overrides and verify brand, SDK user-agent, style, and telemetry behavior.',
    },
    {
      id: 'runtime.discovery',
      surface: 'runtime-option',
      legacyNames: ['discovery', 'discoverAppServer'],
      status: 'verified',
      risk: 'critical',
      verification: [
        'test/next/adapterAuthentication.test.js',
        'test/next/createAppAuthentication.test.js',
        'test/next/runtimeSdkConfig.test.js',
      ],
    },
    {
      id: 'adapter.core-control',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-login',
        'rc-adapter-logout',
        'rc-adapter-message',
        'rc-adapter-message-response',
        'rc-adapter-set-environment',
        'rc-adapter-set-popup-window-size',
        'rc-adapter-update-ai-assistant-settings',
        'rc-adapter-update-auto-log-settings',
        'rc-adapter-webphone-sessions-sync',
      ],
      status: 'implemented',
      risk: 'high',
      verification: [],
      nextAction:
        'Add payload and side-effect parity tests for every message type.',
    },
    {
      id: 'adapter.incompatible-payloads',
      surface: 'adapter-message',
      legacyNames: [
        'rc-calling-settings-update',
        'rc-adapter-new-sms',
        'rc-adapter-set-phone-number-format',
        'rc-adapter-set-presence',
        'rc-adapter-update-ringtone',
        'rc-sms-settings-update',
      ],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Restore legacy calling, SMS, conversation, presence, ringtone-volume, and formatter payload semantics.',
    },
    {
      id: 'adapter.host-shell-notifications',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-ai-assistant-settings-notify',
        'rc-adapter-goto-presence',
        'rc-adapter-phone-number-format-settings-notify',
        'rc-adapter-side-drawer-open-notify',
        'rc-adapter-theme-notify',
      ],
      status: 'implemented',
      risk: 'normal',
      verification: [],
      nextAction: 'Add host adapter notification-shape tests.',
    },
    {
      id: 'adapter.internal-shell-protocol',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-clickToDial',
        'rc-adapter-clickToSms',
        'rc-adapter-navigateToCurrentCall',
        'rc-adapter-navigateToViewCalls',
        'rc-adapter-presenceClicked',
        'rc-adapter-presenceItemClicked',
        'rc-adapter-pushAdapterState',
        'rc-adapter-pushCalls',
        'rc-adapter-pushLocale',
        'rc-adapter-pushOnAllCallsPath',
        'rc-adapter-pushOnCurrentCallPath',
        'rc-adapter-pushPresence',
        'rc-adapter-pushRingState',
        'rc-adapter-syncClosed',
        'rc-adapter-syncMinimized',
        'rc-adapter-syncPosition',
        'rc-adapter-syncSize',
      ],
      status: 'implemented',
      risk: 'high',
      verification: [],
      nextAction:
        'Add bidirectional host-shell protocol tests for state, navigation, sizing, and click actions.',
    },
    {
      id: 'adapter.third-party-data',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-refresh-license-status',
        'rc-adapter-register-widget-app',
        'rc-adapter-sync-third-party-contacts',
        'rc-adapter-trigger-call-logger-match',
        'rc-adapter-trigger-contact-match',
        'rc-adapter-unregister-widget-app',
      ],
      status: 'implemented',
      risk: 'high',
      verification: [],
      nextAction:
        'Add Adapter-to-ThirdParty integration tests without mocking the message boundary.',
    },
    {
      id: 'adapter.call-control-and-new-call',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-control-call',
        'rc-adapter-new-call',
      ],
      status: 'verified',
      risk: 'critical',
      verification: [
        'test/next/activeCallControlCompatibility.test.js',
        'test/next/adapterCallCompatibility.test.js',
      ],
    },
    {
      id: 'adapter.navigation',
      surface: 'adapter-message',
      legacyNames: ['rc-adapter-navigate-to'],
      status: 'partial',
      risk: 'critical',
      verification: ['test/next/adapterNavigationCompatibility.test.js'],
      nextAction:
        'Migrate the remaining legacy aliases and SideDrawer destinations, then add browser deep-link parity for unsupported paths.',
    },
    {
      id: 'adapter.message-requests',
      surface: 'adapter-message',
      legacyNames: ['rc-adapter-message-request'],
      status: 'partial',
      risk: 'critical',
      verification: ['test/next/adapterRequestCompatibility.test.js'],
      nextAction:
        'Complete success, error, and response-envelope parity for every remaining request endpoint.',
    },
    {
      id: 'adapter.third-party-presentation',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-register-customized-page',
        'rc-adapter-register-third-party-service',
        'rc-adapter-update-authorization-status',
        'rc-adapter-update-call-log-page',
        'rc-adapter-update-customized-banner',
        'rc-adapter-update-messages-log-page',
        'rc-adapter-update-third-party-settings',
      ],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Connect registered state to Spring views and verify visible host interactions.',
    },
    {
      id: 'adapter.authentication-callback',
      surface: 'adapter-message',
      legacyNames: ['rc-adapter-authorization-code'],
      status: 'verified',
      risk: 'critical',
      verification: [
        'test/next/oauthAdapterMessageBoundary.test.js',
        'test/next/oauthCompatibility.test.js',
      ],
    },
    {
      id: 'adapter.missing-commands',
      surface: 'adapter-message',
      legacyNames: [
        'rc-adapter-auto-populate-conversation',
        'rc-adapter-pick-call',
        'rc-adapter-popOut',
        'rc-adapter-set-call-contact-matches-select',
        'rc-adapter-set-side-drawer-extended',
        'rc-adapter-update-features-flags',
        'rc-adapter-update-sms-typing-time-tracking',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Implement each documented command or record a reviewed removal decision.',
    },
    {
      id: 'events.present-but-unverified',
      surface: 'adapter-event',
      legacyNames: [
        'rc-active-call-notify',
        'rc-brand-assets-notify',
        'rc-call-drop-voicemail-notify',
        'rc-call-end-notify',
        'rc-call-history-synced-notify',
        'rc-call-hold-notify',
        'rc-call-init-notify',
        'rc-call-mute-notify',
        'rc-call-resume-notify',
        'rc-call-ring-notify',
        'rc-call-start-notify',
        'rc-callLogger-auto-log-notify',
        'rc-calling-settings-notify',
        'rc-control-call-error',
        'rc-dialer-status-notify',
        'rc-inbound-message-notify',
        'rc-login-status-notify',
        'rc-meeting-status-notify',
        'rc-message-updated-notify',
        'rc-messageLogger-auto-log-notify',
        'rc-post-message',
        'rc-region-settings-notify',
        'rc-ringout-call-notify',
        'rc-route-changed-notify',
        'rc-sms-settings-notify',
        'rc-webphone-active-notify',
        'rc-webphone-connection-status-notify',
        'rc-webphone-sessions-sync',
        'rc-adapter-syncPresence',
      ],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Restore payload shapes, contact matching, duplicate suppression, and inactive-tab delivery before adding event fixtures.',
    },
    {
      id: 'events.login-popup',
      surface: 'adapter-event',
      legacyNames: ['rc-login-popup-notify'],
      status: 'implemented',
      risk: 'critical',
      verification: ['test/next/oauthCompatibility.test.js'],
      nextAction:
        'Verify the host-visible popup event and OAuth URI through a real next application instance.',
    },
    {
      id: 'events.external-analytics',
      surface: 'adapter-event',
      legacyNames: ['rc-analytics-track'],
      status: 'verified',
      risk: 'critical',
      verification: [
        'test/next/analyticsCompatibility.test.js',
        'test/next/createAppAuthentication.test.js',
      ],
    },
    {
      id: 'events.message-thread-updates',
      surface: 'adapter-event',
      legacyNames: [
        'rc-message-thread-entity-notify',
        'rc-message-thread-notify',
      ],
      status: 'unsupported',
      risk: 'critical',
      verification: [],
      nextAction:
        'Expose typed raw incremental thread-info and entry-record streams from MessageThread before restoring the exact host payloads.',
    },
    {
      id: 'events.telephony-session-updates',
      surface: 'adapter-event',
      legacyNames: ['rc-telephony-session-notify'],
      status: 'unsupported',
      risk: 'critical',
      verification: [],
      nextAction:
        'Expose a processed RingCentralCallControl session-data stream, including final disconnected states, before wiring the Adapter event and inactive-tab gate.',
    },
    {
      id: 'requests.present-handlers',
      surface: 'adapter-request',
      legacyNames: [
        '/check-popup-window',
        '/create-sms-template',
        '/dismiss-alert-message',
        '/schedule-meeting',
      ],
      status: 'implemented',
      risk: 'high',
      verification: [],
      nextAction:
        'Add request and response shape parity tests for success and error paths.',
    },
    {
      id: 'requests.custom-alert',
      surface: 'adapter-request',
      legacyNames: ['/custom-alert-message'],
      status: 'partial',
      risk: 'high',
      verification: ['test/next/adapterRequestCompatibility.test.js'],
      nextAction:
        'Restore legacy alert presentation and dismiss semantics, then cover body details and error behavior.',
    },
    {
      id: 'requests.get-call-log',
      surface: 'adapter-request',
      legacyNames: ['/get-call-log'],
      status: 'verified',
      risk: 'high',
      verification: [
        'test/next/adapterRequestCompatibility.test.js',
        'test/next/callLoggerDependencyInjection.test.js',
        'test/next/callLoggerCompatibility.test.js',
      ],
    },
    {
      id: 'requests.unlogged-calls',
      surface: 'adapter-request',
      legacyNames: ['/unlogged-calls'],
      status: 'verified',
      risk: 'high',
      verification: [
        'test/next/adapterRequestCompatibility.test.js',
        'test/next/callLoggerDependencyInjection.test.js',
        'test/next/callLoggerCompatibility.test.js',
      ],
    },
    {
      id: 'routes.exact',
      surface: 'route',
      legacyNames: [
        '/',
        '/composeText',
        '/contacts',
        '/contacts/:contactType/:contactId',
        '/conversations/:conversationId',
        '/dialer',
        '/meeting/schedule',
        '/settings',
        '/settings/audio',
        '/settings/calling',
        '/settings/region',
        '/settings/theme',
        '/settings/voicemailDrop',
      ],
      status: 'implemented',
      risk: 'normal',
      verification: [],
      nextAction: 'Add authenticated route rendering and deep-link tests.',
    },
    {
      id: 'routes.consolidated-call-and-meeting',
      surface: 'route',
      legacyNames: [
        '/HUD',
        '/calls/active(/:sessionId)',
        '/conferenceCall/callsOnhold/:fromNumber/:fromSessionId',
        '/conferenceCall/dialer/:fromNumber/:fromSessionId',
        '/conferenceCall/participants',
        '/flip/:sessionId',
        '/history(/:type)',
        '/meeting/history(/:type)',
        '/meeting/home',
        '/messages(/:type)',
        '/park/:sessionId',
        '/settings/callQueuePresence',
        '/settings/ringtone',
        '/simplifycallctrl/:sessionId',
        '/transfer/:sessionId(/:type)',
      ],
      status: 'partial',
      risk: 'high',
      verification: ['test/next/adapterNavigationCompatibility.test.js'],
      nextAction:
        'Migrate HUD, conference, flip, park, simplify, transfer, ringtone, call-queue, and typed-history aliases, then verify browser deep links.',
    },
    {
      id: 'routes.missing-product-and-third-party',
      surface: 'route',
      legacyNames: [
        '/customized/:pageId',
        '/customizedTabs/:pageId',
        '/glip',
        '/glip/groups/:groupId',
        '/log/call/:callSessionId',
        '/log/messages/:conversationId',
        '/settings/phoneNumberFormat',
        '/settings/text',
        '/settings/thirdParty/:sectionId',
      ],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Migrate each surface or record a reviewed product-level removal decision.',
    },
    {
      id: 'integration.primary-ringcentral-flows',
      surface: 'integration',
      legacyNames: ['calling', 'contacts', 'meetings', 'messaging'],
      status: 'implemented',
      risk: 'high',
      verification: [],
      nextAction:
        'Add legacy-versus-next browser scenarios for each primary flow.',
    },
    {
      id: 'integration.embeddable-call-features',
      surface: 'integration',
      legacyNames: [
        'hud',
        'noise-reduction',
        'park',
        'side-widget',
        'voicemail-drop',
      ],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Cover settings, permissions, expanded layout, and host callbacks in browser tests.',
    },
    {
      id: 'integration.third-party-service',
      surface: 'integration',
      legacyNames: [
        'additional-actions',
        'authorization-and-settings',
        'custom-banner',
        'custom-pages-and-tabs',
        'do-not-contact',
        'interactive-log-forms',
        'meeting-invite-and-logging',
      ],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Complete Spring view consumers and preserve structured request and response payloads.',
    },
    {
      id: 'integration.smart-notes',
      surface: 'integration',
      legacyNames: ['smart-notes-panel', 'smart-notes-settings'],
      status: 'partial',
      risk: 'high',
      verification: [],
      nextAction:
        'Add the visible panel and settings behavior around the migrated service.',
    },
    {
      id: 'integration.glip',
      surface: 'integration',
      legacyNames: ['glip-team-messaging'],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Obtain a product decision to migrate or intentionally remove Team Messaging.',
    },
    {
      id: 'integration.multi-brand',
      surface: 'integration',
      legacyNames: ['partner-brand-runtime-selection', 'partner-brand-builds'],
      status: 'unsupported',
      risk: 'high',
      verification: [],
      nextAction:
        'Restore partner brand selection and add a next build matrix before deployment cutover.',
    },
  ],
};
