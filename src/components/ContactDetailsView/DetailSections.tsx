import React from 'react';
import {
  styled,
  palette2,
  RcTypography,
  RcLink,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
} from '@ringcentral/juno';
import {
  PhoneBorder,
  SmsBorder,
  CallsBorder,
  Apps,
  TodayCalendarIco,
} from '@ringcentral/juno-icon'
import i18n from '@ringcentral-integration/widgets/components/ContactDetails/i18n';
import { filterByPhoneTypes, sortByPhoneTypes } from '@ringcentral-integration/commons/lib/phoneTypeHelper';
import { ActionMenu } from '../ActionMenu';

const StyledActionMenu = styled(ActionMenu)`
  .RcIconButton-root {
    margin-left: 8px;

    &:first-child {
      margin-left: 0;
    }
  }
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

const PHONE_ACTIONS_ICON_MAP = {
  'call': PhoneBorder,
  'text': SmsBorder,
  'apps': Apps,
  'clock': CallsBorder,
  'calendar': TodayCalendarIco,
};

function getActions({
  phoneType,
  phoneNumber,
  currentLocale,
  disableLinks,
  isCallButtonDisabled,
  canCallButtonShow,
  canTextButtonShow,
  onClickToDial,
  onClickToSMS,
  contact,
  additionalActions,
  onClickAdditionalAction,
}) {
  const actions = [];
  if (canCallButtonShow(phoneType)) {
    actions.push({
      id: 'call',
      icon: PhoneBorder,
      title: `${i18n.getString('call', currentLocale)} ${phoneNumber}`,
      onClick: () => onClickToDial(contact, phoneNumber),
      disabled: isCallButtonDisabled,
    });
  }
  if (canTextButtonShow(phoneType)) {
    actions.push({
      id: 'text',
      icon: SmsBorder,
      title: `${i18n.getString('text', currentLocale)} ${phoneNumber}`,
      onClick: () => onClickToSMS(contact, phoneNumber),
      disabled: disableLinks,
    });
  }
  if (additionalActions && additionalActions.length > 0) {
    additionalActions.forEach(action => {
      actions.push({
        id: action.id,
        icon: PHONE_ACTIONS_ICON_MAP[action.icon] || Apps,
        title: action.label,
        onClick: () => onClickAdditionalAction(action.id, {
          ...contact,
          phoneNumber,
          phoneType,
        }),
        disabled: disableLinks,
      });
    });
  }
  return actions;
}

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
  additionalActions,
  onClickAdditionalAction,
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
        const actions = getActions({
          phoneType,
          phoneNumber: usedPhoneNumber,
          currentLocale,
          disableLinks,
          isCallButtonDisabled,
          canCallButtonShow,
          canTextButtonShow,
          onClickToDial,
          onClickToSMS,
          contact,
          additionalActions,
          onClickAdditionalAction,
        });
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
              <StyledActionMenu
                actions={actions}
                size="small"
                maxActions={3}
                iconVariant="contained"
                color="neutral.b01"
              />
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