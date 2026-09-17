import type { CxAgent } from '../../services/CxClient/interfaces';

/**
 * Props for ChooseAccountPanel component
 */
interface ChooseAccountPanelProps {
  /** List of agents to display */
  agents: CxAgent[];
  /** Whether the panel is in loading state */
  isLoading?: boolean;
  /** Callback when an agent is selected */
  onSelectAgent: (agentId: string) => void;
}

export type { ChooseAccountPanelProps };
