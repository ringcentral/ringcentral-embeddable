import type { FunctionComponent } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import type { ToNumber as Recipient } from '@ringcentral-integration/commons/modules/ComposeText';
import {
  flexCenterStyle,
  RcDialerPadSoundsMPEG,
  RcDialPad,
  RcIconButton,
  RcResponsive,
  styled,
  palette2,
  spacing,
  setOpacity,
  css,
  useResponsiveMatch,
} from '@ringcentral/juno';
import { Phone } from '@ringcentral/juno-icon';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import FromField from './FromField';
import { StyledRecipientsInput } from './StyledRecipientsInput';

const Container = styled.div<{
  $bigFont: boolean;
  $mediumFont: boolean;
}>`
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

  ${({ $mediumFont }) => $mediumFont && css`
    .RecipientsInput_numberInput {
      font-size: 1.25rem;

      &::placeholder {
        font-size: 1rem;
      }
    }

    .RecipientsInput_selectReceivers li {
      font-size: 0.875rem;
    }

    .RcWidgetCallButton {
      width: 56px;
      height: 56px;
      font-size: 28px;
    }
  `}

  ${({ $bigFont }) => $bigFont && css`
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

    .RcWidgetCallButton {
      width: 72px;
      height: 72px;
      font-size: 36px;
    }
  `}
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

const StyledDialpad = styled(RcDialPad)<{
  $xs: boolean;
  $sm: boolean;
}>`
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

  ${({ $sm }) => $sm && css`
    .RcIconButton-contained {
      margin-bottom: ${spacing(2)};
    }
  `}

  ${({ $xs }) => $xs && css`
    .RcIconButton-contained {
      margin-bottom: ${spacing(1)};
    }
  `}
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
`;

function ResponsiveContainer({ children, innerRef }) {
  const { gtXS, gtSM } = useResponsiveMatch();
  return (
    <Container $bigFont={gtSM} $mediumFont={gtXS} ref={innerRef}>
      {children}
    </Container>
  );
}

function ResponsiveDialpad({
  onToNumberChange,
  toNumber,
  dialButtonVolume,
  dialButtonMuted,
  onEnableAudio,
}) {
  const { ltSM, ltMD } = useResponsiveMatch();
  return (
    <StyledDialpad
      data-sign="dialPad"
      onChange={(value) => {
        onToNumberChange(toNumber + value, true);
        if (dialButtonVolume > 0 && !dialButtonMuted) {
          onEnableAudio(); // enable audio once audio played
        }
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
      $xs={ltSM}
      $sm={ltMD}
    />
  );
}

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
  formatContactPhone?: (...args: any[]) => any;
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
  onEnableAudio?: (...args: any[]) => any;
  onEnterKeyPress?: (...args: any[]) => any;
}

const Empty: FunctionComponent = () => null;

const DialerPanel: FunctionComponent<DialerPanelProps> = ({
  currentLocale,
  callButtonDisabled = false,
  // className,
  // dialButtonsClassName,
  onToNumberChange = Empty,
  onCallButtonClick,
  toNumber = '',
  fromNumber = '',
  fromNumbers = [],
  changeFromNumber = Empty,
  formatPhone = (phoneNumber) => phoneNumber,
  formatContactPhone,
  isWebphoneMode = false,
  showSpinner = false,
  dialButtonVolume = 1,
  dialButtonMuted = false,
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
  autoFocus = false,
  showFromField = true,
  disableFromField = false,
  children,
  withTabs = false,
  // inConference = false,
  isLastInputFromDialpad = false,
  showAnonymous = true,
  useV2 = false,
  getPresence,
  onEnableAudio = Empty,
  onEnterKeyPress = Empty,
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
      if (e.key === 'Enter' && containerEl.current) {
        onEnterKeyPress(e);
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
      formatContactPhone={formatContactPhone || formatPhone}
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
    <RcResponsive
      responsiveTarget={containerEl}
      breakpointMap={{
        lg: 1280,
        md: 400,
        sm: 350,
        xl: 1920,
        xs: 0,
      }}
    >
      <ResponsiveContainer innerRef={containerEl}>
        {showFromField ? (
          <FromField
            showAnonymous={showAnonymous}
            fromNumber={fromNumber}
            fromNumbers={fromNumbers}
            onChange={changeFromNumber}
            formatPhone={formatPhone}
            currentLocale={currentLocale}
            hidden={!isWebphoneMode}
            disabled={disableFromField}
          />
        ) : null}
        {input}
        <DialerWrapper $dialerHeight={dialerHeight}>
          <ResponsiveDialpad
            onToNumberChange={onToNumberChange}
            toNumber={toNumber}
            data-sign="dialPad"
            dialButtonVolume={dialButtonVolume}
            dialButtonMuted={dialButtonMuted}
            onEnableAudio={onEnableAudio}
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
            className="RcWidgetCallButton"
          />
        </CallButtonWrapper>
        {showSpinner ? <SpinnerOverlay /> : null}
        {children}
      </ResponsiveContainer>
    </RcResponsive>
  );
};

export default DialerPanel;
