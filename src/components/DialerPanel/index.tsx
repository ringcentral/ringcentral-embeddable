import type { FunctionComponent } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import type { ToNumber as Recipient } from '@ringcentral-integration/commons/modules/ComposeText';
import {
  flexCenterStyle,
  RcDialerPadSoundsMPEG,
  RcDialPad,
  RcIconButton,
  styled,
  palette2,
  spacing,
  setOpacity,
  css,
} from '@ringcentral/juno';
import { Phone } from '@ringcentral/juno-icon';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import FromField from './FromField';
import { StyledRecipientsInput } from './StyledRecipientsInput';

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: ${palette2('neutral', 'b01')};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  justify-content: space-around;
  padding-top: ${spacing(2)};

  @media only screen and (min-width: 350px) {
    .RecipientsInput_numberInput {
      font-size: 1.25rem;

      &::placeholder {
        font-size: 1rem;
      }
    }

    .RecipientsInput_selectReceivers li {
      font-size: 0.875rem;
    }
  }

  @media only screen and (min-width: 400px) {
    padding: ${spacing(4)} 0;

    .RecipientsInput_numberInput {
      font-size: 1.5rem;

      &::placeholder {
        font-size: 1.25rem;
      }
    }

    .RecipientsInput_selectReceivers li {
      font-size: 1rem;
    }
  }
`;

const DialerWrapper = styled.div<{ $dialerHeight: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 0 18%;
  padding: ${spacing(1)} 0;

  ${({ $dialerHeight }) => {
    if ($dialerHeight <= 335) {
      return css`
        margin: 0 20%;
        padding: 0;

        .RcIconButton-contained {
          width: 26%;
          padding-top: 26%;
        }
      `;
    }
    return '';
  }}
`;

const StyledDialpad = styled(RcDialPad)`
  max-width: 300px;
  width: 100%;

  .RcIconButton-contained::before {
    border: 1px solid ${palette2('neutral', 'l02')};
    box-shadow: none;
  }

  .RcIconButton-contained {
    background-color: transparent;
    margin-bottom: ${spacing(4)};
    box-shadow: none;
  }

  .RcIconButton-contained:hover::before {
    background-color: ${setOpacity(palette2('neutral', 'b06'), '08')};
  }

  @media only screen and (max-width: 400px) {
    .RcIconButton-contained {
      margin-bottom: ${spacing(2)};
    }
  }

  @media only screen and (max-width: 350px) {
    .RcIconButton-contained {
      margin-bottom: ${spacing(1)};
    }
  }
`;

const CallButtonWrapper = styled.div`
  ${flexCenterStyle};
`;

const CallButton = styled(RcIconButton)<{ $dialerHeight: number }>`
  margin-bottom: ${spacing(2)};

  ${({ $dialerHeight }) => {
    if ($dialerHeight <= 335) {
      return css`
        width: 42px;
        height: 42px;
      `;
    }
    return '';
  }}

  @media only screen and (min-width: 350px) {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }
  @media only screen and (min-width: 400px) {
    width: 72px;
    height: 72px;
    font-size: 36px;
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
  getPresence?: (...args: any[]) => any;
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
  getPresence,
}) => {
  const inputEl = useRef(null);
  const containerEl = useRef(null);
  const [dialerHeight, setDialerHeight] = useState(345);

  useEffect(() => {
    if (useV2 && autoFocus && inputEl.current) {
      inputEl.current.focus();
    }
    if (containerEl.current) {
      setDialerHeight(containerEl.current.clientHeight);
      // listen to element resize
      if (!window.ResizeObserver) {
        return;
      }
      const resizeObserver = new ResizeObserver(() => {
        if (containerEl.current) {
          setDialerHeight(containerEl.current.clientHeight);
        }
      });
      resizeObserver.observe(containerEl.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    if (callButtonDisabled) {
      return;
    }
    const onKeyDown = (e) => {
      if (e.key === 'Enter') {
        onCallButtonClick({ clickDialerToCall: true });
      }
    };
    window.document.addEventListener('keydown', onKeyDown);
    return () => {
      window.document.removeEventListener('keydown', onKeyDown);
    };
  }, [callButtonDisabled]);

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
      getPresence={getPresence}
    />
  );
  return (
    <Container ref={containerEl}>
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
      <DialerWrapper $dialerHeight={dialerHeight}>
        <StyledDialpad
          data-sign="dialPad"
          onChange={(value) => {
            // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
            onToNumberChange(toNumber + value, true);
          }}
          sounds={RcDialerPadSoundsMPEG}
          getDialPadButtonProps={(v) => ({
            'data-test-id': `${v}`,
            'data-sign': `dialPadBtn${v}`,
            variant: 'contained',
          })}
          volume={dialButtonVolume}
          muted={dialButtonMuted}
          autoSize
        />
      </DialerWrapper>
      <CallButtonWrapper>
        <CallButton
          data-sign="callButton"
          color="success.b03"
          symbol={Phone}
          variant="contained"
          elevation="0"
          activeElevation="0"
          onClick={() => onCallButtonClick({ clickDialerToCall: true })}
          disabled={callButtonDisabled}
          size="large"
          $dialerHeight={dialerHeight}
        />
      </CallButtonWrapper>
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
