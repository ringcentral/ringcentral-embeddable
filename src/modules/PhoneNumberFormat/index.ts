import { Module } from '@ringcentral-integration/commons/lib/di';
import { format, formatTypes } from '@ringcentral-integration/phone-number';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
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
  deps: ['GlobalStorage'],
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
  formatTypeReadOnly = false;

  @action
  setFormatTypeReadOnly(formatTypeReadOnly: boolean) {
    this.formatTypeReadOnly = formatTypeReadOnly;
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
    if (type === 'masked') {
      const item = this.supportedFormats.find((format) => format.id === type);
      if (item) {
        return this.formatWithTemplate(param, item.placeholder);
      }
    }
    return this._defaultFormatter({
      ...param,
      type: formatTypes.local,
    });
  }

  formatWithTemplate(param: InputParam, template: string) {
    if (!param.phoneNumber) {
      return '';
    }
    const parsedNumber = parsePhoneNumberFromString(param.phoneNumber, param.countryCode as CountryCode);
    if (!parsedNumber) {
      return param.phoneNumber;
    }
    const digitsOnly = parsedNumber.nationalNumber;
    let formattedPhoneNumber = '';
    let digitsIndex = 0;
    for (let i = 0; i < template.length; i++) {
      const char = template[i];
      if (char === '#' || char === '*') {
        formattedPhoneNumber += digitsOnly[digitsIndex];
        digitsIndex++;
      } else if (char === 'x') {
        formattedPhoneNumber += 'x';
        digitsIndex++;
      } else {
        formattedPhoneNumber += char;
      }
    }
    return formattedPhoneNumber;
  }

  get defaultFormats() {
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
    }];
  }

  get templateFormats() {
    return [{
      id: 'masked',
      name: 'Masked (xxx-xxx-####)',
      placeholder: 'xxx-xxx-####',
    }];
  }

  get supportedFormats() {
    return [...this.defaultFormats, ...this.templateFormats];
  }
}
