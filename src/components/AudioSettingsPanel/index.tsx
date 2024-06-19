import React, { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  styled,
  RcSelect,
  RcMenuItem,
  RcListItemText,
  RcTypography,
  RcCard,
  RcCardContent,
  RcCardActions,
  RcButton,
  RcSwitch,
} from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/AudioSettingsPanel/i18n';

import { BackHeaderView } from '../BackHeaderView';
import { VolumeSlider } from './VolumeSlider';
import type { AudioSettingsPanelProps, OmitFunctions } from './AudioSettingsPanel.interface';

const Panel = styled.div`
  padding: 10px 16px;
  flex: 1;
  overflow-y: auto;
`;
const StyledCard = styled(RcCard)`
  margin-bottom: 16px;
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
    <StyledCard>
      <RcCardContent>
        <RcTypography variant="body1" color="neutral.f05">
          {i18n.getString('micNoPermissionMessage', currentLocale)}
        </RcTypography>
      </RcCardContent>
      <RcCardActions>
        <RcButton data-sign="checkMicPermission" onClick={checkUserMedia}>
          {i18n.getString('checkMicPermission', currentLocale)}
        </RcButton>
      </RcCardActions>
    </StyledCard>
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

const StyledSelect = styled(RcSelect)`
  margin-bottom: 16px;
`;

const OutputDevice: FC<
  Pick<
    AudioSettingsPanelProps,
    | 'availableOutputDevices'
    | 'currentLocale'
    | 'outputDeviceDisabled'
    | 'outputDeviceId'
  > & {
    isFirefox: boolean;
    onChange: (deviceId: string) => void;
    label: string;
  }
> = ({
  availableOutputDevices,
  currentLocale,
  isFirefox,
  onChange,
  outputDeviceDisabled,
  outputDeviceId,
  label,
}) => {
  const [deviceValueRenderer, deviceOptionRenderer] = useDeviceRenderers(
    availableOutputDevices,
    currentLocale,
  );
  if (isFirefox && !availableOutputDevices.length) {
    return (
      <StyledSelect
        variant="box"
        value="default"
        label={label}
        fullWidth
      >
        <RcMenuItem value="default">
          <RcListItemText
            primary={i18n.getString('defaultOutputDevice', currentLocale)}
          />
        </RcMenuItem>
      </StyledSelect>
    );
  }
  return (
    <StyledSelect
      variant="box"
      value={availableOutputDevices.length ? outputDeviceId : undefined}
      onChange={(e) => {
        const deviceId = e.target.value;
        onChange(deviceId as string);
      }}
      disabled={outputDeviceDisabled}
      label={label}
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
    </StyledSelect>
  );
};

const InputDevice: FC<
  Pick<
    AudioSettingsPanelProps,
    | 'availableInputDevices'
    | 'inputDeviceId'
    | 'inputDeviceDisabled'
    | 'currentLocale'
  > & {
    onChange: (deviceId: string) => void;
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
    <StyledSelect
      variant="box"
      value={availableInputDevices.length ? inputDeviceId : undefined}
      onChange={(e) => {
        const deviceId = e.target.value;
        onChange(deviceId as string);
      }}
      disabled={inputDeviceDisabled}
      label="Input device"
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
    </StyledSelect>
  );
};

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

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
`;

const SectionTitle = styled(RcTypography)`
  margin-bottom: 10px;
  font-size: 0.875rem;
  margin-bottom: 4px;
`;

const StyledCardContent = styled(RcCardContent)`
  padding: 12px;
`;

function Section({
  label,
  children,
  dataSign
}) {
  return (
    <SectionContainer data-sign={dataSign}>
      <SectionTitle variant="body1" color="neutral.f04">{label}</SectionTitle>
      <RcCard>
        <StyledCardContent>
          {children}
        </StyledCardContent>
      </RcCard>
    </SectionContainer>
  )
}

const StyledLinkItemWrapper = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
`;

const StyledLinkItemLabel = styled(RcTypography)`
  flex: 1;
`;

function LinkItem({
  onClick,
  label,
  linkLabel,
}) {
  return (
    <StyledLinkItemWrapper>
      <StyledLinkItemLabel color="neutral.f05">{label}</StyledLinkItemLabel>
      <RcButton
        variant="plain"
        onClick={onClick}
      >
        {linkLabel}
      </RcButton>
    </StyledLinkItemWrapper>
  );
}

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
  noiseReductionEnabled,
  showNoiseReductionSetting,
  onNoiseReductionChange,
  disableNoiseReductionSetting,
  ringtoneDeviceId,
  onRingtoneDeviceIdChange,
  showRingtoneAudioSetting,
  gotoRingtoneSettings,
}) => {
  // For firefox, when input device have empty label
  // trigger get-user-media to load the device info at the first time
  useEffect(() => {
    checkUserMedia();
  }, []);

  const [isFirefox] = useState<boolean>(
    navigator.userAgent.indexOf('Firefox') > -1,
  );

  return (
    <BackHeaderView
      className={className}
      onBack={onBackButtonClick}
      title={i18n.getString('title', currentLocale)}
    >
      <Panel>
        <CheckMicPermission
          checkUserMedia={checkUserMedia}
          currentLocale={currentLocale}
          userMedia={userMedia}
        />
        <Section
          label="Input"
          dataSign="inputDeviceSection"
        >
          {supportDevices ? (
            <InputDevice
              availableInputDevices={availableInputDevices}
              currentLocale={currentLocale}
              isFirefox={isFirefox}
              inputDeviceDisabled={inputDeviceDisabled}
              inputDeviceId={inputDeviceId}
              onChange={(deviceId) => {
                onSave({
                  inputDeviceId: deviceId,
                });
              }}
            />
          ) : null}
          {
            showNoiseReductionSetting ? (
              <RcSwitch
                formControlLabelProps={{
                  labelPlacement: 'start',
                  style: {
                    marginLeft: 0,
                    marginTop: '-10px',
                  },
                }}
                label="Enable noise reduction (Beta)"
                checked={noiseReductionEnabled}
                onChange={(_, checked) => {
                  onNoiseReductionChange(checked);
                }}
                disabled={disableNoiseReductionSetting}
              />
            ) : null
          }
        </Section>
        <Section
          label="Output"
          dataSign="outputDeviceSection"
        >
          {supportDevices ? (
            <OutputDevice
              availableOutputDevices={availableOutputDevices}
              currentLocale={currentLocale}
              isFirefox={isFirefox}
              outputDeviceDisabled={outputDeviceDisabled}
              outputDeviceId={outputDeviceId}
              onChange={(deviceId) => {
                onSave({
                  outputDeviceId: deviceId,
                });
              }}
              label="Output device"
            />
          ) : null}
          {showCallVolume ? (
            <VolumeInput
              volume={callVolume}
              label="Call volume"
              onChange={(volume) => {
                onSave({
                  callVolume: volume,
                });
              }}
              minVolume={0.1}
            />
          ) : null}
          {supportDevices ? (
            <OutputDevice
              availableOutputDevices={availableOutputDevices}
              currentLocale={currentLocale}
              isFirefox={isFirefox}
              outputDeviceDisabled={outputDeviceDisabled}
              outputDeviceId={ringtoneDeviceId}
              onChange={onRingtoneDeviceIdChange}
              label="Ringtone device"
            />
          ) : null}
          {showRingToneVolume ? (
            <VolumeInput
              volume={ringtoneVolume}
              label="Ringtone volume"
              onChange={(volume) => {
                onSave({
                  ringtoneVolume: volume,
                });
              }}
            />
          ) : null}
          {
            showRingtoneAudioSetting ? (
              <LinkItem
                onClick={gotoRingtoneSettings}
                label="Ringtone audio"
                linkLabel="Manage"
              />
            ) : null
          }
          {showDialButtonVolume ? (
            <VolumeInput
              volume={dialButtonVolume}
              label="Dial button volume"
              onChange={(volume) => {
                onSave({
                  dialButtonVolume: volume,
                });
              }}
            />
          ) : null}
        </Section>
      </Panel>
    </BackHeaderView>
  );
};
