import type {
  FeatureConfiguration as BaseFeatureConfiguration,
} from '@ringcentral-integration/micro-auth/src/app/services';

export interface EmbeddableFeatureConfiguration
  extends BaseFeatureConfiguration {
  AudioInitPrompt?: boolean;
  CallRecording?: boolean;
  LoadMoreCalls?: boolean;
  NoiseReduction?: boolean;
  RingtoneSettings?: boolean;
  SharedMessages?: boolean;
  SignUpButton?: boolean;
  SMSTemplate?: boolean;
  VoicemailDrop?: boolean;
}