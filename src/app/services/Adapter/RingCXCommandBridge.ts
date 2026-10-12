/**
 * Host-facing command surface of the lazily loaded RingCX adapter bridge.
 * Kept in `src/app` so Adapter does not import the RingCX chunk.
 */
export interface RingCXAgentSnapshot {
  agentId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface RingCXSessionSnapshot {
  loginType?: string;
  dialGroupId?: string;
  skillProfileId?: string;
  inboundQueueIds?: string[];
  autoAnswer?: boolean;
}

export interface RingCXAgentSessionSnapshot {
  status: string;
  agent?: RingCXAgentSnapshot;
  session?: RingCXSessionSnapshot;
  permissions?: {
    allowLoginUpdates?: boolean;
    /** Whether the session dial group is a progressive one */
    progressiveEnabled?: boolean;
  };
}

export interface RingCXDispositionOption {
  id: string;
  name: string;
  requireNotes?: boolean;
}

export interface RingCXCallControlOptions {
  dtmf?: string;
}

export interface RingCXCommandBridge {
  dialout(phoneNumber: string, callerId?: string): Promise<void>;
  controlCall(
    action: string,
    callId?: string,
    options?: RingCXCallControlOptions,
  ): Promise<void>;
  setAgentState(state: string, auxState?: string): Promise<void>;
  dialLead(lead: unknown, destination?: string): Promise<void>;
  /** Same as Start dialing on the Leads tab */
  startProgressiveDial(): Promise<void>;
  /** Same as Stop dialing on the Leads tab */
  stopProgressiveDial(): Promise<void>;
  getAgentSessionSnapshot(): RingCXAgentSessionSnapshot;
  getDispositions(callId?: string): {
    callId?: string;
    dispositions: RingCXDispositionOption[];
  };
  getCallForLog(id: string): Promise<unknown>;
}
