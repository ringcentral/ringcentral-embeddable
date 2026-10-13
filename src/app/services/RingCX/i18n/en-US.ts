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
  agentStateUnavailable: "This agent state isn't available.",
  callLogFailed:
    "The call couldn't be logged to your service. You can try again from call history.",
} as const;
