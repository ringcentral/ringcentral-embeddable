import { usePrevious } from '@ringcentral/juno';
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  styled,
  RcSelect,
  RcMenuItem,
  RcListItemText,
  RcTypography,
} from '@ringcentral/juno';
import { Button } from '@ringcentral-integration/widgets/components/Button';
import IconLine from '@ringcentral-integration/widgets/components/IconLine';
import SaveButton from '@ringcentral-integration/widgets/components/SaveButton';
import i18n from '@ringcentral-integration/widgets/components/AudioSettingsPanel/i18n';

import { BackHeaderView } from '../BackHeaderView';
import { VolumeSlider } from './VolumeSlider';
import { AudioSettingsPanelProps, OmitFunctions } from './AudioSettingsPanel.interface';

const Panel = styled.div`
  padding: 10px 16px;
  flex: 1;
  overflow-y: auto;
`;

const CheckMicPermission: FC<
  Pick<
    AudioSettingsPanelProps,
    'checkUserMedia' | 'userMedia' | 'currentLocale'
  >
> = ({ checkUserMedia, userMedia, currentLocale }) => {
  if (userMedia) {
    return null;
  }
  return (
    <IconLine
      noBorder
      icon={
        <Button dataSign="checkMicPermission" onClick={checkUserMedia}>
          {i18n.getString('checkMicPermission', currentLocale)}
        </Button>
      }
    >
      {i18n.getString('micNoPermissionMessage', currentLocale)}
    </IconLine>
  );
};

export const getFallbackLabel = (
  devices: OmitFunctions<MediaDeviceInfo>[],
  index: number,
  currentLocale: string,
) => {
  let fallbackLabel = i18n.getString('noLabel', currentLocale);
  if (devices.length > 1) {
    fallbackLabel = `${fallbackLabel} ${index + 1}`;
  }
  return fallbackLabel;
};

export const getDeviceValueRenderer =
  (devices: OmitFunctions<MediaDeviceInfo>[], currentLocale: string) =>
  (value: string | null) => {
    if (value === null) {
      return i18n.getString('noDevice', currentLocale);
    }
    const index = devices.findIndex((device) => device.deviceId === value);
    if (index > -1 && devices[index].label) {
      return devices[index].label;
    }
    return getFallbackLabel(devices, index, currentLocale);
  };

export const getDeviceOptionRenderer =
  (devices: OmitFunctions<MediaDeviceInfo>[], currentLocale: string) =>
  (device: OmitFunctions<MediaDeviceInfo>, index: number) => {
    if (device && device.label) {
      return device.label;
    }
    return getFallbackLabel(devices, index, currentLocale);
  };

const useDeviceRenderers = (
  devices: OmitFunctions<MediaDeviceInfo>[],
  currentLocale: string,
) => {
  return useMemo(
    () =>
      [
        getDeviceValueRenderer(devices, currentLocale),
        getDeviceOptionRenderer(devices, currentLocale),
      ] as const,
    [devices, currentLocale],
  );
};

const OutputDevice: FC<
  Pick<
    AudioSettingsPanelProps,
    | 'availableOutputDevices'
    | 'currentLocale'
    | 'outputDeviceDisabled'
    | 'outputDeviceId'
  > & {
    isFirefox: boolean;
    onChange: (device: OmitFunctions<MediaDeviceInfo>) => void;
  }
> = ({
  availableOutputDevices,
  currentLocale,
  isFirefox,
  onChange,
  outputDeviceDisabled,
  outputDeviceId,
}) => {
  const [deviceValueRenderer, deviceOptionRenderer] = useDeviceRenderers(
    availableOutputDevices,
    currentLocale,
  );
  if (isFirefox && !availableOutputDevices.length) {
    return (
      <RcSelect
        variant="box"
        value="default"
        label={i18n.getString('outputDevice', currentLocale)}
        fullWidth
      >
        <RcMenuItem value="default">
          <RcListItemText
            primary={i18n.getString('defaultOutputDevice', currentLocale)}
          />
        </RcMenuItem>
      </RcSelect>
    );
  }
  return (
    <RcSelect
      variant="box"
      value={availableOutputDevices.length ? outputDeviceId : undefined}
      onChange={(e) => {
        const deviceId = e.target.value;
        const device = availableOutputDevices.find(
          (d) => d.deviceId === deviceId,
        );
        if (device) {
          onChange(device);
        }
      }}
      disabled={outputDeviceDisabled}
      label={i18n.getString('outputDevice', currentLocale)}
      fullWidth
    >
      {
        availableOutputDevices.map((device, index) => (
          <RcMenuItem key={device.deviceId} value={device.deviceId}>
            <RcListItemText
              primary={deviceOptionRenderer(device, index)}
            />
          </RcMenuItem>
        ))
      }
    </RcSelect>
  );
};

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

function Section({
  label,
  children,
  dataSign
}) {
  return (
    <SectionContainer data-sign={dataSign}>

    </SectionContainer>
  )
}

const InputDevice: FC<
  Pick<
    AudioSettingsPanelProps,
    | 'availableInputDevices'
    | 'inputDeviceId'
    | 'inputDeviceDisabled'
    | 'currentLocale'
  > & {
    onChange: (device: OmitFunctions<MediaDeviceInfo>) => void;
    isFirefox: boolean;
  }
> = ({
  availableInputDevices,
  currentLocale,
  inputDeviceDisabled,
  inputDeviceId,
  isFirefox,
  onChange,
}) => {
  const [deviceValueRenderer, deviceOptionRenderer] = useDeviceRenderers(
    availableInputDevices,
    currentLocale,
  );

  const showTooltip =
    availableInputDevices.length > 0
      ? availableInputDevices[0].label === ''
      : isFirefox;

  return (
    <RcSelect
      variant="box"
      value={availableInputDevices.length ? inputDeviceId : undefined}
      onChange={(e) => {
        const deviceId = e.target.value;
        const device = availableInputDevices.find(
          (d) => d.deviceId === deviceId,
        );
        if (device) {
          onChange(device);
        }
      }}
      disabled={inputDeviceDisabled}
      label={i18n.getString('inputDevice', currentLocale)}
      fullWidth
      helperText={showTooltip ? i18n.getString('noLabelTip', currentLocale) : ''}
    >
      {
        availableInputDevices.map((device, index) => (
          <RcMenuItem key={device.deviceId} value={device.deviceId}>
            <RcListItemText
              primary={deviceOptionRenderer(device, index)}
            />
          </RcMenuItem>
        ))
      }
    </RcSelect>
  );
};

function useDeviceIdState(
  deviceId: string,
  devices: OmitFunctions<MediaDeviceInfo>[],
) {
  const [deviceIdState, setDeviceIdState] = useState(deviceId);
  const setDeviceState = useCallback(
    (device: OmitFunctions<MediaDeviceInfo>) => {
      setDeviceIdState(device.deviceId);
    },
    [setDeviceIdState],
  );
  const oldDeviceId = usePrevious(() => deviceId, true);
  const oldDevices = usePrevious(() => devices, true);
  useEffect(() => {
    if (deviceId !== oldDeviceId) {
      setDeviceIdState(deviceId);
    }
    if (devices !== oldDevices) {
      if (!devices.find((device) => device.deviceId === deviceIdState)) {
        setDeviceIdState(deviceId);
      }
    }
  }, [oldDeviceId, oldDevices, devices, deviceIdState, deviceId]);

  return [deviceIdState, setDeviceState] as const;
}

const VolumeInput: FC<{
  volume: number;
  minVolume?: number;
  maxVolume?: number;
  onChange: (volume: number) => void;
  label: string;
}> = ({ volume, minVolume, maxVolume, onChange, label }) => {
  return (
    <VolumeSlider
      volume={volume}
      onChange={onChange}
      maxVolume={maxVolume}
      minVolume={minVolume}
      label={label}
    />
  );
};

export const AudioSettingsPanel: FC<AudioSettingsPanelProps> = ({
  availableInputDevices,
  availableOutputDevices,
  callVolume,
  checkUserMedia,
  className = null,
  currentLocale,
  dialButtonVolume,
  inputDeviceDisabled = false,
  inputDeviceId,
  onBackButtonClick,
  onSave,
  outputDeviceDisabled = false,
  outputDeviceId,
  ringtoneVolume,
  showCallVolume = false,
  showDialButtonVolume = false,
  showRingToneVolume = false,
  supportDevices,
  userMedia,
}) => {
  // For firefox, when input device have empty label
  // trigger get-user-media to load the device info at the first time
  const triggerCheckUserMedia = useRef<boolean>(false);
  if (!triggerCheckUserMedia.current) {
    triggerCheckUserMedia.current = true;
    if (userMedia && availableInputDevices[0]?.label === '') {
      checkUserMedia();
    }
  }
  const [outputDeviceIdState, setOutputDeviceState] = useDeviceIdState(
    outputDeviceId,
    availableOutputDevices,
  );
  const [inputDeviceIdState, setInputDeviceState] = useDeviceIdState(
    inputDeviceId,
    availableInputDevices,
  );
  const [isFirefox] = useState<boolean>(
    navigator.userAgent.indexOf('Firefox') > -1,
  );

  const [dialButtonVolumeState, setDialButtonVolumeState] =
    useState(dialButtonVolume);
  const [ringtoneVolumeState, setRingtoneVolumeState] =
    useState(ringtoneVolume);
  const [callVolumeState, setCallVolumeState] = useState(callVolume);

  const oldDialButtonVolume = usePrevious(() => dialButtonVolume, true);
  const oldRingtoneVolume = usePrevious(() => ringtoneVolume, true);
  const oldCallVolume = usePrevious(() => callVolume, true);

  useEffect(() => {
    if (dialButtonVolume !== oldDialButtonVolume) {
      setDialButtonVolumeState(dialButtonVolume);
    }
    if (ringtoneVolume !== oldRingtoneVolume) {
      setRingtoneVolumeState(ringtoneVolume);
    }
    if (callVolume !== oldCallVolume) {
      setCallVolumeState(callVolume);
    }
  }, [
    dialButtonVolume,
    ringtoneVolume,
    callVolume,
    oldDialButtonVolume,
    oldRingtoneVolume,
    oldCallVolume,
  ]);

  const hasChanges =
    outputDeviceId !== outputDeviceIdState ||
    inputDeviceId !== inputDeviceIdState ||
    dialButtonVolume !== dialButtonVolumeState ||
    ringtoneVolume !== ringtoneVolumeState ||
    callVolume !== callVolumeState;

  const onSaveClick = useCallback(
    () =>
      onSave({
        outputDeviceId: outputDeviceIdState,
        inputDeviceId: inputDeviceIdState,
        dialButtonVolume: dialButtonVolumeState,
        ringtoneVolume: ringtoneVolumeState,
        callVolume: callVolumeState,
      }),
    [
      onSave,
      outputDeviceIdState,
      inputDeviceIdState,
      dialButtonVolumeState,
      ringtoneVolumeState,
      callVolumeState,
    ],
  );

  return (
    <BackHeaderView
      className={className}
      onBack={onBackButtonClick}
      title={i18n.getString('title', currentLocale)}
    >
      <Panel>
        {supportDevices ? (
          <>
            <OutputDevice
              availableOutputDevices={availableOutputDevices}
              currentLocale={currentLocale}
              isFirefox={isFirefox}
              outputDeviceDisabled={outputDeviceDisabled}
              outputDeviceId={outputDeviceIdState}
              onChange={setOutputDeviceState}
            />
            <InputDevice
              availableInputDevices={availableInputDevices}
              currentLocale={currentLocale}
              isFirefox={isFirefox}
              inputDeviceDisabled={inputDeviceDisabled}
              inputDeviceId={inputDeviceIdState}
              onChange={setInputDeviceState}
            />
          </>
        ) : null}
        <CheckMicPermission
          checkUserMedia={checkUserMedia}
          currentLocale={currentLocale}
          userMedia={userMedia}
        />
        {showCallVolume ? (
          <VolumeInput
            volume={callVolumeState}
            label={i18n.getString('callVolume', currentLocale)}
            onChange={setCallVolumeState}
            minVolume={0.1}
          />
        ) : null}
        {showRingToneVolume ? (
          <VolumeInput
            volume={ringtoneVolumeState}
            label={i18n.getString('ringtoneVolume', currentLocale)}
            onChange={setRingtoneVolumeState}
          />
        ) : null}
        {showDialButtonVolume ? (
          <VolumeInput
            volume={dialButtonVolumeState}
            label={i18n.getString('dialButtonVolume', currentLocale)}
            onChange={setDialButtonVolumeState}
          />
        ) : null}
        <SaveButton
          onClick={onSaveClick}
          disabled={!hasChanges}
          currentLocale={currentLocale}
        />
      </Panel>
    </BackHeaderView>
  );
};
