import type { FunctionComponent } from 'react';
import React, { useEffect, useRef } from 'react';

import type { ToNumber as Recipient } from '@ringcentral-integration/commons/modules/ComposeText';
import {
  flexCenterStyle,
  RcDialerPadSoundsMPEG,
  RcDialPad,
  RcIconButton,
  styled,
  palette2,
} from '@ringcentral/juno';
import { Phone } from '@ringcentral/juno-icon';

import RecipientsInput from '@ringcentral-integration/widgets/components/RecipientsInput';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import FromField from './FromField';

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: ${palette2('neutral', 'b01')};
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  overflow-y: auto;
`;

const DialerWrapper = styled.div<{ withTabs: boolean }>`
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  flex-direction: column;
  margin: 0 16%;
`;

const BodyBottom = styled.div`
  ${flexCenterStyle};
  padding-bottom: 20px;
`;

const StyledRecipientsInput = styled(RecipientsInput)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 0;
  margin-bottom: 0;

  label {
    display: none;
  }

  .MuiInput-underline:after {
    border-bottom: none;
  }

  .MuiInput-underline:before {
    border-bottom: none;
  }

  .MuiInput-underline:hover:not(.Mui-disabled):before {
    border-bottom: none;
  }

  input {
    text-align: center;
  }

  .RecipientsInput_rightPanel {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
`;

export interface DialerPanelProps {
  currentLocale: string;
  className?: string;
  dialButtonsClassName?: string;
  onCallButtonClick: (...args: any[]) => any;
  callButtonDisabled?: boolean;
  isWebphoneMode?: boolean;
  toNumber?: string;
  onToNumberChange?: (...args: any[]) => any;
  fromNumber?: string;
  fromNumbers?: {
    phoneNumber?: string;
    usageType?: string;
  }[];
  changeFromNumber?: (...args: any[]) => any;
  formatPhone?: (...args: any[]) => any;
  showSpinner?: boolean;
  dialButtonVolume?: number;
  dialButtonMuted?: boolean;
  searchContact: (...args: any[]) => any;
  searchContactList: {
    name: string;
    entityType: string;
    phoneType: string;
    phoneNumber: string;
  }[];
  recipient?: Recipient;
  recipients: Recipient[];
  clearToNumber: (...args: any[]) => any;
  setRecipient: (...args: any[]) => any;
  clearRecipient: (...args: any[]) => any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  recipientsContactInfoRenderer?: (...args: any[]) => any;
  recipientsContactPhoneRenderer?: (...args: any[]) => any;
  autoFocus?: boolean;
  showFromField?: boolean;
  disableFromField?: boolean;
  withTabs?: boolean;
  inConference?: boolean;
  isLastInputFromDialpad?: boolean;
  useV2?: boolean;
  showAnonymous?: boolean;
}
const DialerPanel: FunctionComponent<DialerPanelProps> = ({
  currentLocale,
  callButtonDisabled,
  // className,
  // dialButtonsClassName,
  onToNumberChange,
  onCallButtonClick,
  toNumber,
  fromNumber,
  fromNumbers,
  changeFromNumber,
  formatPhone,
  isWebphoneMode,
  showSpinner,
  dialButtonVolume,
  dialButtonMuted,
  searchContact,
  searchContactList,
  // recipients,
  recipient,
  clearToNumber,
  setRecipient,
  clearRecipient,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  recipientsContactInfoRenderer,
  recipientsContactPhoneRenderer,
  autoFocus,
  showFromField = true,
  disableFromField = false,
  children,
  withTabs,
  // inConference,
  isLastInputFromDialpad,
  showAnonymous,
  useV2,
}) => {
  const inputEl = useRef(null);
  useEffect(() => {
    if (useV2 && autoFocus && inputEl.current) {
      // @ts-expect-error TS(2339): Property 'focus' does not exist on type 'never'.
      inputEl.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const input = (
    <StyledRecipientsInput
      inputRef={(element) => {
        inputEl.current = element;
      }}
      value={toNumber}
      onChange={onToNumberChange}
      onClean={clearToNumber}
      recipient={recipient}
      addToRecipients={setRecipient}
      removeFromRecipients={clearRecipient}
      searchContact={searchContact}
      searchContactList={searchContactList}
      formatContactPhone={formatPhone}
      currentLocale={currentLocale}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      contactInfoRenderer={recipientsContactInfoRenderer}
      contactPhoneRenderer={recipientsContactPhoneRenderer}
      isLastInputFromDialpad={isLastInputFromDialpad}
      titleEnabled
      autoFocus={autoFocus}
    />
  );
  return (
    <Container>
      {showFromField ? (
        <FromField
          // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
          showAnonymous={showAnonymous}
          // @ts-expect-error TS(2322): Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
          fromNumber={fromNumber}
          // @ts-expect-error TS(2322): Type '{ phoneNumber?: string | undefined; usageTyp... Remove this comment to see the full error message
          fromNumbers={fromNumbers}
          // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
          onChange={changeFromNumber}
          // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
          formatPhone={formatPhone}
          currentLocale={currentLocale}
          hidden={!isWebphoneMode}
          disabled={disableFromField}
        />
      ) : null}
      {input}
      <DialerWrapper withTabs={withTabs}>
        <RcDialPad
          data-sign="dialPad"
          onChange={(value) => {
            // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
            onToNumberChange(toNumber + value, true);
          }}
          sounds={RcDialerPadSoundsMPEG}
          getDialPadButtonProps={(v) => ({
            'data-test-id': `${v}`,
            'data-sign': `dialPadBtn${v}`,
          })}
          volume={dialButtonVolume}
          muted={dialButtonMuted}
        />
      </DialerWrapper>
      <BodyBottom>
        <RcIconButton
          data-sign="callButton"
          color="success.b03"
          symbol={Phone}
          size={withTabs ? 'medium' : 'large'}
          variant="contained"
          elevation="0"
          activeElevation="0"
          onClick={() => onCallButtonClick({ clickDialerToCall: true })}
          disabled={callButtonDisabled}
        />
      </BodyBottom>
      {showSpinner ? <SpinnerOverlay /> : null}
      {children}
    </Container>
  );
};

const Empty: FunctionComponent = () => null;

DialerPanel.defaultProps = {
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  className: null,
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  dialButtonsClassName: null,
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  fromNumber: null,
  callButtonDisabled: false,
  toNumber: '',
  fromNumbers: [],
  isWebphoneMode: false,
  changeFromNumber: Empty,
  onToNumberChange: Empty,
  formatPhone: (phoneNumber) => phoneNumber,
  showSpinner: false,
  dialButtonVolume: 1,
  dialButtonMuted: false,
  recipients: [],
  autoFocus: false,
  showFromField: true,
  disableFromField: false,
  withTabs: false,
  inConference: false,
  isLastInputFromDialpad: false,
  useV2: false,
  showAnonymous: true,
};
export default DialerPanel;
