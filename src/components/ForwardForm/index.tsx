import React, { useState, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';

import { isBlank } from '@ringcentral-integration/commons/lib/isBlank';
import {
  RcDialog,
  RcDialogContent,
  RcDialogActions,
  RcDialogTitle,
  RcButton,
  RcList,
  RcListItem,
  RcListItemText,
  styled,
  css,
} from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/ForwardForm/i18n';
import RecipientsInput from '../RecipientsInput';

const ForwardNumbers = ({ numbers, onSelect, selected, formatPhone }: {
  numbers: any[];
  onSelect: (...args: any[]) => any;
  selected: number;
  formatPhone: (...args: any[]) => any;
}) => {
  return (
    <>
      {numbers.map((number: any, index: any) => (
        <RcListItem
          key={number.id}
          data-sign={`forward-number-${number.label.toLowerCase()}`}
          selected={index === selected}
          onClick={() => onSelect(index)}
        >
          <RcListItemText
            primary={number.label}
            secondary={formatPhone(number.phoneNumber)}
          />
        </RcListItem>
      ))}
    </>
  );
};

export interface ForwardFormProps {
  className?: string;
  onCancel: (...args: any[]) => any;
  currentLocale: string;
  forwardingNumbers: any[];
  formatPhone: (...args: any[]) => any;
  onForward: (...args: any[]) => any;
  onChange?: (...args: any[]) => any;
  searchContactList: any[];
  searchContact: (...args: any[]) => any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  autoFocus?: boolean;
  getPresence?: (...args: any[]) => any;
  open: boolean;
}

function getValue({
  selectedIndex,
  forwardingNumbers,
  recipient,
  customValue,
}) {
  if (selectedIndex < forwardingNumbers.length) {
    const forwardingNumber = forwardingNumbers[selectedIndex];
    return forwardingNumber && forwardingNumber.phoneNumber;
  }
  if (recipient) {
    return recipient.phoneNumber;
  }
  return customValue;
}

const StyledRecipientsInput = styled(RecipientsInput)`
  ${({ $hidden }) => ($hidden ? css`
    display: none;
  `: '')}

  label {
    min-width: 0;
    width: 0;
  }

  > div {
    width: 100%;
  }
`;

const ForwardForm: FunctionComponent<ForwardFormProps> = ({
  className = null,
  onCancel,
  currentLocale,
  forwardingNumbers,
  formatPhone,
  searchContact,
  searchContactList,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  autoFocus = true,
  onChange = undefined,
  onForward,
  getPresence,
  open,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customValue, setCustomValue] = useState('');
  const [handling, setHandling] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const customInputRef = useRef(null);
  const mounted = useRef(true);

  const value = getValue({
    selectedIndex,
    forwardingNumbers,
    recipient,
    customValue,
  });

  const disableButton = isBlank(value) || handling;
  const onSelect = (index) => {
    setSelectedIndex(index);
    if (typeof onChange === 'function') {
      onChange(getValue({
        selectedIndex: index,
        forwardingNumbers,
        recipient,
        customValue,
      }));
    }
  };
  
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, [])

  return (
    <RcDialog open={open} onClose={onCancel} className={className} fullScreen>
      <RcDialogTitle>
        Forward to
      </RcDialogTitle>
      <RcDialogContent>
        <RcList>
          <ForwardNumbers
            formatPhone={formatPhone}
            numbers={forwardingNumbers}
            onSelect={onSelect}
            selected={selectedIndex}
          />
          <RcListItem
            selected={selectedIndex === forwardingNumbers.length}
            onClick={() => {
              onSelect(forwardingNumbers.length);
              setTimeout(() => {
                if (customInputRef.current) {
                  customInputRef.current.focus();
                }
              }, 100);
            }}
          >
            <RcListItemText
              primary={i18n.getString('customNumber', currentLocale)}
            />
          </RcListItem>
        </RcList>
        <StyledRecipientsInput
          label=""
          placeholder=""
          $hidden={selectedIndex !== forwardingNumbers.length}
          inputRef={(ref) => {
            customInputRef.current = ref;
          }}
          value={customValue}
          onChange={(value) => {
            setCustomValue(value);
          }}
          onClean={() => {
            setCustomValue('');
          }}
          recipient={recipient}
          addToRecipients={(recipient) => {
            setRecipient(recipient);
            setCustomValue('');
          }}
          removeFromRecipients={() => {
            setRecipient(null);
          }}
          searchContact={searchContact}
          searchContactList={searchContactList}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
          formatContactPhone={formatPhone}
          currentLocale={currentLocale}
          titleEnabled
          autoFocus={autoFocus}
          getPresence={getPresence}
        />
      </RcDialogContent>
      <RcDialogActions>
        <RcButton
          variant="outlined"
          onClick={onCancel}
          data-sign="cancel"
        >
          {i18n.getString('cancel', currentLocale)}
        </RcButton>
        <RcButton
          variant="contained"
          onClick={async () => {
            setHandling(true);
            const result = await onForward(value);
            if (!mounted.current) {
              return;
            }
            setHandling(false);
            if (result) {
              onCancel();
            }
          }}
          data-sign="forwardCall"
          disabled={disableButton}
        >
          {i18n.getString('forward', currentLocale)}
        </RcButton>
      </RcDialogActions>
    </RcDialog>
  );
}

export default ForwardForm;
