import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import { callingOptions } from '@ringcentral-integration/commons/modules/CallingSettings';
import { format } from '@ringcentral-integration/utils';
import {
  styled,
  palette2,
  RcSelect,
  RcMenuItem,
  RcListItemText,
  RcTextField,
  RcSwitch,
} from '@ringcentral/juno';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';

import type {
  CallingSettingsPanelProps,
  CallingSettingsProps,
  CallWithProps,
  GetCallingOptionNameProps,
} from '@ringcentral-integration/widgets/components/CallingSettingsPanel/CallingSettingsPenal.interface';
import i18n from '@ringcentral-integration/widgets/components/CallingSettingsPanel/i18n';

import { BackHeaderView } from '../BackHeaderView';
import { SaveButton } from '../SaveButton';

const StyledSaveButton = styled(SaveButton)`
  margin-top: 20px;
`;

const StyledPanel = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 20px 16px;
  background-color: ${palette2('neutral', 'b01')};
  position: relative;

  .ringoutPromptSwitch {
    margin-top: 15px;
    margin-bottom: 15px;
    margin-left: 0;
  }
`;

const CallWithSelect = styled(RcSelect)`
  margin-bottom: 15px;
`;

const RingOutGrayText = styled.span`
  color: ${palette2('neutral', 'f04')};
`;

const HelpTextLine = styled.span`
  display: block;
`;

const MyLocationCustomInput = styled(RcTextField)`
  margin-top: 15px;
`;

const StyledSwitch = styled(RcSwitch)`
  padding: 15px 0;
`;

export function getCallingOptionName({
  callingOption,
  currentLocale,
  jupiterAppName,
  softphoneAppName,
}: GetCallingOptionNameProps) {
  if (callingOption === callingOptions.softphone) {
    return softphoneAppName;
  }
  if (callingOption === callingOptions.jupiter) {
    return jupiterAppName;
  }
  if (callingOption === callingOptions.ringout) {
    // Not to translate
    return 'RingOut';
  }
  return i18n.getString(callingOption, currentLocale);
}

const CallWithSettings: FunctionComponent<CallWithProps> = ({
  callWith,
  callWithOptions,
  currentLocale,
  disabled,
  onCallWithChange,
  jupiterAppName,
  softphoneAppName,
}) => {
  const keys = [`${callWith}Tooltip`];
  if (
    callWith !== callingOptions.browser &&
    callWith !== callingOptions.softphone &&
    callWith !== callingOptions.jupiter
  ) {
    keys.push(`${callWith}Tooltip1`);
  }
  const optionName = getCallingOptionName({
    callingOption: callWith,
    currentLocale,
    jupiterAppName,
    softphoneAppName,
  });

  return (
    <CallWithSelect
      variant="box"
      value={callWith}
      disabled={disabled}
      fullWidth
      label={i18n.getString('makeCallsWith', currentLocale)}
      onChange={(e) => {
        onCallWithChange(e.target.value as string);
      }}
      helperText={keys.map((key) => (
        <HelpTextLine key={key}>
          {format(i18n.getString(key, currentLocale), {
            brand: optionName,
          })}
        </HelpTextLine>
      ))}
    >
      {
        callWithOptions.map((option) => (
          <RcMenuItem
            key={option}
            value={option}
            data-sign={`callWith${option}`}
          >
            {getCallingOptionName({
              callingOption: option,
              currentLocale,
              jupiterAppName,
              softphoneAppName,
            })}
          </RcMenuItem>
        ))
      }
    </CallWithSelect>
  );
};

interface RingoutSettingsProps {
  currentLocale: string;
  callWith: string;
  availableNumbersWithLabel: { label: string; value: string }[];
  locationSearchable: boolean;
  myLocation: string;
  onMyLocationChange: (newMyLocation: string) => void;
  onMyLocationTextChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  ringoutPrompt: boolean;
  onRingoutPromptChange: (newRingoutPrompt: boolean) => void;
}

const RingOutMyLocationInput = ({
  currentLocale,
  availableNumbersWithLabel,
  myLocation,
  onMyLocationChange,
  disabled,
}) => {
  const [myLocationState, setMyLocationState] = useState('custom');
  if (!availableNumbersWithLabel) {
    return (
      <RcTextField
        variant="outline"
        fullWidth
        value={myLocation}
        label={i18n.getString('myLocationLabel', currentLocale)}
        data-sign="myLocation"
        inputProps={{
          maxLength: 30,
        }}
        onChange={(e) => {
          onMyLocationChange(e.target.value);
        }}
        helperText={i18n.getString('ringoutHint', currentLocale)}
      />
    )
  }
  return (
    <>
      <RcSelect
        fullWidth
        variant="box"
        value={myLocationState}
        disabled={disabled}
        label={i18n.getString('myLocationLabel', currentLocale)}
        data-sign="myLocation"
        onChange={(e) => {
          if (e.target.value === 'custom') {
            setMyLocationState('custom');
          } else {
            onMyLocationChange(e.target.value as string);
            setMyLocationState(e.target.value as string);
          }
        }}
        renderValue={(value) => {
          if (value === 'custom') {
            return "Custom number";
          }
          const item = availableNumbersWithLabel.find((item) => item.value === value);
          return (
            <RcListItemText
              primary={
                <>
                  {item.label}: <RingOutGrayText>{item.value}</RingOutGrayText>
                </>
              }
            />
          );
        }}
        helperText={i18n.getString('ringoutHint', currentLocale)}
      >
        <RcMenuItem
          value="custom"
          data-sign="myLocationCustom"
        >
          <RcListItemText
            primary="Custom number"
            secondary={myLocation}
          />
        </RcMenuItem>
        {availableNumbersWithLabel.map((item) => (
          <RcMenuItem
            key={item.value}
            value={item.value}
            data-sign={`myLocation${item.value}`}
          >
            <RcListItemText
              primary={item.label}
              secondary={item.value}
            />
          </RcMenuItem>
        ))}
      </RcSelect>
      {
        myLocationState === 'custom' ? (
          <MyLocationCustomInput
            variant="outline"
            fullWidth
            value={myLocation}
            label="Number"
            data-sign="customerLocation"
            inputProps={{
              maxLength: 30,
            }}
            onChange={(e) => {
              onMyLocationChange(e.target.value);
            }}
          />
        ) : null
      }
    </>
  );
}
const RingoutSettings: FunctionComponent<RingoutSettingsProps> = ({
  currentLocale,
  callWith,
  availableNumbersWithLabel,
  myLocation,
  onMyLocationChange,
  disabled,
  ringoutPrompt,
  onRingoutPromptChange,
}) => {
  if (
    callWith !== callingOptions.softphone &&
    callWith !== callingOptions.browser &&
    callWith !== callingOptions.jupiter
  ) {
    return (
      <div>
        <RingOutMyLocationInput
          currentLocale={currentLocale}
          availableNumbersWithLabel={availableNumbersWithLabel}
          myLocation={myLocation}
          onMyLocationChange={onMyLocationChange}
          disabled={disabled}
        />
        <RcSwitch
          data-sign="ringoutPromptToggle"
          checked={ringoutPrompt}
          onChange={(_, checked) => {
            onRingoutPromptChange(checked);
          }}
          label={i18n.getString('press1ToStartCallLabel', currentLocale)}
          formControlLabelProps={{
            labelPlacement: 'start',
            className: 'ringoutPromptSwitch',
          }}
        />
      </div>
    );
  }
  return null;
};

const CallingSettings: FunctionComponent<CallingSettingsProps> = ({
  availableNumbersWithLabel,
  callWith,
  callWithOptions,
  currentLocale,
  defaultRingoutPrompt = true,
  disabled = false,
  locationSearchable = false,
  myLocation,
  onSave,
  ringoutPrompt,
  incomingAudio,
  incomingAudioFile,
  outgoingAudio,
  outgoingAudioFile,
  jupiterAppName,
  softphoneAppName,
}) => {
  const [callWithState, setCallWithState] = useState(callWith);
  const [ringoutPromptState, setRingoutPromptState] = useState(ringoutPrompt);
  const [myLocationState, setMyLocationState] = useState(myLocation);
  const [incomingAudioState, setIncomingAudioState] = useState(incomingAudio);
  const [incomingAudioFileState, setIncomingAudioFileState] =
    useState(incomingAudioFile);
  const [outgoingAudioState, setOutgoingAudioState] = useState(outgoingAudio);
  const [outgoingAudioFileState, setOutgoingAudioFileState] =
    useState(outgoingAudioFile);

  useEffect(() => {
    setCallWithState(callWith);
    setMyLocationState(myLocation);
    setRingoutPromptState(ringoutPrompt);
    setIncomingAudioState(incomingAudio);
    setIncomingAudioFileState(incomingAudioFile);
    setOutgoingAudioState(outgoingAudio);
    setOutgoingAudioFileState(outgoingAudioFile);
  }, [
    callWith,
    myLocation,
    ringoutPrompt,
    incomingAudio,
    incomingAudioFile,
    outgoingAudio,
    outgoingAudioFile,
  ]);
  return (
    <>
      <CallWithSettings
        callWith={callWithState}
        jupiterAppName={jupiterAppName}
        softphoneAppName={softphoneAppName}
        callWithOptions={callWithOptions}
        currentLocale={currentLocale}
        disabled={disabled}
        onCallWithChange={(newCallWith: string) => {
          setCallWithState(newCallWith);
          if (newCallWith === callWith) {
            setMyLocationState(myLocation);
            setRingoutPromptState(ringoutPrompt);
          } else {
            setMyLocationState(availableNumbersWithLabel?.[0]?.value || '');
            setRingoutPromptState(defaultRingoutPrompt);
          }
        }}
      />
      <RingoutSettings
        {...{
          currentLocale,
          callWith: callWithState,
          availableNumbersWithLabel,
          locationSearchable,
          myLocation: myLocationState,
          onMyLocationChange: setMyLocationState,
          onMyLocationTextChange: ({ target: { value } }) => {
            setMyLocationState(value);
          },
          ringoutPrompt: ringoutPromptState,
          onRingoutPromptChange: setRingoutPromptState,
          disabled,
        }}
      />
      <StyledSaveButton
        currentLocale={currentLocale}
        onClick={() => {
          onSave({
            callWith: callWithState,
            myLocation: myLocationState,
            ringoutPrompt: ringoutPromptState,
            isCustomLocation: !availableNumbersWithLabel.find(
              (item) => item.value === myLocationState,
            ),
            incomingAudio: incomingAudioState,
            incomingAudioFile: incomingAudioFileState,
            outgoingAudio: outgoingAudioState,
            outgoingAudioFile: outgoingAudioFileState,
          });
        }}
        disabled={
          (callWithState === callWith &&
            myLocationState === myLocation &&
            ringoutPromptState === ringoutPrompt &&
            incomingAudioState === incomingAudio &&
            incomingAudioFileState === incomingAudioFile &&
            outgoingAudioState === outgoingAudio &&
            outgoingAudioFileState === outgoingAudioFile) ||
          (callWithState === callingOptions.ringout && !myLocationState)
        }
      />
    </>
  );
};

export const CallingSettingsPanel: FunctionComponent<CallingSettingsPanelProps> =
  ({
    className,
    onBackButtonClick,
    currentLocale,
    showSpinner = false,
    ...props
  }) => {
    const content = showSpinner ? (
      <SpinnerOverlay />
    ) : (
      <>
        <CallingSettings {...{ ...props, currentLocale }} />
      </>
    );
    return (
      <BackHeaderView
        dataSign="callingSettings"
        onBack={onBackButtonClick}
        title={i18n.getString('title', currentLocale)}
      >
        <StyledPanel>{content}</StyledPanel>
      </BackHeaderView>
    );
  };
