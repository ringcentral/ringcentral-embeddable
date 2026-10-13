import type { CallingSettingsOptions as BaseCallingSettingsOptions } from '@ringcentral-integration/micro-phone/src/app/services';

/**
 * Calling settings options, with the `defaultCallWith` URL parameter.
 */
export interface CallingSettingsOptions extends BaseCallingSettingsOptions {
  /** `browser`, `jupiter`, `softphone`, or `ringout`. */
  defaultCallWith?: string;
}
