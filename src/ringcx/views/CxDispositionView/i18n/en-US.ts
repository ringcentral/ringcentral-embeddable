export default {
  noActiveCall: 'No active call',
  pendingDisposition: 'Pending Disposition',

  // Page titles
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
  submitAndHangUp: 'Submit and hang up',
  submitAfterVoicemailDrop: 'You can submit once the voicemail is dropped.',

  // Toast messages
  callDispositionSuccess: 'Call disposition saved successfully.',
  callDispositionFailed: 'Failed to save call disposition.',
  callLogNotFound: 'Call log not found',
  // Lead
  viewLead: 'View lead',

  // Wrap-up: the disposition and the host's call log on one page
  save: 'Save',
  logCall: 'Log call',
  callLog: 'Call log',
  logFormLoading: 'Loading the {host} form',
  noLogForm: 'There is no {host} log form for this call.',
  logFormUnavailable: "Couldn't load the {host} form.",
  logFailed:
    "Couldn't save to {host}. Your input is kept; retry or log it later from history.",
  requiredLogFieldsMissing:
    'Fill in the required {host} fields, or submit without logging this call.',
  submitWithoutLogging: 'Submit without logging',
  retry: 'Retry',
  logLater: 'Log later',
  close: 'Close',
  noteFollowsNotes: 'Follows the disposition notes.',
  noteEdited: 'Edited here. No longer follows the disposition notes.',
  useNotes: 'Use notes',
  savedDisposition: 'RingCX disposition',
  saved: 'Saved',
  saving: 'Saving',
  needsInput: 'Needs input',
  logQueued: 'Logs when the call ends',
  wrapUpTime: 'Wrap-up time',
  wrapUpForms: 'Wrap-up forms',
} as const;
