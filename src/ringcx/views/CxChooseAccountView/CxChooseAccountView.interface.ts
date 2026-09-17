/**
 * Options for CxChooseAccountView customization
 */
interface CxChooseAccountViewOptions {
  onAccountSelected?: (agentId: string) => void;
}

/**
 * Props passed to the CxChooseAccountView component
 */
interface CxChooseAccountViewProps {
  className?: string;
}

export type { CxChooseAccountViewOptions, CxChooseAccountViewProps };
