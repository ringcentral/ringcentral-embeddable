import React, { memo } from 'react';

import PropTypes from 'prop-types';
import { RcSelect, RcMenuItem, RcListItemText, styled, palette2 } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/FromField/i18n';

const Select = styled(RcSelect)`
  width: auto;
  flex: 1;

  .RcBoxSelectInput-root {
    background-color: ${palette2('neutral', 'b01')};
  }

  .RcBoxSelectInput-input {
    .RcListItemText-primary {
      font-size: 0.875rem;
    }
    padding-left: 0;
  }
`;

const PhoneNumber = ({
  formatPhone,
  usageType,
  currentLocale,
  phoneNumber,
}: any) => {
  if (phoneNumber === 'anonymous') {
    return (
      <RcListItemText
        primary={i18n.getString('Blocked', currentLocale)}
      />
    );
  }
  return (
    <RcListItemText
      data-sign="phoneNumber"
      primary={usageType ? i18n.getString(usageType, currentLocale) : formatPhone(phoneNumber)}
      secondary={ usageType ? formatPhone(phoneNumber) : null }
    />
  );
};

PhoneNumber.propTypes = {
  formatPhone: PropTypes.func.isRequired,
  phoneNumber: PropTypes.string,
  usageType: PropTypes.string,
  currentLocale: PropTypes.string.isRequired,
};

PhoneNumber.defaultProps = {
  phoneNumber: null,
  usageType: null,
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
const FromField = memo(function FromField({
  className,
  fromNumber,
  fromNumbers,
  onChange,
  formatPhone,
  hidden,
  disabled,
  showAnonymous,
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
              />
            </RcMenuItem>
          ))
        }
      </Select>
    </Root>
  );
});

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'Named... Remove this comment to see the full error message
FromField.propTypes = {
  fromNumber: PropTypes.string,
  formatPhone: PropTypes.func.isRequired,
  fromNumbers: PropTypes.arrayOf(
    PropTypes.shape({
      phoneNumber: PropTypes.string,
      usageType: PropTypes.string,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  currentLocale: PropTypes.string.isRequired,
  hidden: PropTypes.bool.isRequired,
  showAnonymous: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'Na... Remove this comment to see the full error message
FromField.defaultProps = {
  fromNumber: null,
  className: undefined,
  showAnonymous: true,
  disabled: false,
};

export default FromField;
