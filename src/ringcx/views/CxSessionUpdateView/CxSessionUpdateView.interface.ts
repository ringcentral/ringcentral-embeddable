/**
 * Options for CxSessionUpdateView customization
 */
interface CxSessionUpdateViewOptions {
  onUpdateComplete?: () => void;
  onCancel?: () => void;
}

/**
 * Props passed to the CxSessionUpdateView component
 */
interface CxSessionUpdateViewProps {
  className?: string;
}

export type { CxSessionUpdateViewOptions, CxSessionUpdateViewProps };
