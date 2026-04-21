import React from 'react';
import type {
  IContact,
} from '@ringcentral-integration/commons/interfaces/Contact.model';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import {
  ListItem,
  ListItemText,
  Text,
} from '@ringcentral/spring-ui';

export function ContactListItem({
  contact,
  onItemSelect,
}: {
  contact: IContact;
  onItemSelect: (args: { type: string; id: string }) => void;
}) {

  const displayName =
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.extensionNumber ||
    contact.phoneNumber ||
    '';
  const secondaryText =
    contact.email ??
    contact.emails?.[0] ??
    contact.phoneNumbers?.[0]?.phoneNumber ??
    contact.phoneNumber ??
    '';
  const extensionText = contact.extensionNumber
    ? `Ext. ${contact.extensionNumber}`
    : '';

  return (
    <ListItem
      data-sign="contactItem"
      divider
      hoverable
      clickable
      size="small"
      onClick={() =>
        onItemSelect({ type: contact.type, id: contact.id })
      }
      className="pt-1"
    >
      <ContactAvatar
        contact={contact}
        size="medium"
        showPresence
      />
      <ListItemText
        primary={displayName}
        secondary={secondaryText}
      />
      {extensionText ? (
        <Text
          className="typography-descriptor text-right"
          title={extensionText}
        >
          {extensionText}
        </Text>
      ) : null}
    </ListItem>
  );
}
