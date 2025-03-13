export type WidgetContact = {
  id?: string;
  phoneNumber?: string;
  phoneNumbers?: {
    phoneNumber: string;
  }[];
}

export function isSameContact(contact1?: WidgetContact | null, contact2?: WidgetContact | null) {
  if (!contact1 || !contact2) {
    return false;
  }
  if (
    contact1.id &&
    contact2.id &&
    contact1.id === contact2.id
  ) {
    return true;
  }
  if (
    contact1.phoneNumber &&
    contact2.phoneNumber &&
    contact1.phoneNumber === contact2.phoneNumber
  ) {
    return true
  }
  if (
    contact1.phoneNumbers &&
    contact2.phoneNumber &&
    contact1.phoneNumbers.some((p) => p.phoneNumber === contact2.phoneNumber)
  ) {
    return true;
  }
  if (
    contact2.phoneNumbers &&
    contact1.phoneNumber &&
    contact2.phoneNumbers.some((p) => p.phoneNumber === contact1.phoneNumber)
  ) {
    return true;
  }
  return false;
}
