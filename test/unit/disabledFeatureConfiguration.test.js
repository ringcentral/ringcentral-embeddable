const {
  getDisabledFeatureConfiguration,
} = require('../../src/app/services/AppFeatures/getDisabledFeatureConfiguration');

const ALL_ENABLED = {
  CallLog: true,
  RingOut: true,
  Softphone: true,
  WebPhone: true,
  Fax: true,
  Voicemail: true,
  Pages: true,
  SMS: true,
  Meetings: true,
  Contacts: true,
};

describe('getDisabledFeatureConfiguration', () => {
  test('keeps every feature on when no parameter is set', () => {
    expect(getDisabledFeatureConfiguration({})).toEqual(ALL_ENABLED);
  });

  test('disableCall turns off calling and call history', () => {
    expect(getDisabledFeatureConfiguration({ disableCall: true })).toEqual({
      ...ALL_ENABLED,
      CallLog: false,
      RingOut: false,
      Softphone: false,
      WebPhone: false,
    });
  });

  test('disableCallHistory turns off only call history', () => {
    expect(
      getDisabledFeatureConfiguration({ disableCallHistory: true }),
    ).toEqual({
      ...ALL_ENABLED,
      CallLog: false,
    });
  });

  test('disableMessages turns off every message type', () => {
    expect(getDisabledFeatureConfiguration({ disableMessages: true })).toEqual({
      ...ALL_ENABLED,
      Fax: false,
      Voicemail: false,
      Pages: false,
      SMS: false,
    });
  });

  test('disableReadText turns off only text messages', () => {
    expect(getDisabledFeatureConfiguration({ disableReadText: true })).toEqual({
      ...ALL_ENABLED,
      Pages: false,
      SMS: false,
    });
  });

  test('disableMeeting and disableContacts turn off their own feature', () => {
    expect(
      getDisabledFeatureConfiguration({
        disableMeeting: true,
        disableContacts: true,
      }),
    ).toEqual({
      ...ALL_ENABLED,
      Meetings: false,
      Contacts: false,
    });
  });
});
