import React, { useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';
import { styled, palette2, setOpacity } from '@ringcentral/juno'; 
import { Virtuoso } from 'react-virtuoso';
import { ContactItem } from './ContactItem';

const DropdownList = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
  top: 100%;
  z-index: 5;
  padding: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${palette2('neutral', 'f06')};
  text-align: left;
  list-style: none;
  background: ${palette2('neutral', 'b01')};
  border: 1px solid ${palette2('neutral', 'l02')};
  border-radius: 4px;
  box-shadow: 0 4px 12px ${setOpacity(palette2('neutral', 'b06'), '12')};
  max-height: 265px;
  overflow-y: auto;
  overflow-x: hidden;
`;

export type ContactDropdownListProps = {
  currentLocale: string;
  scrollDirection?: string;
  visibility: boolean;
  className?: string;
  items: {
    name: string;
    entityType: string;
    phoneType: string;
    phoneNumber: string;
    id: string;
    type: string;
    profileImageUrl: string;
    presence: string;
    contactId: string;
  }[];
  formatContactPhone: (...args: any[]) => any;
  addToRecipients: (...args: any[]) => any;
  setSelectedIndex: (...args: any[]) => any;
  selectedIndex: number;
  titleEnabled?: boolean;
  listRef?: (...args: any[]) => any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  contactInfoRenderer?: (...args: any[]) => any;
  contactPhoneRenderer?: (...args: any[]) => any;
  getPresence?: (...args: any[]) => any;
};

export const ContactDropdownList: FunctionComponent<ContactDropdownListProps> = ({
  currentLocale,
  className,
  listRef,
  items,
  selectedIndex,
  formatContactPhone,
  setSelectedIndex,
  addToRecipients,
  titleEnabled,
  visibility,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  contactInfoRenderer,
  contactPhoneRenderer,
  getPresence,
  scrollDirection,
}) => {
  const nodeRef = useRef(null);
  useEffect(() => {
    if (!visibility || items.length === 0) {
      return;
    }
    if (scrollDirection === 'ArrowDown') {
      if (selectedIndex < items.length) {
        if (selectedIndex > 4 && nodeRef.current) {
          nodeRef.current.scrollToIndex(selectedIndex);
        }
      }
    }
    if (scrollDirection === 'ArrowUp') {
      if (selectedIndex > -1) {
        if (selectedIndex < items.length - 4 && nodeRef.current) {
          nodeRef.current.scrollToIndex(selectedIndex);
        }
      }
    }
  }, [visibility, items, scrollDirection, selectedIndex]);

  if (!visibility || items.length === 0) {
    return null;
  }
  return (
    <DropdownList
      className={className}
      ref={(c) => {
        if (typeof listRef === 'function') {
          listRef(c);
        }
      }}
    >
      <Virtuoso
        style={{
          height: items.length > 4 ? '212px' : `${items.length * 53}px`,
        }}
        ref={nodeRef}
        data-sign="contactDropdownList"
        totalCount={items.length}
        data={items}
        itemContent={(index, item) => {
          let hiddenContactInfo = false;
          let lastContactId = null;
          if (index > 0) {
            const lastItem = items[index - 1];
            lastContactId =  lastItem && lastItem.contactId;
          }
          if (lastContactId === item.contactId && typeof item.contactId !== 'undefined') {
            hiddenContactInfo = true;
          }
          return (
            <ContactItem
              contact={item}
              currentLocale={currentLocale}
              active={selectedIndex === index}
              phoneTypeRenderer={phoneTypeRenderer}
              phoneSourceNameRenderer={phoneSourceNameRenderer}
              formatContactPhone={formatContactPhone}
              onHover={() => setSelectedIndex(index)}
              onClick={() => addToRecipients(item)}
              key={`${index}${item.phoneNumber}${item.name}${item.phoneType}`}
              titleEnabled={titleEnabled}
              contactInfoRenderer={contactInfoRenderer}
              contactPhoneRenderer={contactPhoneRenderer}
              getPresence={
                typeof getPresence === 'function' && item.type === 'company' ?
                  () => getPresence(item) :
                  undefined
              }
              hiddenContactInfo={hiddenContactInfo}
            />
          );
        }}
      />
    </DropdownList>
  );
}
