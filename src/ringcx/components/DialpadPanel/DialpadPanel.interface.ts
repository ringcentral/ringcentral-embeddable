import type { ReactNode } from 'react';

/**
 * Props for DialpadPanel component
 */
export interface DialpadPanelProps {
  /** Whether the keypad is open/visible */
  isOpen: boolean;
  /** Current keypad input value */
  value: string;
  /** Called when the keypad open/close state changes */
  onToggle: (isOpen: boolean) => void;
  /** Called when a dial pad value changes (full value string) */
  onChange: (value: string) => void;
  /** Called when a single key is pressed (for DTMF) */
  onKeyPress?: (digit: string) => void;
  /** Content rendered at the bottom of the drawer (e.g. call controls) */
  footer?: ReactNode;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
