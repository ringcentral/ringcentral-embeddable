import { Module } from '@ringcentral-integration/commons/lib/di';
import { format, formatTypes } from '@ringcentral-integration/phone-number';
import {
  action,
  RcModuleV2,
  state,
  globalStorage,
} from '@ringcentral-integration/core';
import type { PhonNumberFormatter } from './interface';

type InputParam = {
  phoneNumber: string;
  areaCode: string;
  countryCode: string;
  maxExtensionLength: number,
  isMultipleSiteEnabled: boolean;
  siteCode: string;
  international: boolean;
  isEDPEnabled: boolean;
  removeExtension: boolean,
}

@Module({
  name: 'PhoneNumberFormat',
  deps: ['GlobalStorage', 'Alert'],
})
export class PhoneNumberFormat extends RcModuleV2 {
  private _defaultFormatter: PhonNumberFormatter;

  constructor(deps) {
    super({
      deps,
      storageKey: 'PhoneNumberFormat',
      enableGlobalCache: true,
    });
  }

  @globalStorage
  @state
  formatType = 'national';

  @action
  setFormatType(formatType: string) {
    this.formatType = formatType;
  }

  @globalStorage
  @state
  readOnly = false;

  @globalStorage
  @state
  readOnlyReason = '';

  @globalStorage
  @state
  template = '';

  @action
  setTemplate(template: string) {
    this.template = template;
  }

  @action
  setReadOnly(readOnly: boolean, reason: string) {
    this.readOnly = !!readOnly;
    this.readOnlyReason = reason || '';
  }

  setDefaultFormatter() {
    if (!this._defaultFormatter) {
      this._defaultFormatter = format;
    }
  }

  override onInit() {
    this.setDefaultFormatter();
  }

  format(param: InputParam) {
    return this.formatWithType(param, this.formatType);
  }

  formatWithType(param: InputParam, type: string) {
    try {
      if (type === 'international' || param.international) {
        return this._defaultFormatter({
          ...param,
          type: formatTypes.international,
        });
      }
      if (type === 'e164') {
        return this._defaultFormatter({
          ...param,
          type: formatTypes.e164,
        });
      }
      if (type === 'custom') {
        return this.formatWithTemplate(param, this.template);
      }
      return this._defaultFormatter({
        ...param,
        type: formatTypes.local,
      });
    } catch (error) {
      console.error(error);
      return param.phoneNumber;
    }
  }

  formatWithTemplate(param: InputParam, template: string) {
    if (!param.phoneNumber) {
      return '';
    }
    let formattedPhoneNumber = '';
    const digitsOnly = param.phoneNumber.replace(/\D/g, '');
    let digitsIndex = digitsOnly.length - 1;
    for (let i = template.length - 1; i >= 0; i--) {
      const char = template[i];
      if (char === '#' || char === '*') {
        if (digitsIndex < 0) {
          break;
        }
        formattedPhoneNumber = digitsOnly[digitsIndex] + formattedPhoneNumber;
        digitsIndex--;
      } else if (char === 'x') {
        // for mask, we don't need to add the digit
        formattedPhoneNumber = 'x' + formattedPhoneNumber;
        digitsIndex--;
      } else {
        formattedPhoneNumber = char + formattedPhoneNumber;
      }
    }
    return formattedPhoneNumber;
  }

  get supportedFormats() {
    return [{
      id: 'national',
      name: 'National',
      placeholder: '(###) ###-####',
    }, {
      id: 'international',
      name: 'International',
      placeholder: '+1 ## ### ####',
    }, {
      id: 'e164',
      name: 'E.164',
      placeholder: '+1##########',
    }, {
      id: 'custom',
      name: 'Custom',
      placeholder: '',
    }];
  }

  setSetting(setting: {
    formatType: string;
    template: string;
    readOnly?: boolean;
    readOnlyReason?: string;
  }) {
    const supported = this.supportedFormats.find((format) => format.id === setting.formatType);
    if (!supported) {
      this._deps.alert.warning({
        message: 'invalidPhoneNumberFormatType',
      });
      return;
    }
    if (setting.formatType === 'custom') {
      if (!setting.template) {
        this._deps.alert.warning({
          message: 'customPhoneNumberFormatTemplateRequired',
        });
        return;
      }
      const templateCharLength = setting.template.split('').filter((char) => char === '#' || char === '*' || char === 'x').length;
      if (templateCharLength < 10 || templateCharLength > 15) {
        this._deps.alert.warning({
          message: 'customPhoneNumberFormatTemplateLengthInvalid',
        });
        return;
      }
      this.setTemplate(setting.template);
    }
    this.setFormatType(setting.formatType);
    if (typeof setting.readOnly === 'boolean') {
      this.setReadOnly(setting.readOnly, setting.readOnlyReason);
    }
  }
}
