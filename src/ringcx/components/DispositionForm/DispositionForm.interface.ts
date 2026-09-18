/**
 * Disposition pick list item
 */
export interface DispositionItem {
  /** Unique ID of the disposition */
  dispositionId: string;
  /** Display label */
  disposition: string;
  /** Whether notes are required for this disposition */
  requireNote?: boolean;
}

/**
 * Disposition form data
 */
export interface DispositionData {
  /** Selected disposition ID */
  dispositionId?: string;
  /** Notes text */
  notes?: string;
}

/**
 * Validation state for the disposition form
 */
export interface DispositionValidation {
  /** Whether the disposition field is valid */
  dispositionId: boolean;
  /** Whether the notes field is valid */
  notes: boolean;
}

/**
 * Required state for the disposition form
 */
export interface DispositionRequired {
  /** Whether notes are required */
  notes: boolean;
}

/**
 * Props for DispositionForm component
 */
export interface DispositionFormProps {
  /** Available disposition options */
  dispositionPickList: DispositionItem[];
  /** Current form data */
  dispositionData?: DispositionData;
  /** Validation state */
  validated: DispositionValidation;
  /** Required state */
  required: DispositionRequired;
  /** Whether to hide the call notes field */
  hideCallNote?: boolean;
  /** Whether to show the summary textarea */
  showSummary?: boolean;
  /** Summary text value */
  summary?: string;
  /** Whether summary streaming is final and editable */
  isSummaryFinal?: boolean;
  /** Whether summary streaming is still loading */
  isSummaryLoading?: boolean;
  /** Disable disposition select when already submitted */
  disableDispositionSelect?: boolean;
  /** Called when a form field changes */
  onFieldChange: (field: string, value: string) => void;
  /** Called when summary content changes */
  onSummaryChange?: (value: string) => void;
  /** Placeholder text for the disposition select */
  selectPlaceholder?: string;
  /** Error text for disposition validation */
  dispositionErrorText?: string;
  /** Error text for notes validation */
  notesErrorText?: string;
  /** Label for the disposition field */
  dispositionLabel?: string;
  /** Label for the notes field */
  notesLabel?: string;
  /** Placeholder for the notes field */
  notesPlaceholder?: string;
  /** Label for the summary field */
  summaryLabel?: string;
  /** Placeholder for the summary field */
  summaryPlaceholder?: string;
  /** Loading text for summary generation */
  summaryLoadingText?: string;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
