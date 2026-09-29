import type { LoginTypes } from '../../enums';
import type { CxAgent } from '../../services/CxClient/interfaces';

/**
 * CxSessionConfigView options for configuration
 */
export interface CxSessionConfigViewOptions {
  /** Custom callback for account re-selection */
  onAccountReChoose?: () => void | Promise<void>;
  /** Whether to show the switch account button */
  showReChooseAccount?: boolean;
}

/**
 * CxSessionConfigView UI props passed to the component
 */
export interface CxSessionConfigViewUIProps {
  /** Currently selected agent information */
  selectedAgent: CxAgent | null;
  /** Whether the switch account button should be shown */
  showReChooseAccount: boolean;
  /** Whether the form is in loading state */
  isLoading: boolean;
  /** Current locale for i18n */
  currentLocale: string;
  /** Whether inbound queues section should be shown */
  showInboundQueues: boolean;
  /** Whether skill profile section should be shown */
  showSkillProfile: boolean;
  /** Whether auto answer toggle should be shown */
  showAutoAnswer: boolean;
  /** Whether dial group section should be shown */
  showDialGroup: boolean;
}

/**
 * CxSessionConfigView UI functions passed to the component
 */
export interface CxSessionConfigViewUIFunctions {
  /** Callback when user wants to switch account */
  onAccountReChoose: () => void | Promise<void>;
  /** Callback when user leaves the setup flow from the page header */
  cancelAgentSetup: () => void;
  /** Callback when user clicks continue to configure session */
  setConfigure: () => Promise<void>;
  /** Callback when login type changes */
  setLoginType: (type: LoginTypes) => void;
  /** Callback when skill profile changes */
  setSkillProfileId: (profileId: string) => void;
  /** Callback when extension number changes */
  setExtensionNumber: (number: string) => void;
  /** Callback when auto answer setting changes */
  setAutoAnswer: (enabled: boolean) => void;
  /** Callback when dial group changes */
  setDialGroupId: (groupId: string) => void;
  /** Callback when inbound queue selection changes */
  setInboundQueueIds: (ids: string[]) => void;
}

/**
 * CxSessionConfigView props
 */
export interface CxSessionConfigViewProps {
  // Component props
}
