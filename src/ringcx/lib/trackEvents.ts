/**
 * Engage Voice track events for analytics
 */
export const trackEvents = {
  // CxAgentSession, Voice Connection & Persistent Voice Connection
  agentSessionSetLoginType: 'User Setting: Set Voice Connection',
  agentSessionSetTakingCall: 'User Setting: Set Persistent Voice Connection',
  agentSessionSetSkillProfileId: 'User Setting: Set Skill Profile',
  agentSessionSetInboundQueueIds: 'User Setting: Set Inbound Queue',
  agentSessionSetAutoAnswer: 'User Setting: Set Auto Answer',
  agentSessionConfigureAgent: 'User Setting: Configure Agent',

  // CxAuth, Authentication & Login & Agent UserId
  loginAgent: 'User Setting: Login Agent',

  // CxCall, Outbound dialing
  outbound: 'Outbound Call',

  // CxPresence, Call connection events
  callInboundCallConnected: 'Call: Inbound call connected',
  outboundCallConnected: 'Outbound Call Connected',

  // ThirdParty, CRM integration events
  logCall: 'Log call',
  viewLead: 'View lead',

  // CxLeads, Lead management events
  fetchLeads: 'Fetch leads',
  callLead: 'Call lead',
  manualPassLead: 'Manual pass lead',
} as const;

export type TrackEvents = (typeof trackEvents)[keyof typeof trackEvents];
