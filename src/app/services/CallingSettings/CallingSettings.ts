import {
  AppFeatures,
  ExtensionDevice,
  ExtensionFeatures,
  ExtensionInfo,
  ExtensionPhoneNumber,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  Brand,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  CallerId,
  CallingSettings as CallingSettingsBase,
  callingOptions,
  ForwardingNumber,
  Softphone,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import {
  injectable,
  optional,
  RouterPlugin,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import type { CallingSettingsOptions } from './CallingSettings.interface';

/**
 * Calling settings that start on the `defaultCallWith` option, as in 3.x.
 */
@injectable({
  name: 'CallingSettings',
})
export class CallingSettings extends CallingSettingsBase {
  constructor(
    router: RouterPlugin,
    toast: Toast,
    brand: Brand,
    storage: StoragePlugin,
    extensionInfo: ExtensionInfo,
    extensionDevice: ExtensionDevice,
    forwardingNumber: ForwardingNumber,
    appFeatures: AppFeatures,
    extensionFeatures: ExtensionFeatures,
    extensionPhoneNumber: ExtensionPhoneNumber,
    callerId: CallerId,
    @optional() webphone?: Webphone,
    @optional() softphone?: Softphone,
    @optional('TabManager') tabManager?: unknown,
    @optional('CallingSettingsOptions')
    callingSettingsOptions?: CallingSettingsOptions,
  ) {
    super(
      router,
      toast,
      brand,
      storage,
      extensionInfo,
      extensionDevice,
      forwardingNumber,
      appFeatures,
      extensionFeatures,
      extensionPhoneNumber,
      callerId,
      webphone,
      softphone,
      tabManager,
      callingSettingsOptions,
    );
  }

  /**
   * The `defaultCallWith` option when the account offers it.
   */
  get defaultCallWith(): string | undefined {
    const name = (this._callingSettingsOptions as CallingSettingsOptions)
      ?.defaultCallWith;
    if (!name) {
      return undefined;
    }
    const option = (callingOptions as Record<string, unknown>)[name];
    return (this.callWithOptions as unknown[]).includes(option)
      ? (option as string)
      : undefined;
  }

  /**
   * On the first login, starts on `defaultCallWith` instead of the first
   * option. Later logins keep what the user picked.
   */
  override _handleFirstTimeLogin(): void {
    const firstLogin = !this.timestamp;
    super._handleFirstTimeLogin();
    const defaultCallWith = this.defaultCallWith;
    if (firstLogin && defaultCallWith && defaultCallWith !== this.callWith) {
      this.setDataAction({ callWith: defaultCallWith as never });
    }
  }
}
