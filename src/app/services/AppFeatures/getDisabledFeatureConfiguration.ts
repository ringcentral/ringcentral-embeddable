import type { EmbeddableFeatureConfiguration } from './AppFeatures.interface';

/**
 * The `disable*` URL parameters that turn off whole feature areas.
 */
export interface DisabledFeatureParams {
  readonly disableCall?: boolean;
  readonly disableCallHistory?: boolean;
  readonly disableContacts?: boolean;
  readonly disableMeeting?: boolean;
  readonly disableMessages?: boolean;
  readonly disableReadText?: boolean;
}

/**
 * Map the `disable*` URL parameters to feature flags, as the 3.x app did.
 * With no parameter set, every flag stays on, matching the upstream defaults.
 */
export function getDisabledFeatureConfiguration({
  disableCall = false,
  disableCallHistory = false,
  disableContacts = false,
  disableMeeting = false,
  disableMessages = false,
  disableReadText = false,
}: DisabledFeatureParams): EmbeddableFeatureConfiguration {
  const isTextDisabled = disableMessages || disableReadText;
  return {
    CallLog: !disableCall && !disableCallHistory,
    RingOut: !disableCall,
    Softphone: !disableCall,
    WebPhone: !disableCall,
    Fax: !disableMessages,
    Voicemail: !disableMessages,
    Pages: !isTextDisabled,
    SMS: !isTextDisabled,
    Meetings: !disableMeeting,
    Contacts: !disableContacts,
  };
}
