import type {
  PhoneNumberFormatError,
  PhoneNumberFormatInput,
  PhoneNumberFormatSetting,
  PhoneNumberFormatType,
} from './PhoneNumberFormat.interface';

const FORMAT_TYPES: readonly PhoneNumberFormatType[] = [
  'national',
  'international',
  'e164',
  'custom',
];

/** Digit placeholders a custom template needs, as in 3.x. */
const MIN_TEMPLATE_DIGITS = 10;
const MAX_TEMPLATE_DIGITS = 15;

function isFormatType(value: unknown): value is PhoneNumberFormatType {
  return FORMAT_TYPES.includes(value as PhoneNumberFormatType);
}

function countTemplateDigits(template: string): number {
  return template.split('').filter((char) => /[#*x]/.test(char)).length;
}

/**
 * Applies a format change to the current setting, or says why it is refused.
 * A non-custom format keeps the current template, so switching back to
 * `custom` restores it.
 */
export function applyPhoneNumberFormatInput(
  current: PhoneNumberFormatSetting,
  input: PhoneNumberFormatInput,
): { setting: PhoneNumberFormatSetting } | { error: PhoneNumberFormatError } {
  const { formatType } = input;
  if (!isFormatType(formatType)) {
    return { error: 'invalidPhoneNumberFormatType' };
  }
  let template = current.template;
  if (formatType === 'custom') {
    template = typeof input.template === 'string' ? input.template.trim() : '';
    if (!template) {
      return { error: 'customPhoneNumberFormatTemplateRequired' };
    }
    const digitCount = countTemplateDigits(template);
    if (digitCount < MIN_TEMPLATE_DIGITS || digitCount > MAX_TEMPLATE_DIGITS) {
      return { error: 'customPhoneNumberFormatTemplateLengthInvalid' };
    }
  }
  const readOnly =
    typeof input.readOnly === 'boolean' ? input.readOnly : current.readOnly;
  return {
    setting: {
      formatType,
      template,
      readOnly,
      readOnlyReason:
        typeof input.readOnly === 'boolean'
          ? typeof input.readOnlyReason === 'string'
            ? input.readOnlyReason
            : ''
          : current.readOnlyReason,
    },
  };
}
