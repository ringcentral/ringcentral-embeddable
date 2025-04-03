import { phoneTypes } from '@ringcentral-integration/commons/enums/phoneTypes';

function checkSettingSectionItem(item) {
  if (!item.name || !item.id || !item.type) {
    return false;
  }
  if (item.type === 'boolean') {
    if (typeof item.value !== 'boolean') {
      return false;
    }
  }
  if (item.type === 'admonition') {
    if (typeof item.value !== 'string') {
      return false;
    }
  }
  if (item.type === 'typography') {
    if (typeof item.value !== 'string') {
      return false;
    }
  }
  if (item.type === 'option') {
    if (!item.options || !Array.isArray(item.options)) {
      return false;
    }
    if (item.multiple) {
      if (!Array.isArray(item.value)) {
        return false;
      }
      if (item.value.some((valueItem) => {
        return !item.options.find((option) => option.id === valueItem);
      })) {
        return false;
      }
    }
    if (!item.multiple && item.value && !item.options.find((option) => option.id === item.value)) {
      return false;
    }
    for (const option of item.options) {
      if (
        !option.id ||
        !option.name ||
        typeof option.name !== 'string' ||
        (typeof option.id !== 'string' && typeof option.id !== 'number')
      ) {
        return false;
      }
    }
  }
  return true;
}

export function checkThirdPartySettings(settings: any[]) {
  let validSettings: any[] = [];
  let inValidSettings: any[] = [];
  settings.forEach((setting) => {
    if (!setting.name || typeof setting.name !== 'string') {
      inValidSettings.push(setting);
      return;
    }
    if (
      typeof setting.order !== 'undefined' &&
      typeof setting.order !== 'number'
    ) {
      inValidSettings.push(setting);
      return;
    }
    if (!setting.id || !setting.type) {
      if (typeof setting.value === 'boolean') {
        // For backward compatibility, we will add id for boolean type setting
        validSettings.push({
          id: setting.id || setting.name,
          name: setting.name,
          value: setting.value,
          type: 'boolean',
        });
        return;
      }
      inValidSettings.push(setting);
      return;
    }
    if (setting.type === 'boolean') {
      if (typeof setting.value === 'boolean') {
        validSettings.push(setting);
      } else {
        inValidSettings.push(setting);
      }
      return;
    }
    if (setting.type === 'button') {
      if (
        (
          setting.buttonLabel &&
          typeof setting.buttonLabel !== 'string'
        ) || (
          setting.buttonType &&
          typeof setting.buttonType !== 'string'
        )
      ) {
        inValidSettings.push(setting);
      } else {
        validSettings.push(setting);
      }
      return;
    }
    if (setting.type === 'section') {
      if (!setting.items || !Array.isArray(setting.items)) {
        inValidSettings.push(setting);
        return;
      }
      let validItems: any[] = [];
      let inValidItems: any[] = [];
      setting.items.forEach((item) => {
        if (checkSettingSectionItem(item)) {
          validItems.push(item);
        } else {
          inValidItems.push(item);
        }
      });
      if (inValidItems.length > 0) {
        console.warn(`Invalid items in section ${setting.name}:`, inValidItems);
      }
      if (validItems.length > 0) {
        validSettings.push({
          ...setting,
          items: validItems,
        });
      } else {
        inValidSettings.push(setting);
      }
    }
    if (setting.type === 'group') {
      validSettings.push({
        ...setting,
        items: checkThirdPartySettings(setting.items),
      });
    }
    if (setting.type === 'externalLink') {
      if (
        !setting.uri ||
        typeof setting.uri !== 'string' ||
        (
          setting.uri.indexOf('http://') !== 0 &&
          setting.uri.indexOf('https://') !== 0
        )
      ) {
        inValidSettings.push(setting);
      } else {
        validSettings.push(setting);
      }
    }
  });
  if (inValidSettings.length > 0) {
    console.warn('Invalid settings:', inValidSettings);
  }
  return validSettings;
}

export function findSettingItem(settings, id) {
  let setting = null;
  settings.forEach((item) => {
    if (setting) {
      return;
    }
    if (item.id === id) {
      setting = item;
      return;
    }
    if (item.type === 'group') {
      item.items.forEach((subItem) => {
        if (setting) {
          return;
        }
        if (subItem.id === id) {
          setting = subItem;
        }
      });
    }
  });
  return setting;
}

function formatPhoneType(phoneType?: string) {
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

export function formatContacts(contacts) {
  return contacts.map((contact) => {
    const phoneNumbers = contact.phoneNumbers && contact.phoneNumbers.map(p => ({
      phoneNumber: p.phoneNumber,
      phoneType: formatPhoneType(p.phoneType),
    }));
    return {
      ...contact,
      phoneNumbers
    };
  });
}

export function getImageUri(sourceUri?: string) {
  if (!sourceUri) {
    return null;
  }
  let imageUri = null;
  const sourceUrl = String(sourceUri);
  if (sourceUrl.indexOf('data:image') === 0) {
    imageUri = sourceUrl;
  } else if (
    sourceUrl.indexOf('http://') === 0 ||
    sourceUrl.indexOf('https://') === 0
  ) {
    imageUri = sourceUrl;
  }
  return imageUri;
}

interface Transcript {
  context: {
    participants: {
      accountId?: string;
      extensionId?: string;
      name: string;
      participantId: string;
    }[]
  };

  transcripts: {
    text: string;
    participantId: string;
  }[];
}

interface Call {
  from: {
    extensionId?: string;
    name: string;
    phoneNumber?: string;
    extensionNumber?: string;
  },
  to: {
    extensionId?: string;
    name: string;
    phoneNumber?: string;
    extensionNumber?: string;
  },
  fromName?: string;
  toName?: string;
  partyId?: string;
}

export function getTranscriptText(transcript: Transcript, call: Call): string {
  if (!transcript) {
    return '';
  }
  if (!transcript.transcripts) {
    return '';
  }
  if (!transcript.context) {
    return '';
  }
  const nameMap = {};
  transcript.context.participants.forEach((p) => {
    nameMap[p.participantId] = p.name;
    if (p.extensionId) {
      if (call.from.extensionId === p.extensionId) {
        nameMap[p.participantId] = call.fromName || call.from.name || call.from.phoneNumber || call.from.extensionNumber;
        return;
      }
      if (call.to.extensionId === p.extensionId) {
        nameMap[p.participantId] = call.toName || call.to.name || call.to.phoneNumber || call.to.extensionNumber;
      }
    }
  });
  return transcript.transcripts.map((t) => {
    return `${nameMap[t.participantId]}: ${t.text}`;
  }).join('\n');
}
