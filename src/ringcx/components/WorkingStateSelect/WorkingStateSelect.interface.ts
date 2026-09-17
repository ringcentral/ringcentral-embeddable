/**
 * Agent state option for WorkingStateSelect
 */
export interface AgentStateOption {
  /** Agent state (e.g., 'Available', 'On Break') */
  agentState: string;
  /** Agent auxiliary state (e.g., 'Lunch', 'Meeting') */
  agentAuxState: string;
  /** Display color for the state indicator */
  color?: string;
  /** Display title (usually agentAuxState or agentState) */
  title?: string;
}

/**
 * Props for WorkingStateSelect component
 */
export interface WorkingStateSelectProps {
  /** Available agent states to select from */
  agentStates: AgentStateOption[];
  /** Index of the currently selected state */
  currentStateIndex: number;
  /** Display text for the current state */
  stateText: string;
  /** Color for the current state indicator */
  stateColor: string;
  /** Timer text to display (e.g., "00:05:30") */
  timerText: string;
  /** Callback when state is changed */
  onChangeState: (state: AgentStateOption) => void;
  /** Whether break time has been exceeded */
  isOverTime?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
