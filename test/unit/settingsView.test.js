import { SettingsView } from '../../src/app/views/SettingsView/Settings.view';

jest.mock('@ringcentral-integration/micro-setting/src/app/views', () => ({
  CallQueueManagementView: class CallQueueManagementView {},
  CPRClientView: class CPRClientView {},
}));

jest.mock(
  '@ringcentral-integration/micro-setting/src/app/views/SettingsView',
  () => ({
    SettingsView: class SettingsView {
      getUIProps() {
        return { base: true };
      }

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
  function createView({ callQueueEnabled = true } = {}) {
    const router = { push: jest.fn().mockResolvedValue(undefined) };
    const view = Object.create(SettingsView.prototype);
    view._callQueueEnabled = callQueueEnabled;
    view._router = router;
    view._settingsViewOptions = undefined;
    view._thirdParty = {
      onShowFeedback: jest.fn().mockResolvedValue(undefined),
      showFeedback: false,
    };
    view.trackOnFeedbackClick = jest.fn();
    return { router, view };
  }

  test.each([
    ['onRegionSettingsLinkClick', '/settings/region'],
    ['onCallingSettingsLinkClick', '/settings/calling'],
    ['onAutoCallLogSettingLinkClick', '/settings/autoCallLogSettings'],
    ['onAudioSettingsLinkClick', '/settings/audio'],
    ['onApplicationLogsLinkClick', '/settings/applicationLogs'],
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
      regionSettingsUrl: '/custom/region',
    });

    functions.onAudioSettingsLinkClick();
    functions.onAutoCallLogSettingLinkClick();
    functions.onCallingSettingsLinkClick();
    functions.onRegionSettingsLinkClick();

    expect(router.push.mock.calls).toEqual([
      ['/custom/audio'],
      ['/custom/auto-log'],
      ['/custom/calling'],
      ['/custom/region'],
    ]);
  });

  test('sends feedback through the registered third-party path without routing', () => {
    const { router, view } = createView();

    view.getUIFunctions({}).onFeedbackSettingsLinkClick();

    expect(view._thirdParty.onShowFeedback).toHaveBeenCalledTimes(1);
    expect(view.trackOnFeedbackClick).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });

  test('does not expose call queue navigation when it is disabled', () => {
    const { view } = createView({ callQueueEnabled: false });

    expect(view.getUIFunctions({}).onCallQueueManagementClick).toBeUndefined();
  });

  test('exposes the registered call and message logger settings', async () => {
    const { view } = createView();
    view._callLogger = {
      autoLog: false,
      ready: true,
      setAutoLog: jest.fn(async () => {}),
    };
    view._conversationLogger = {
      autoLog: true,
      setAutoLog: jest.fn(async () => {}),
    };
    view._thirdParty = {
      callLoggerAutoLogSettingHidden: false,
      callLoggerAutoSettingDescription: 'Log every call',
      callLoggerAutoSettingLabel: 'CRM call logging',
      callLoggerAutoSettingReadOnly: true,
      callLoggerAutoSettingReadOnlyReason: 'Managed call policy',
      callLoggerAutoSettingWarning: 'Calls include recordings',
      messageLoggerAutoSettingDescription: 'Log every message',
      messageLoggerAutoSettingHidden: false,
      messageLoggerAutoSettingLabel: 'CRM message logging',
      messageLoggerAutoSettingReadOnly: true,
      messageLoggerAutoSettingReadOnlyReason: 'Managed by an administrator',
      messageLoggerRegistered: true,
      showFeedback: true,
    };

    expect(view.getUIProps({})).toMatchObject({
      autoLogDescription: 'Log every call',
      autoLogEnabled: false,
      autoLogReadOnlyReason: 'Managed call policy',
      autoLogTitle: 'CRM call logging',
      autoLogWarning: 'Calls include recordings',
      autoLogSMSEnabled: true,
      autoLogSMSDescription: 'Log every message',
      autoLogSMSReadOnlyReason: 'Managed by an administrator',
      autoLogSMSTitle: 'CRM message logging',
      disableAutoLogEnabled: true,
      disableAutoLogSMSEnabled: true,
      showAutoLog: true,
      showAutoLogSMS: true,
      showFeedback: true,
    });

    await view.getUIFunctions({}).onAutoLogChange(true);
    await view.getUIFunctions({}).onAutoLogSMSChange(false);
    expect(view._callLogger.setAutoLog).toHaveBeenCalledWith(true);
    expect(view._conversationLogger.setAutoLog).toHaveBeenCalledWith(false);
  });

  test('hides logger settings that are not registered or configured as visible', () => {
    const { view } = createView();
    view._callLogger = { autoLog: true, ready: false };
    view._conversationLogger = { autoLog: true };
    view._thirdParty = {
      callLoggerAutoLogSettingHidden: false,
      messageLoggerAutoSettingHidden: true,
      messageLoggerRegistered: true,
    };

    expect(view.getUIProps({})).toMatchObject({
      showAutoLog: false,
      showAutoLogSMS: false,
    });
  });
});
