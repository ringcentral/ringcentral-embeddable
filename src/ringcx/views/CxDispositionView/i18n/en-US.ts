export default {
  noActiveCall: 'No active call',
  pendingDisposition: 'Pending Disposition',

  // Page titles
  callLog: 'Call log',
  createCallLog: 'Create call log',
  updateCallLog: 'Update call log',
  disposition: 'Disposition',

  // Form
  pleaseSelect: 'Please select',
  summary: 'Summary',
  summaryEdited: 'Summary (edited)',
  summaryPlaceholder: 'Summary will be generated here...',
  summaryLoading: 'Generating call summary...',
  notes: 'Notes',
  enterNotes: 'Enter notes...',

  // Validation
  dispositionError: 'Please choose a disposition before submitting.',
  notesRequired: 'Notes are required for this disposition.',

  // Actions
  submit: 'Submit',

  // Toast messages
  callDispositionSuccess: 'Call disposition saved successfully.',
  callDispositionFailed: 'Failed to save call disposition.',
  callLogNotFound: 'Call log not found',

  // Side widget - `widgets` is the list of what is waiting behind the toggle,
  // so the agent knows there is a script or an assistant to open.
  showSideWidget: 'Show {widgets}',
  hideSideWidget: 'Hide {widgets}',
} as const;
