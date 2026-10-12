import type { LoginTypes } from '../../enums';

/**
 * Form group state for session configuration
 */
export interface FormGroup {
  selectedInboundQueueIds?: string[];
  loginType?: LoginTypes;
  selectedSkillProfileId?: string;
  extensionNumber?: string;
  autoAnswer?: boolean;
  dialGroupId?: string;
}

/**
 * Login type item for dropdown
 */
export interface LoginTypeItem {
  id: LoginTypes;
  label: string;
}

/**
 * Configure agent options for EV server
 */
export interface CxConfigureAgentOptions {
  dialDest: string;
  queueIds: string[];
  skillProfileId: string;
  dialGroupId?: string;
  isForce?: boolean;
  loginType?: string;
}

/**
 * Configure agent parameters
 */
export interface ConfigureAgentParams {
  config?: CxConfigureAgentOptions;
  triggerEvent?: boolean;
  needAssignFormGroupValue?: boolean;
}

/**
 * Dial group item
 */
export interface DialGroup {
  groupId: string;
  groupName: string;
  dialMode: string;
  groupDesc?: string;
  /** A `PREVIEW` group with "Enable progressive mode" checked. */
  progressiveEnabled: boolean;
  /** Seconds to wait before each automatic dial in progressive mode. */
  progressiveCallDelay: number;
}
