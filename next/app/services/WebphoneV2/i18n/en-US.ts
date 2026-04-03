export default {
  provisionUpdate:
    'Sorry, something went wrong on our end. We will automatically try to reconnect shortly.',
  serverConnecting:
    'Sorry, we are having an issue connecting to the phone server.',
  browserNotSupported:
    'Sorry, making calls using this browser is not supported.',
  noOutboundCallWithoutDL:
    'Your extension is not allowed to make outbound calls with browser currently, please contact your account representative for an upgrade.',
  checkDLError:
    'Unable to make outgoing call. Contact {brandName} for support if this error keeps showing.',
  failWithoutStatusCode:
    'Sorry, something went wrong on our end. If the error persists, report this error to {brandName} support.',
  muteError: 'Call cannot be muted at the moment.',
  holdError: 'Call cannot be hold at the moment.',
  recordDisabled:
    'Sorry, your account does not have the feature to record a call. Please contact your account administrator.',
  recordError:
    'You cannot record the call at the moment. Error code: {errorCode}',
  parked: 'Your call is parked at location: {parkedNumber}',
  transferError: 'Cannot transfer the call. Please try again later.',
  flipError: 'Cannot flip the call. Please try again later.',
  toVoiceMailError: 'Cannot send call to voicemail due to internal error',
  webphoneCountOverLimit: 'A maximum of 5 web phones could be registered.',
  failWithStatusCode:
    "Sorry, we've encountered an error: {errorCode}. If the problem persists, report this error to {brandName} support.",
  registeringWithStatusCode:
    'Sorry, something went wrong. We are trying to reconnect. If the problem persists, please report this error to {brandName} support. Error code: {errorCode}.',
  registeringWithoutStatusCode:
    'Sorry, something went wrong. We are trying to reconnect. If the problem persists, please report this error to {brandName} support.',
  connectFailed:
    'Sorry, phone features are currently unavailable. Please retry later.',
} as const;
