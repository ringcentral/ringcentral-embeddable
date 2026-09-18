/**
 * A single way to end the call, rendered as one radio row.
 */
export interface EndCallOption {
  /** Stable id passed back to onConfirm. */
  id: string;
  label: string;
  /** Second line, such as the transfer destination being cancelled. */
  description?: string;
}

/**
 * Props for EndCallDialog component
 */
export interface EndCallDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The ways the current call can be ended, in display order */
  options: readonly EndCallOption[];
  /** Callback when the dialog is dismissed without ending the call */
  onClose: () => void;
  /** Callback with the id of the selected option */
  onConfirm: (optionId: string) => void;
}
