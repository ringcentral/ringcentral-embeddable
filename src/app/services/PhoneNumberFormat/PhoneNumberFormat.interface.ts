/**
 * How phone numbers are shown in the app, as in 3.x.
 */
export type PhoneNumberFormatType =
  | 'national'
  | 'international'
  | 'e164'
  | 'custom';

/**
 * The phone number format the user picked or the host set.
 */
export interface PhoneNumberFormatSetting {
  readonly formatType: PhoneNumberFormatType;
  /** Used by `custom`: `#` and `*` are digits, `x` hides a digit. */
  readonly template: string;
  /** Set by the host to stop the user from changing the format. */
  readonly readOnly: boolean;
  readonly readOnlyReason: string;
}

/**
 * A format change from the host's `rc-adapter-set-phone-number-format` or the
 * settings page. `readOnly` changes only when it is a boolean.
 */
export interface PhoneNumberFormatInput {
  readonly formatType?: unknown;
  readonly template?: unknown;
  readonly readOnly?: unknown;
  readonly readOnlyReason?: unknown;
}

/**
 * Why a format change was refused.
 */
export type PhoneNumberFormatError =
  | 'invalidPhoneNumberFormatType'
  | 'customPhoneNumberFormatTemplateRequired'
  | 'customPhoneNumberFormatTemplateLengthInvalid';
