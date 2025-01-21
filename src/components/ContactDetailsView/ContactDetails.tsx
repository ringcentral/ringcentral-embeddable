import type { FunctionComponent } from 'react';
import React from 'react';
import type { ContactModel } from '@ringcentral-integration/commons/interfaces/Contact.model';
import type {
  clickToDial,
  clickToSMS,
  formatNumber,
  onClickMailTo,
  sourceNodeRenderer,
} from '@ringcentral-integration/widgets/components/ContactDetails/ContactDetails.interface';
import type { GetPresenceFn } from '@ringcentral-integration/widgets/react-hooks/usePresence';
import { usePresence } from '@ringcentral-integration/widgets/react-hooks/usePresence';
import { getPresenceStatus } from '@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper';
import { getPresenceStatusName } from '@ringcentral-integration/widgets/lib/getPresenceStatusName';
import { extensionStatusTypes } from '@ringcentral-integration/commons/enums/extensionStatusTypes';
import {
  styled,
  palette2,
  RcAvatar,
  RcTypography,
  RcLink,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcIconButton,
  useAvatarColorToken,
  useAvatarShortName
} from '@ringcentral/juno';
import { PhoneBorder, SmsBorder } from '@ringcentral/juno-icon'
import i18n from '@ringcentral-integration/widgets/components/ContactDetails/i18n';
import { filterByPhoneTypes, sortByPhoneTypes } from '@ringcentral-integration/commons/lib/phoneTypeHelper';

interface ContactDetailsProps extends onClickMailTo,
  clickToSMS,
  clickToDial,
  formatNumber,
  sourceNodeRenderer {
  currentLocale: string;
  contact: ContactModel;
  disableLinks: boolean;
  isMultipleSiteEnabled: boolean;
  isCallButtonDisabled: boolean;
  getPresence: GetPresenceFn;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 16px;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
`;

const Name = styled(RcTypography)`
  margin-top: 5px;
`;

const SubInfo = styled(RcTypography)`
  margin-bottom: 5px;
  color: ${palette2('neutral', 'f04')};
  font-size: 0.875rem;
`;

const SourceIcon = styled.div`
  position: absolute;
  top: 14%;
  right: 14%;
  transform: translate(50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 10px;
  overflow: hidden;
`;

const Section = styled.div`
  padding: 8px 0;
  border-radius: 8px;
  font-size: 0.875rem;
  border: 1px solid ${palette2('neutral', 'l02')};
  width: 100%;
  margin: 8px 0;
`;

const SectionName = styled(RcTypography)`
  padding: 0 16px;
  color: ${palette2('neutral', 'f06')};
`;

const SectionLinkItem = styled(RcLink)`
  font-size: 0.875rem;
  color: ${palette2('interactive', 'f01')};
  padding: 0 16px;
  margin-top: 5px;
  display: block;
  user-select: text;
`;

const SectionTextItem = styled(RcTypography)`
  font-size: 0.875rem;
  padding: 0 16px;
  margin-top: 5px;
  user-select: text;
`;

const SectionItem = styled(RcListItem)`
  padding-top: 0;
  .MuiTypography-root {
    user-select: text;
  }

  .RcListItemText-primary {
    font-size: 0.75rem;
    color: ${palette2('neutral', 'f04')};
  }

  .RcListItemText-secondary {
    font-size: 0.875rem;
  }
`;

const PhoneSection = ({
  contact,
  currentLocale,
  disableLinks,
  isCallButtonDisabled,
  isMultipleSiteEnabled,
  formatNumber,
  canCallButtonShow,
  canTextButtonShow,
  onClickToDial,
  onClickToSMS,
}) => {
  if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
    return null;
  }
  const sortedPhoneNumbers = sortByPhoneTypes(
    filterByPhoneTypes(contact.phoneNumbers),
  );
  return (
    <Section>
      {sortedPhoneNumbers.map((item, idx) => {
        const { phoneType, phoneNumber, rawPhoneNumber } = item;
        const formattedNumber = formatNumber(phoneNumber);
        const displayedPhoneNumber = rawPhoneNumber || formattedNumber;
        const usedPhoneNumber =
          isMultipleSiteEnabled && phoneType === 'extension'
            ? formattedNumber
            : phoneNumber;
        return (
          <SectionItem key={idx}>
            <RcListItemText
              primary={i18n.getString(phoneType, currentLocale)}
              secondary={displayedPhoneNumber}
              secondaryTypographyProps={{
                title: usedPhoneNumber,
                color: 'interactive.f01',
              }}
            />
            <RcListItemSecondaryAction>
              {canCallButtonShow(phoneType) && (
                <RcIconButton
                  symbol={PhoneBorder}
                  size="small"
                  data-sign="call"
                  onClick={() => onClickToDial(contact, usedPhoneNumber)}
                  disabled={isCallButtonDisabled}
                  title={`${i18n.getString('call', currentLocale)} ${usedPhoneNumber}`}
                  variant="contained"
                  color="neutral.b01"
                />
              )}
              {canTextButtonShow(phoneType) && (
                <RcIconButton
                  symbol={SmsBorder}
                  size="small"
                  data-sign="text"
                  disabled={disableLinks}
                  title={`${i18n.getString('text', currentLocale)} ${usedPhoneNumber}`}
                  onClick={() => onClickToSMS(contact, usedPhoneNumber)}
                  variant="contained"
                  color="neutral.b01"
                />
              )}
            </RcListItemSecondaryAction>
          </SectionItem>
        )
      })}
    </Section>
  )
}

const EmailSection = ({
  emails,
  contactType,
  currentLocale,
  onClickMailTo
}) => {
  if (!emails || emails.length === 0) {
    return null;
  }
  return (
    <Section>
      <SectionName variant="caption2">{i18n.getString('emailLabel', currentLocale)}</SectionName>
      {
        emails.map((email, idx) => (
          <SectionLinkItem
            title={email}
            key={idx}
            variant='caption1'
            onClick={(e) => {
              e.preventDefault();
              if (onClickMailTo) {
                onClickMailTo(email, contactType)
              }
            }}
          >
            {email}
          </SectionLinkItem>
        ))
      }
    </Section>
  )
}

const CompanySection = ({
  company,
  currentLocale,
  department,
}) => {
  if (!company && !department) {
    return null;
  }
  return (
    <Section>
      {
        department && (
          <SectionItem canHover={false}>
            <RcListItemText
              primary='Department'
              secondary={department}
              secondaryTypographyProps={{
                title: department,
                color: 'neutral.f06',
              }}
            />
          </SectionItem>
        )
      }
      {
        company && (
          <SectionItem canHover={false}>
            <RcListItemText
              primary={i18n.getString('company', currentLocale)}
              secondary={company}
              secondaryTypographyProps={{
                title: company,
                color: 'neutral.f06',
              }}
            />
          </SectionItem>
        )
      }
    </Section>
  );
}

const ProfileWrapper = styled.div`
  position: relative;
`;

const Profile = ({
  contact,
  sourceNodeRenderer,
  currentLocale,
  getPresence,
  fullName,
  notActivated,
}) => {
  const [firstName, lastName] = fullName?.split(/\s+/) || [];
  const presence = usePresence(contact, { fetch: getPresence });
  const avatarColor = useAvatarColorToken(fullName);
  const avatarName = useAvatarShortName({
    firstName,
    lastName,
  });
  let presenceName = presence ? getPresenceStatusName(
    presence.presenceStatus,
    presence.dndStatus,
    currentLocale,
  ) : '';
  let presenceType = presence ? getPresenceStatus(presence) : undefined;
  if (notActivated) {
    presenceName = i18n.getString('notActivated', currentLocale);
    presenceType = 'unavailable';
  }

  return (
    <ProfileWrapper>
      <RcAvatar
        size="medium"
        color={avatarColor}
        src={contact.profileImageUrl}
        presenceOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        presenceProps={presence ? {
          type: presenceType,
          title: presenceName,
        } : undefined}
      >
        {avatarName}
      </RcAvatar>
      {
          sourceNodeRenderer && (
            <SourceIcon>
              {sourceNodeRenderer({ sourceType: contact.type })}
            </SourceIcon>
          )
        }
    </ProfileWrapper>
  );
}
export const ContactDetails: FunctionComponent<ContactDetailsProps> = ({
  contact,
  currentLocale,
  onClickMailTo,
  disableLinks,
  isMultipleSiteEnabled,
  isCallButtonDisabled,
  canCallButtonShow,
  canTextButtonShow,
  formatNumber,
  onClickToDial,
  onClickToSMS,
  sourceNodeRenderer,
  getPresence,
}) => {
  const fullName = contact.name || `${contact.firstName} ${contact.lastName}`;

  if (!contact) {
    return null;
  }

  const notActivated = contact.status === extensionStatusTypes.notActivated;

  return (
    <Container>
      <Profile
        contact={contact}
        sourceNodeRenderer={sourceNodeRenderer}
        currentLocale={currentLocale}
        getPresence={getPresence}
        fullName={fullName}
        notActivated={notActivated}
      />
      <Name variant="subheading1" color="neutral.f06">{fullName}</Name>
      {
        notActivated && (
          <SubInfo variant="body1">
            ({i18n.getString('notActivated', currentLocale)})
          </SubInfo>
        )
      }
      {
        contact.jobTitle ? (
          <SubInfo variant="body1">
            {contact.jobTitle}
          </SubInfo>
        ) : (<br />)
      }
      {
        isMultipleSiteEnabled && contact.site && (
          <Section>
            <SectionName variant="caption2">{i18n.getString('site', currentLocale)}</SectionName>
            <SectionTextItem variant="body1" color="neutral.f06">{contact.site.name}</SectionTextItem>
          </Section>
        )
      }
      <PhoneSection
        contact={contact}
        currentLocale={currentLocale}
        disableLinks={disableLinks}
        isCallButtonDisabled={isCallButtonDisabled}
        isMultipleSiteEnabled={isMultipleSiteEnabled}
        formatNumber={formatNumber}
        canCallButtonShow={canCallButtonShow}
        canTextButtonShow={canTextButtonShow}
        onClickToDial={onClickToDial}
        onClickToSMS={onClickToSMS}
      />
      <EmailSection
        emails={contact.emails}
        contactType={contact.type}
        currentLocale={currentLocale}
        onClickMailTo={onClickMailTo}
      />
      <CompanySection
        company={contact.company}
        currentLocale={currentLocale}
        department={contact.department}
      />
    </Container>
  )
}