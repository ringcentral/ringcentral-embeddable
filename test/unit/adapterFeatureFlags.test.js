jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewState {},
  }),
);
jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock('../../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const { Adapter } = require('../../src/app/services/Adapter');

function createAdapter() {
  const appFeatures = {
    configState: {},
    setConfigState: jest.fn((config) => {
      appFeatures.configState = config;
    }),
  };
  const adapter = Object.create(Adapter.prototype);
  adapter._appFeatures = appFeatures;
  return { adapter, appFeatures };
}

describe('Adapter rc-adapter-update-features-flags', () => {
  test('maps the 3.x keys to feature flags', async () => {
    const { adapter, appFeatures } = createAdapter();

    await adapter._onUpdateFeatureConfig({
      chat: true,
      text: false,
      fax: false,
      voicemail: true,
      meetings: false,
      contacts: true,
      recordings: false,
    });

    expect(appFeatures.setConfigState).toHaveBeenCalledWith({
      Glip: true,
      Pages: false,
      SMS: false,
      Fax: false,
      Voicemail: true,
      Meetings: false,
      Contacts: true,
      CallRecording: false,
    });
  });

  test('replaces the earlier update, as 3.x did', async () => {
    const { adapter, appFeatures } = createAdapter();

    await adapter._onUpdateFeatureConfig({ text: false });
    await adapter._onUpdateFeatureConfig({ fax: false });

    expect(appFeatures.configState).toEqual({ Fax: false });
  });

  test('ignores keys that are not booleans and other keys', async () => {
    const { adapter, appFeatures } = createAdapter();
    appFeatures.configState = { Fax: false };

    await adapter._onUpdateFeatureConfig({
      text: 'false',
      fax: 1,
      smsTemplate: true,
      sharedMessages: true,
    });

    expect(appFeatures.setConfigState).not.toHaveBeenCalled();
    expect(appFeatures.configState).toEqual({ Fax: false });
  });
});
