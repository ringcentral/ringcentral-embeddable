import { SettingsView } from '../../next/app/views/SettingsView/Settings.view';

jest.mock('@ringcentral-integration/micro-setting/src/app/views', () => ({
  CallQueueManagementView: class CallQueueManagementView {},
  CPRClientView: class CPRClientView {},
}));

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/views/SettingsView',
  () => ({
    SettingsView: class SettingsView {
      getUIFunctions() {
        return {
          onCallQueueManagementClick: this._callQueueEnabled
            ? jest.fn()
            : undefined,
        };
      }

      trackOnFeedbackClick() {}
    },
  }),
);

jest.mock('@ringcentral-integration/micro-setting/src/app/services', () => ({
  QuickAccess: class QuickAccess {},
  UserGuide: class UserGuide {},
}));

describe('SettingsView', () => {
  function createView({ feedbackHandler, callQueueEnabled = true } = {}) {
    const router = { push: jest.fn().mockResolvedValue(undefined) };
    const view = Object.create(SettingsView.prototype);
    view._callQueueEnabled = callQueueEnabled;
    view._router = router;
    view._settingsViewOptions = feedbackHandler
      ? { onFeedBackSettingsLink: feedbackHandler }
      : undefined;
    view.trackOnFeedbackClick = jest.fn();
    return { router, view };
  }

  test.each([
    ['onRegionSettingsLinkClick', '/settings/region'],
    ['onCallingSettingsLinkClick', '/settings/calling'],
    ['onAutoCallLogSettingLinkClick', '/settings/autoCallLogSettings'],
    ['onAudioSettingsLinkClick', '/settings/audio'],
    ['onFeedbackSettingsLinkClick', '/settings/feedback'],
    ['onTrackingClick', '/settings/issuesTracking'],
    ['onThemeSwitchClick', '/settings/theme'],
    ['onCallQueueManagementClick', '/settings/callQueueManagement'],
  ])('navigates %s directly to the routed detail page', (handler, path) => {
    const { router, view } = createView();

    view.getUIFunctions({})[handler]();

    expect(router.push).toHaveBeenCalledWith(path);
  });

  test('uses configured settings paths', () => {
    const { router, view } = createView();
    const functions = view.getUIFunctions({
      audioSettingsUrl: '/custom/audio',
      autoCallLogSettingsUrl: '/custom/auto-log',
      callingSettingsUrl: '/custom/calling',
      feedbackSettingsUrl: '/custom/feedback',
      regionSettingsUrl: '/custom/region',
    });

    functions.onAudioSettingsLinkClick();
    functions.onAutoCallLogSettingLinkClick();
    functions.onCallingSettingsLinkClick();
    functions.onFeedbackSettingsLinkClick();
    functions.onRegionSettingsLinkClick();

    expect(router.push.mock.calls).toEqual([
      ['/custom/audio'],
      ['/custom/auto-log'],
      ['/custom/calling'],
      ['/custom/feedback'],
      ['/custom/region'],
    ]);
  });

  test('preserves a configured feedback handler without routing', () => {
    const feedbackHandler = jest.fn();
    const { router, view } = createView({ feedbackHandler });

    view.getUIFunctions({}).onFeedbackSettingsLinkClick();

    expect(feedbackHandler).toHaveBeenCalledTimes(1);
    expect(view.trackOnFeedbackClick).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  test('does not expose call queue navigation when it is disabled', () => {
    const { view } = createView({ callQueueEnabled: false });

    expect(view.getUIFunctions({}).onCallQueueManagementClick).toBeUndefined();
  });
});
