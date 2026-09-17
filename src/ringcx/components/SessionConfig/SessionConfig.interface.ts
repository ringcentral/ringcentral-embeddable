import type { LoginTypes } from '../../enums';

/**
 * Skill profile item interface
 */
export interface SkillProfile {
  profileId: string;
  profileName: string;
}

/**
 * Inbound queue item interface
 */
export interface InboundQueue {
  gateId: string;
  gateName: string;
  checked?: boolean;
}

/**
 * Dial group item interface
 */
export interface DialGroup {
  groupId: string;
  groupName: string;
  groupDesc?: string;
}

/**
 * Login type option interface
 */
export interface LoginTypeOption {
  id: string;
  label: string;
}

/**
 * Session config form data
 */
export interface SessionConfigFormData {
  selectedSkillProfileId?: string;
  selectedInboundQueueIds?: string[];
  dialGroupId?: string;
  autoAnswer?: boolean;
  loginType?: LoginTypes;
  extensionNumber?: string;
}

/**
 * SessionConfig component props
 */
export interface SessionConfigProps {
  /** List of skill profiles */
  skillProfileList?: SkillProfile[];
  /** Currently selected skill profile ID */
  selectedSkillProfileId?: string;
  /** Callback when skill profile changes */
  onSkillProfileChange?: (profileId: string) => void;
  /** Whether to show skill profile selector */
  showSkillProfile?: boolean;
  /** List of inbound queues */
  inboundQueues?: InboundQueue[];
  /** Currently selected inbound queue IDs */
  selectedInboundQueueIds?: string[];
  /** Callback when inbound queues change */
  onInboundQueuesChange?: (ids: string[]) => void;
  /** Whether to show inbound queues selector */
  showInboundQueues?: boolean;
  /** Whether the inbound queues panel is currently shown (controlled mode) */
  showInboundQueuesPanel?: boolean;
  /** Callback when inbound queues panel visibility changes */
  onShowInboundQueuesPanelChange?: (show: boolean) => void;
  /** List of dial groups */
  dialGroups?: DialGroup[];
  /** Currently selected dial group ID */
  dialGroupId?: string;
  /** Callback when dial group changes */
  onDialGroupChange?: (groupId: string) => void;
  /** Whether to show dial group selector */
  showDialGroup?: boolean;
  /** Auto answer enabled state */
  autoAnswer?: boolean;
  /** Callback when auto answer changes */
  onAutoAnswerChange?: (enabled: boolean) => void;
  /** Whether to show auto answer switch */
  showAutoAnswer?: boolean;
  /** List of login types */
  loginTypeList?: LoginTypeOption[];
  /** Currently selected login type */
  loginType?: LoginTypes;
  /** Callback when login type changes */
  onLoginTypeChange?: (type: LoginTypes) => void;
  /** Whether to show voice connection selector */
  showVoiceConnection?: boolean;
  /** Extension number input value */
  extensionNumber?: string;
  /** Callback when extension number changes */
  onExtensionNumberChange?: (number: string) => void;
  /** Whether to show extension number input */
  showExtensionNumber?: boolean;
}
