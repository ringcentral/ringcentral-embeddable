import React, { memo } from 'react';

import { RcSelect, RcMenuItem, RcListItemText, styled, palette2 } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/FromField/i18n';
import { getPhoneNumberLabel } from '../DialerPanel/FromField/helper';

const Select = styled(RcSelect)`
  width: auto;
  flex: 1;

  .RcBoxSelectInput-root {
    background-color: ${palette2('neutral', 'b01')};
  }

  .RcBoxSelectInput-input {
    .RcListItemText-primary {
      font-size: 0.75rem;
    }
    padding-left: 0;
  }
`;

const PhoneNumber = ({
  formatPhone,
  usageType = null,
  currentLocale,
  phoneNumber = null,
  extension = null,
  primary = false,
  label = '',
}: {
  formatPhone: (...args: any[]) => any;
  usageType?: string;
  currentLocale: string;
  phoneNumber?: string;
  primary?: boolean;
  label?: string;
  extension?: {
    name: string;
  };
}) => {
  let formattedLabel = getPhoneNumberLabel({
    phoneNumber,
    usageType,
    primary,
    label,
  }, currentLocale);
  if (extension && extension.name) {
    formattedLabel = extension.name;
  }
  return (
    <RcListItemText
      data-sign="phoneNumber"
      primary={formattedLabel ? formattedLabel : formatPhone(phoneNumber)}
      secondary={ formattedLabel ? formatPhone(phoneNumber) : null }
    />
  );
};

type PhoneNumberType = {
  phoneNumber: string;
  usageType?: string;
  primary?: boolean;
  label?: string;
  extension?: {
    name: string;
  };
}

interface FromFieldIns {
  fromNumber: string;
  formatPhone: (...args: any[]) => any;
  fromNumbers: PhoneNumberType[];
  onChange: (...args: any[]) => any;
  currentLocale: string;
  hidden: boolean;
  showAnonymous: boolean;
  className?: string;
  disabled?: boolean;
}

const Root = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  font-size: 12px;
  border: none;
  padding: 0;
  align-items: center;
`;

const Label = styled.label`
  font-size: 14px;
  color: ${palette2('neutral', 'f06')};
  font-size: 12px;
  width: 46px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: normal;
  margin-bottom: 0;
`;

// phone number formatting becomes expensive when there are lots of numbers
// memo makes this a pure component to reduce rendering cost
export const FromField = memo(function FromField({
  className = undefined,
  fromNumber = null,
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
  const options = [...fromNumbers];
  if (showAnonymous) {
    options.push({
      phoneNumber: 'anonymous',
    });
  }

  return (
    <Root className={className}>
      <Label>
        {i18n.getString('from', currentLocale)}:
      </Label>
      <Select
        value={fromNumber}
        variant="box"
        onChange={(e) => {
          onChange(e.target.value);
        }}
        disabled={disabled}
        renderValue={(value) => {
          return (
            <PhoneNumber
              formatPhone={formatPhone}
              phoneNumber={value as string}
              currentLocale={currentLocale}
            />
          );
        }}
      >
        {
          options.map((option) => (
            <RcMenuItem
              key={option.phoneNumber}
              value={option.phoneNumber}
            >
              <PhoneNumber
                formatPhone={formatPhone}
                phoneNumber={option.phoneNumber}
                usageType={option.usageType}
                currentLocale={currentLocale}
                extension={option.extension}
                primary={option.primary}
                label={option.label}
              />
            </RcMenuItem>
          ))
        }
      </Select>
    </Root>
  );
});
