import { phoneTypes } from '@ringcentral-integration/commons/enums/phoneTypes';

import type {
  SearchContactEntity,
  ThirdPartyAuthorizationLink,
  ThirdPartyCall,
  ThirdPartyContact,
  ThirdPartySetting,
  Transcript,
} from './ThirdParty.interface';

function hasValidOptionValue(setting: ThirdPartySetting): boolean {
  if (!setting.options || !Array.isArray(setting.options)) {
    return false;
  }
  if (setting.multiple) {
    if (!Array.isArray(setting.value)) {
      return false;
    }
    return !setting.value.some(
      (valueItem) => !setting.options?.find((option) => option.id === valueItem)
    );
  }
  if (
    !setting.multiple &&
    setting.value &&
    !setting.options.find((option) => option.id === setting.value)
  ) {
    return false;
  }
  return setting.options.every(
    (option) =>
      Boolean(option.id) &&
      Boolean(option.name) &&
      typeof option.name === 'string' &&
      (typeof option.id === 'string' || typeof option.id === 'number')
  );
}

function isValidSectionSettingItem(setting: ThirdPartySetting): boolean {
  if (!setting.name || !setting.id || !setting.type) {
    return false;
  }
  if (setting.type === 'boolean') {
    return typeof setting.value === 'boolean';
  }
  if (setting.type === 'admonition' || setting.type === 'typography') {
    return typeof setting.value === 'string';
  }
  if (setting.type === 'option') {
    return hasValidOptionValue(setting);
  }
  if (setting.type === 'array') {
    return (
      Array.isArray(setting.value) &&
      !setting.value.some((valueItem) => typeof valueItem !== 'string')
    );
  }
  return true;
}

function formatPhoneType(phoneType?: string): string {
  if (!phoneType) {
    return 'unknown';
  }
  if (phoneTypes[phoneType]) {
    return phoneType;
  }
  const cleanType = phoneType.replace('Phone', '');
  if (phoneTypes[cleanType]) {
    return cleanType;
  }
  return 'other';
}

export function checkThirdPartySettings(
  settings: ThirdPartySetting[] = []
): ThirdPartySetting[] {
  const validSettings: ThirdPartySetting[] = [];
  const invalidSettings: ThirdPartySetting[] = [];
  settings.forEach((setting) => {
    if (!setting.name || typeof setting.name !== 'string') {
      invalidSettings.push(setting);
      return;
    }
    if (
      typeof setting.order !== 'undefined' &&
      typeof setting.order !== 'number'
    ) {
      invalidSettings.push(setting);
      return;
    }
    if (!setting.id || !setting.type) {
      if (typeof setting.value === 'boolean') {
        validSettings.push({
          id: setting.id || setting.name,
          name: setting.name,
          value: setting.value,
          type: 'boolean',
        });
        return;
      }
      invalidSettings.push(setting);
      return;
    }
    if (setting.type === 'boolean') {
      if (typeof setting.value === 'boolean') {
        validSettings.push(setting);
      } else {
        invalidSettings.push(setting);
      }
      return;
    }
    if (setting.type === 'button') {
      if (
        (setting.buttonLabel && typeof setting.buttonLabel !== 'string') ||
        (setting.buttonType && typeof setting.buttonType !== 'string')
      ) {
        invalidSettings.push(setting);
      } else {
        validSettings.push(setting);
      }
      return;
    }
    if (setting.type === 'option') {
      if (hasValidOptionValue(setting)) {
        validSettings.push(setting);
      } else {
        invalidSettings.push(setting);
      }
      return;
    }
    if (setting.type === 'section') {
      if (!setting.items || !Array.isArray(setting.items)) {
        invalidSettings.push(setting);
        return;
      }
      const validItems = setting.items.filter(isValidSectionSettingItem);
      const invalidItems = setting.items.filter(
        (item) => !isValidSectionSettingItem(item)
      );
      if (invalidItems.length > 0) {
        console.warn(`Invalid items in section ${setting.name}:`, invalidItems);
      }
      if (validItems.length > 0) {
        validSettings.push({ ...setting, items: validItems });
      } else {
        invalidSettings.push(setting);
      }
      return;
    }
    if (setting.type === 'group') {
      validSettings.push({
        ...setting,
        items: checkThirdPartySettings(setting.items),
      });
      return;
    }
    if (setting.type === 'externalLink') {
      if (
        !setting.uri ||
        typeof setting.uri !== 'string' ||
        (!setting.uri.startsWith('http://') &&
          !setting.uri.startsWith('https://'))
      ) {
        invalidSettings.push(setting);
      } else {
        validSettings.push(setting);
      }
    }
  });
  if (invalidSettings.length > 0) {
    console.warn('Invalid settings:', invalidSettings);
  }
  return validSettings;
}

export function findSettingItem(
  settings: ThirdPartySetting[],
  id?: string
): ThirdPartySetting | null {
  if (!id) {
    return null;
  }
  for (const item of settings) {
    if (item.id === id) {
      return item;
    }
    if (item.type === 'group' && item.items) {
      const setting = findSettingItem(item.items, id);
      if (setting) {
        return setting;
      }
    }
  }
  return null;
}

export function formatContacts(
  contacts: ThirdPartyContact[] = []
): ThirdPartyContact[] {
  return contacts.map((contact) => {
    const phoneNumbers = contact.phoneNumbers?.map((phoneNumber) => ({
      phoneNumber: phoneNumber.phoneNumber,
      phoneType: formatPhoneType(phoneNumber.phoneType),
    }));
    return {
      ...contact,
      phoneNumbers,
    };
  });
}

export function getImageUri(sourceUri?: string): string | null {
  if (!sourceUri) {
    return null;
  }
  const sourceUrl = String(sourceUri);
  if (
    sourceUrl.startsWith('data:image') ||
    sourceUrl.startsWith('http://') ||
    sourceUrl.startsWith('https://')
  ) {
    return sourceUrl;
  }
  return null;
}

export function getTranscriptText(
  transcript: Transcript | null,
  call: ThirdPartyCall
): string {
  if (!transcript?.transcripts || !transcript.context) {
    return '';
  }
  const nameMap: Record<string, string> = {};
  transcript.context.participants.forEach((participant) => {
    nameMap[participant.participantId] = participant.name;
    if (!participant.extensionId) {
      return;
    }
    if (call.from.extensionId === participant.extensionId) {
      nameMap[participant.participantId] =
        call.fromName ||
        call.from.name ||
        call.from.phoneNumber ||
        call.from.extensionNumber ||
        participant.name;
      return;
    }
    if (call.to.extensionId === participant.extensionId) {
      nameMap[participant.participantId] =
        call.toName ||
        call.to.name ||
        call.to.phoneNumber ||
        call.to.extensionNumber ||
        participant.name;
    }
  });
  return transcript.transcripts
    .map((item) => `${nameMap[item.participantId]}: ${item.text}`)
    .join('\n');
}

export function searchContactPhoneNumbers(
  contacts: ThirdPartyContact[],
  searchString: string,
  entityType = 'contact'
): SearchContactEntity[] {
  const searchText = searchString.toLowerCase();
  const result: SearchContactEntity[] = [];
  contacts.forEach((item) => {
    const name =
      item.name ||
      [item.firstName, item.lastName].filter(Boolean).join(' ') ||
      '';
    const nameSearched =
      `${item.firstName} ${item.lastName} ${item.name}`.toLowerCase();
    let isPrimary = true;
    item.phoneNumbers?.forEach((phoneNumber) => {
      if (
        nameSearched.includes(searchText) ||
        phoneNumber.phoneNumber.includes(searchText)
      ) {
        result.push({
          id: `${item.id}${phoneNumber.phoneNumber}`,
          name,
          type: item.type,
          phoneNumber: phoneNumber.phoneNumber,
          phoneType: formatPhoneType(phoneNumber.phoneType),
          entityType,
          contactId: item.id,
          isPrimary,
          contact: item,
        });
        isPrimary = false;
      }
    });
  });
  return result;
}

export function isSafeAuthorizationLink(
  link: ThirdPartyAuthorizationLink
): boolean {
  if (typeof link.label !== 'string' || typeof link.uri !== 'string') {
    return false;
  }
  if (!link.uri.startsWith('http://') && !link.uri.startsWith('https://')) {
    return false;
  }
  return !link.uri.includes('javascript');
}
