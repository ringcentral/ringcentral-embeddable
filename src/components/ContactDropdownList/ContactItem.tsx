import React, { useState, useEffect, useRef } from 'react';

import {
  palette2,
  styled,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcAvatar,
  RcIcon,
} from '@ringcentral/juno';

import { UserDefault } from '@ringcentral/juno-icon';

import { ContactInfo } from '@ringcentral-integration/widgets/components/ContactDropdownList/ContactInfo';
import { ContactPhone } from '@ringcentral-integration/widgets/components/ContactDropdownList/ContactPhone';
import { DoNotCallIndicator } from '@ringcentral-integration/widgets/components/ContactDropdownList/DoNotCallIndicator';
import { getPresenceStatus } from '@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper';
import styles from '@ringcentral-integration/widgets/components/ContactDropdownList/styles.scss';

const StyledListItem = styled(RcListItem)`
  color: ${palette2('neutral', 'f04')};
  font-size: 13px;
  box-sizing: border-box;
  min-height: 32px;
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
  
  getPresence?: (...args: any[]) => any;
  
  contact: {
    profileImageUrl?: string;
    presence?: string;
    doNotCall?: boolean;
    name: string;
    entityType: string;
    phoneType: string;
    phoneNumber: string;
  };
  hiddenContactInfo?: boolean;
};

const EmptyAvatar = styled.div`
  margin: 3px 8px 3px 0px;
  width: 32px;
`;

function ContactAvatar({
  profileImageUrl,
  presence,
  getPresence
}) {
  const [presenceState, setPresenceState] = useState(presence);
  const mounted = useRef(true);
  useEffect(() => {
    if (typeof getPresence !== 'function') {
      return;
    }
    const fetchData = async () => {
      const presenceData = await getPresence();
      if (mounted.current) {
        setPresenceState(presenceData);
      }
    };
    fetchData();
    return () => {
      mounted.current = false;
    }
  }, []);
  return (
    <RcListItemAvatar>
      <RcAvatar
        size="xsmall"
        src={profileImageUrl}
        color="avatar.global"
        presenceProps={
          presenceState ? {
            type: getPresenceStatus(presenceState),
          } : undefined
        }
      >
        {
          !profileImageUrl && (
            <RcIcon
              symbol={UserDefault}
            />
          )
        }
      </RcAvatar>
    </RcListItemAvatar>
  );
};

export const ContactItem: React.FC<ContactItemProps> = ({
  currentLocale,
  active,
  onHover,
  onClick,
  formatContactPhone,
  titleEnabled,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  contactInfoRenderer: ContactInfoRenderer,
  contactPhoneRenderer: ContactPhoneRenderer,
  getPresence,
  contact,
  hiddenContactInfo,
}) => {
  const {
    profileImageUrl,
    presence,
    doNotCall,
    name,
    entityType,
    phoneType,
    phoneNumber,
  } = contact;
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
      {
        hiddenContactInfo ?
          (<EmptyAvatar />) :
          (
            <ContactAvatar
              presence={presence}
              profileImageUrl={profileImageUrl}
              getPresence={getPresence}
            />
          )
      }
      
      <RcListItemText
        primary={
          hiddenContactInfo ?
            null : 
            (
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
            )
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
