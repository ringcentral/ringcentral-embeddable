export default {
  agentSessionStartFailed:
    'The RingCX agent session could not be started. Please try again.',
  finishRingCXCallFirst: 'Finish the RingCX call first',
  agentSessionNotReady:
    'Start a RingCX agent session before using this command.',
  agentSessionEndBlocked:
    'End the RingCX call before ending the agent session.',
  callControlFailed: 'The RingCX call action could not be completed.',
  callControlNotAllowed: 'This action is not allowed for the current RingCX call.',
  callControlUnsupported: 'This call action is not supported for RingCX calls.',
  callLogFailed:
    'The call was saved, but logging it to your service failed. You can retry from history.',
} as const;
