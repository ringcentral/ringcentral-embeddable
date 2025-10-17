import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
@Module({
  name: 'ParkUI',
  deps: [
    'MonitoredExtensions',
    'RouterInteraction',
    'Locale',
    'Webphone',
    'ComposeText',
    'ComposeTextUI',
    'PhoneNumberFormat',
    'RegionSettings',
    'AccountInfo',
    'ExtensionInfo',
  ],
})
export class ParkUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps({
    params,
  }) {
    const {
      monitoredExtensions,
      locale,
      webphone,
    } = this._deps;
    return {
      sessionId: params.sessionId,
      parkLocations: monitoredExtensions.parkLocations,
      currentLocale: locale.currentLocale,
      session: webphone.sessions.find((session) => session.id === params.sessionId),
    };
  }

  getUIFunctions({
    params,
  }) {
    const {
      webphone,
      routerInteraction,
      composeText,
      composeTextUI,
      phoneNumberFormat,
      regionSettings,
      accountInfo,
      extensionInfo,
      monitoredExtensions,
    } = this._deps;
    return {
      onBack: () => {
        routerInteraction.goBack();
      },
      formatPhone: (phoneNumber) => {
        return phoneNumberFormat.format({
          phoneNumber,
          areaCode: regionSettings.areaCode,
          countryCode: regionSettings.countryCode,
          maxExtensionLength: accountInfo.maxExtensionNumberLength,
          isMultipleSiteEnabled: extensionInfo.isMultipleSiteEnabled,
          siteCode: extensionInfo.site?.code,
        });
      },
      onCallEnd: () => {
        routerInteraction.replace('/dialer');
      },
      onPark: async (locationId) => {
        const session = webphone.sessions.find((session) => session.id === params.sessionId);
        if (!session) {
          return;
        }
        const phoneNumber = session.direction === callDirections.inbound ? session.from : session.to;
        let destination = '';
        if (!locationId) {
           destination = await webphone.park(params.sessionId);
        } else {
          const parkLocation = monitoredExtensions.parkLocations.find((parkLocation) => parkLocation.id === locationId);
          if (!parkLocation) {
            return null;
          }
          destination = await webphone.parkToLocation(params.sessionId, parkLocation.extension);
        }
        if (!destination) {
          return null;
        }
        return {
          fromNumber: phoneNumber,
          destination,
        };
      },
      onText: async (text) => {
        if (text) {
          composeTextUI.gotoComposeText();
          composeText.updateMessageText(text);
        }
      },
    };
  }
}