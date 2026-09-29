/**
 * Timezone option interface
 */
export interface TimezoneOption {
  id: string;
  label: string;
}

/**
 * Props for TimezoneSelect component
 */
export interface TimezoneSelectProps {
  /** Selected timezone value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Error state */
  error?: boolean;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Data sign for testing */
  'data-sign'?: string;
  /** Custom class name */
  className?: string;
}
