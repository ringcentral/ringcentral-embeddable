import React from 'react';
import {
  styled,
  palette2,
  RcTypography,
  RcMenuItem,
  RcListItemText,
  RcSelect,
} from '@ringcentral/juno';
import i18n from './i18n';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Select = styled(RcSelect)`
  width: auto;

  .RcBoxSelectInput-root {
    background-color: ${palette2('neutral', 'b01')};
  }
  .RcBoxSelectInput-input {
    font-size: 0.75rem;
  }
`;

const StyledListItemText = styled(RcListItemText)`
  .RcListItemText-primary {
    font-size: 0.875rem;
    color: ${palette2('neutral', 'f06')};
  }
`;

const PhoneNumber = ({
  formatPhone,
  usageType = null,
  currentLocale,
  phoneNumber,
  primary = false,
}) => {
  let primaryText = '';
  if (phoneNumber === 'anonymous') {
    primaryText = i18n.getString('Blocked', currentLocale);
  } else if (usageType) {
    if (primary) {
      primaryText = i18n.getString('primary', currentLocale);
    } else {
      primaryText = i18n.getString(usageType, currentLocale);
    }
  }
  let secondaryText = phoneNumber === 'anonymous' ? undefined : formatPhone(phoneNumber);
  if (!usageType && phoneNumber !== 'anonymous') {
    primary = formatPhone(phoneNumber);
    secondaryText = undefined;
  }
 
  return (
    <StyledListItemText
      primary={primaryText}
      secondary={secondaryText}
    />
  );
};

interface FromFieldIns {
  fromNumber: string;
  formatPhone: (...args: any[]) => any;
  fromNumbers: any[];
  onChange: (...args: any[]) => any;
  currentLocale: string;
  hidden: boolean;
  showAnonymous: boolean;
  className?: string;
  disabled?: boolean;
}

function FromField({
  fromNumber = '',
  fromNumbers,
  onChange,
  formatPhone,
  hidden,
  disabled = false,
  showAnonymous = true,
  currentLocale,
}: FromFieldIns) {
  if (hidden) {
    return null;
  }
  return (
    <Container>
      <RcTypography variant="caption1">{i18n.getString('from', currentLocale)}:</RcTypography>
      <Select
        value={fromNumber}
        onChange={(e) => {
          onChange({
            phoneNumber: e.target.value,
          });
        }}
        disabled={disabled}
        variant="box"
        renderValue={(value) => {
          if (value === 'anonymous') {
            return i18n.getString('Blocked', currentLocale);
          }
          return formatPhone(value);
        }}
        virtualize
      >
        {
          fromNumbers.map((number, index) => {
            return (
              <RcMenuItem
                key={index}
                value={number.phoneNumber}
                data-search-text={number.phoneNumber}
              >
                <PhoneNumber
                  formatPhone={formatPhone}
                  phoneNumber={number.phoneNumber}
                  usageType={number.usageType}
                  currentLocale={currentLocale}
                  primary={number.primary}
                />
              </RcMenuItem>
            );
          })
        }
        {
          showAnonymous ? (
            <RcMenuItem
              value="anonymous"
              data-search-text="anonymous"
            >
              <PhoneNumber
                formatPhone={formatPhone}
                phoneNumber="anonymous"
                currentLocale={currentLocale}
              />
            </RcMenuItem>
          ) : null
        }
      </Select>
    </Container>
  );
};

export default FromField;
