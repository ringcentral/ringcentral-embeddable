import React from 'react';
import { RcText, styled } from '@ringcentral/juno';
import { displayFormatter } from '@ringcentral-integration/widgets/components/ContactDisplay/displayFormatter';

const Root = styled(RcText)`
  font-size: 14px;
`;

type Correspondent = {
  phoneNumber: string;
  extensionNumber: string;
  name: string;
};

type ContactMatch = {
  phoneNumbers: { phoneNumber: string }[];
  extensionNumber: string;
  phoneNumber: string;
  name: string;
  entityType: string;
  hidden: boolean;
};

export function GroupNumbersDisplay({
  correspondents,
  contactMatches,
  formatPhone,
  phoneSourceNameRenderer,
  className,
  brand,
  currentLocale,
  unread = false,
}: {
  correspondents: Correspondent[];
  contactMatches: ContactMatch[];
  formatPhone: (phoneNumber: string) => string;
  phoneSourceNameRenderer: (entityType: string) => string;
  className?: string;
  brand: string;
  currentLocale: string;
  unread?: boolean;
}) {
  const title = correspondents.map(correspondent => {
    const phoneNumber = correspondent.phoneNumber || correspondent.extensionNumber;
    const groupContact = contactMatches.find(contact => {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        return contact.phoneNumbers.some(number => number.phoneNumber === phoneNumber);
      }
      return contact.phoneNumber === phoneNumber || contact.extensionNumber === phoneNumber;
    });
    const name = (groupContact && groupContact.name) || correspondent.name;
    const formattedPhoneNumber = groupContact?.hidden ? null :formatPhone(phoneNumber);
    return displayFormatter({
      entityName: name,
      entityType: groupContact?.entityType,
      phoneNumber: formattedPhoneNumber,
      currentLocale,
      brand,
      phoneSourceNameRenderer,
    });
  }).join(', ');
  const color = unread ? 'interactive.f01' : 'neutral.f06';
  return (
    <Root variant="body1" color={color} title={title} className={className}>
      {correspondents.map(correspondent => {
        const phoneNumber = correspondent.phoneNumber || correspondent.extensionNumber;
        const groupContact = contactMatches.find(contact => {
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            return contact.phoneNumbers.some(number => number.phoneNumber === phoneNumber);
          }
          return contact.phoneNumber === phoneNumber || contact.extensionNumber === phoneNumber;
        });
        return (
          (groupContact && groupContact.name) ||
          correspondent.name ||
            formatPhone(correspondent.phoneNumber || correspondent.extensionNumber || '')
        );
      }).join(', ')}
    </Root>
  );
}