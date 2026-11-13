export interface DispositionRecapProps {
  title: string;
  savedLabel: string;
  dispositionName: string;
  notes?: string;
}

export interface WrapUpTimerProps {
  /** When the timer started, in milliseconds. */
  startTime: number;
  'aria-label': string;
}

export interface WrapUpCallLogProps {
  /** `none` shows `noFormText` in place of the form. */
  status: 'loading' | 'ready' | 'none';
  loadingText: string;
  noFormText: string;
  page: import('../../../app/services/ThirdParty').ThirdPartyPage | null;
  formData: Record<string, unknown>;
  onChange: (formData: Record<string, unknown>, changedKeys: string[]) => void;
  onButtonClick: (buttonId: string, formData: Record<string, unknown>) => void;
  onSubmit: (formData: Record<string, unknown>) => void;
  /** An error above the form: a failed save or missing required fields. */
  errorText?: string;
  /** The form is saving and cannot be edited. */
  locked?: boolean;
}
