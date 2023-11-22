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
  if (item.type === 'option') {
    if (!item.options || !Array.isArray(item.options)) {
      return false;
    }
    if (item.value && item.options.indexOf(item.value) === -1) {
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
  });
  if (inValidSettings.length > 0) {
    console.warn('Invalid settings:', inValidSettings);
  }
  return validSettings;
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
  } else if (sourceUrl.split('?')[0].match(/.(png|jpg|jpeg)$/)){
    imageUri = sourceUrl;
  }
  return imageUri;
}