import React, { Component } from 'react';

import classnames from 'classnames';
import styles from '@ringcentral-integration/widgets/components/ContactDropdownList/styles.scss';

import { ContactItem } from './ContactItem';

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
export class ContactDropdownList extends Component<
  ContactDropdownListProps,
  {}
> {
  node: any;
  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  // eslint-disable-next-line react/no-deprecated
  UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (!nextProps.visibility || nextProps.items.length === 0) {
      return;
    }
    if (nextProps.scrollDirection === 'ArrowDown') {
      if (nextProps.selectedIndex < nextProps.items.length) {
        if (nextProps.selectedIndex > 4 && this.node) {
          this.node.scrollTop += 53;
          this.node.scrollTop = Math.floor(this.node.scrollTop / 53) * 53;
        }
      }
    }
    if (nextProps.scrollDirection === 'ArrowUp') {
      if (nextProps.selectedIndex > -1) {
        if (nextProps.selectedIndex < nextProps.items.length - 4 && this.node) {
          this.node.scrollTop -= 53;
          this.node.scrollTop = Math.floor(this.node.scrollTop / 53) * 53;
        }
      }
    }
  }
  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  render() {
    const {
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
    } = this.props;
    if (!visibility || items.length === 0) {
      return null;
    }
    let lastContactId = null;
    const contactItems = items.map((item, index) => {
      let hiddenContactInfo = false;
      if (lastContactId === item.contactId && typeof item.contactId !== 'undefined') {
        hiddenContactInfo = true;
      }
      lastContactId = item.contactId;
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
  })
    return (
      <ul
        className={classnames(styles.dropdownList, className)}
        ref={(c) => {
          this.node = c;
          if (typeof listRef === 'function') {
            listRef(c);
          }
        }}
        data-sign="contactDropdownList"
      >
        {contactItems}
      </ul>
    );
  }
}
