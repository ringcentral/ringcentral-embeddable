type PickFunctionKeys<T extends Record<string, any>> = Exclude<
  {
    [K in keyof T]: Required<T> extends Record<K, (...args: any) => any>
      ? K
      : never;
  }[keyof T],
  undefined
>;

export type OmitFunctions<T extends Record<string, any>> = Omit<
  T,
  PickFunctionKeys<T>
>;

export interface AudioSettingsPanelProps {
  availableInputDevices: OmitFunctions<MediaDeviceInfo>[];
  availableOutputDevices: OmitFunctions<MediaDeviceInfo>[];
  callVolume: number;
  checkUserMedia: () => void | Promise<void>;
  className?: string | null;
  // TODO: use useLocale when available
  currentLocale: string;
  dialButtonVolume: number;
  inputDeviceDisabled?: boolean;
  inputDeviceId: string;
  isWebRTC: boolean;
  onBackButtonClick: (...args: any) => unknown;
  onSave: (...args: any) => unknown;
  outputDeviceDisabled?: boolean;
  outputDeviceId: string;
  ringtoneVolume: number;
  showCallVolume?: boolean;
  showDialButtonVolume?: boolean;
  showRingToneVolume?: boolean;
  supportDevices: boolean;
  userMedia: boolean;
  noiseReductionEnabled: boolean;
  showNoiseReductionSetting: boolean;
  disableNoiseReductionSetting: boolean;
  onNoiseReductionChange: (...args: any) => unknown;
}
