/**
 * Host-page protocol strings for RingCX.
 *
 * These stay kebab-case literals. `ObjectMap.prefixKeys` would emit camelCase
 * suffixes and would not match the documented `rc-ringcx-*` / `rc-adapter-ringcx-*`
 * contract.
 */
export const ringCXEventTypes = {
  callRingNotify: 'rc-call-ring-notify',
  callStartNotify: 'rc-call-start-notify',
  callEndNotify: 'rc-call-end-notify',
  callDisposedNotify: 'rc-ringcx-call-disposed-notify',
  agentSessionNotify: 'rc-ringcx-agent-session-notify',
  agentStateNotify: 'rc-ringcx-agent-state-notify',
  softphoneStatusNotify: 'rc-ringcx-softphone-status-notify',
  leadNotify: 'rc-ringcx-lead-notify',
} as const;

export const ringCXCommandTypes = {
  newCall: 'rc-adapter-new-call',
  controlCall: 'rc-adapter-control-call',
  startAgentSession: 'rc-adapter-ringcx-start-agent-session',
  endAgentSession: 'rc-adapter-ringcx-end-agent-session',
  setAgentState: 'rc-adapter-ringcx-set-agent-state',
  dialLead: 'rc-adapter-ringcx-dial-lead',
} as const;

export const ringCXRequestPaths = {
  agentSession: '/ringcx/agent-session',
  dispositions: '/ringcx/dispositions',
  getCallLog: '/get-call-log',
} as const;

export const RINGCX_CALL_SOURCE = 'ringcx';
