import React from 'react';
import {
  styled,
  palette2,
  RcTypography,
  RcMenuItem,
  RcListItemText,
  RcSelect,
  useResponsiveMatch,
  css,
} from '@ringcentral/juno';
import i18n from './i18n';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const FromLabel = styled(RcTypography)<{
  $bigFont: boolean;
  $mediumFont: boolean;
}>`
  ${({ $mediumFont }) => $mediumFont && css`
    font-size: 0.875rem;
  `}

  ${({ $bigFont }) => $bigFont && css`
    font-size: 1rem;
  `}
`;

const Select = styled(RcSelect)<{
  $bigFont: boolean;
  $mediumFont: boolean;
}>`
  width: auto;

  .RcBoxSelectInput-root {
    background-color: ${palette2('neutral', 'b01')};
  }
  .RcBoxSelectInput-input {
    font-size: 0.75rem;

    ${({ $mediumFont }) => $mediumFont && css`
      font-size: 0.875rem;
    `}

    ${({ $bigFont }) => $bigFont && css`
      font-size: 1rem;
    `}
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
  label = '',
}) => {
  let primaryText = '';
  if (phoneNumber === 'anonymous') {
    primaryText = i18n.getString('Blocked', currentLocale);
  } else if (usageType) {
    if (label) {
      primaryText = label;
    } else if (primary) {
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
  const { gtXS, gtSM } = useResponsiveMatch();
  if (hidden) {
    return null;
  }
  return (
    <Container>
      <FromLabel
        variant="caption1"
        $bigFont={gtSM}
        $mediumFont={gtXS}
      >
        {i18n.getString('from', currentLocale)}:
      </FromLabel>
      <Select
        $bigFont={gtSM}
        $mediumFont={gtXS}
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
                  label={number.label}
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
