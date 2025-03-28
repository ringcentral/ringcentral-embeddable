import React from 'react';
import {
  styled,
  palette2,
  RcTypography,
  RcLink,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcIconButton,
} from '@ringcentral/juno';
import { PhoneBorder, SmsBorder } from '@ringcentral/juno-icon'
import i18n from '@ringcentral-integration/widgets/components/ContactDetails/i18n';
import { filterByPhoneTypes, sortByPhoneTypes } from '@ringcentral-integration/commons/lib/phoneTypeHelper';

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

export const PhoneSection = ({
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

export const EmailSection = ({
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

export const CompanySection = ({
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

export function SiteSection({
  isMultipleSiteEnabled,
  site,
  currentLocale,
}) {
  if (!isMultipleSiteEnabled || !site) {
    return null;
  }
  return (
    <Section>
      <SectionName variant="caption2">{i18n.getString('site', currentLocale)}</SectionName>
      <SectionTextItem variant="body1" color="neutral.f06">{site.name}</SectionTextItem>
    </Section>
  );   
}