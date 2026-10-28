/**
 * How an end call option is shown: `primary` is the expected choice,
 * `danger` drops other parties, and `neutral` keeps the call going.
 */
export type EndCallOptionAppearance = 'primary' | 'danger' | 'neutral';

/**
 * A single way to end the call, rendered as one button.
 */
export interface EndCallOption {
  /** Stable id passed back to onConfirm. */
  id: string;
  label: string;
  /** Shown after the label, such as the transfer destination being cancelled. */
  description?: string;
  appearance: EndCallOptionAppearance;
}

/**
 * Props for EndCallDrawer component
 */
export interface EndCallDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** The ways the current call can be ended, in display order */
  options: readonly EndCallOption[];
  /** Callback when the drawer is dismissed without ending the call */
  onClose: () => void;
  /** Callback with the id of the option clicked */
  onConfirm: (optionId: string) => void;
}
