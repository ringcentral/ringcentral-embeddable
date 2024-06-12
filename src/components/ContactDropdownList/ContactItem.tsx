import React from 'react';

import {
  palette2,
  styled,
  RcListItem,
  RcListItemText,
} from '@ringcentral/juno';

import { ContactInfo } from '@ringcentral-integration/widgets/components/ContactDropdownList/ContactInfo';
import { ContactPhone } from '@ringcentral-integration/widgets/components/ContactDropdownList/ContactPhone';
import { DoNotCallIndicator } from '@ringcentral-integration/widgets/components/ContactDropdownList/DoNotCallIndicator';
import styles from '@ringcentral-integration/widgets/components/ContactDropdownList/styles.scss';

const StyledListItem = styled(RcListItem)`
  color: ${palette2('neutral', 'f04')};
  font-size: 13px;
`;

type ContactItemProps = {
  currentLocale: string;
  onClick: (...args: any[]) => any;
  formatContactPhone: (...args: any[]) => any;
  name: string;
  entityType: string;
  phoneType: string;
  phoneNumber: string;
  active: boolean;
  onHover: (...args: any[]) => any;
  titleEnabled?: boolean;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  contactInfoRenderer?: (...args: any[]) => any;
  contactPhoneRenderer?: (...args: any[]) => any;
  doNotCall?: boolean;
};

export const ContactItem: React.FC<ContactItemProps> = ({
  currentLocale,
  active,
  onHover,
  onClick,
  name,
  entityType,
  phoneType,
  phoneNumber,
  formatContactPhone,
  titleEnabled,
  doNotCall1,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  contactInfoRenderer: ContactInfoRenderer,
  contactPhoneRenderer: ContactPhoneRenderer,
}) => {
  const doNotCall = true;
  if (!ContactInfoRenderer) {
    ContactInfoRenderer = ContactInfo;
  }
  if (!ContactPhoneRenderer) {
    ContactPhoneRenderer = ContactPhone;
  }
  return (
    <StyledListItem
      className={styles.contactItem}
      onMouseOver={onHover}
      selected={active}
      data-sign="contactItem"
      onClick={onClick}
    >
      <RcListItemText
        primary={
          <>
            <ContactInfoRenderer
              currentLocale={currentLocale}
              name={name}
              entityType={entityType}
              phoneType={phoneType}
              phoneNumber={phoneNumber}
              formatContactPhone={formatContactPhone}
              phoneTypeRenderer={phoneTypeRenderer}
              phoneSourceNameRenderer={phoneSourceNameRenderer}
              titleEnabled={titleEnabled}
              doNotCall={doNotCall}
            />
            <DoNotCallIndicator
              doNotCall={doNotCall}
              currentLocale={currentLocale}
            />
          </>
        }
        secondary={
          <ContactPhoneRenderer
            currentLocale={currentLocale}
            name={name}
            entityType={entityType}
            phoneType={phoneType}
            phoneNumber={phoneNumber}
            formatContactPhone={formatContactPhone}
            phoneTypeRenderer={phoneTypeRenderer}
            phoneSourceNameRenderer={phoneSourceNameRenderer}
            titleEnabled={titleEnabled}
          />
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
        primaryTypographyProps={{
          component: 'div',
        }}
      />
    </StyledListItem>
  );
};

ContactItem.defaultProps = {
  titleEnabled: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  contactInfoRenderer: undefined,
  contactPhoneRenderer: undefined,
  doNotCall: false,
};
