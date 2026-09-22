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
  };
}

export interface RingCXDispositionOption {
  id: string;
  name: string;
  requireNotes?: boolean;
}

export interface RingCXCommandBridge {
  dialout(phoneNumber: string, callerId?: string): Promise<void>;
  controlCall(action: string, callId?: string): Promise<void>;
  setAgentState(state: string): Promise<void>;
  dialLead(lead: unknown, destination?: string): Promise<void>;
  getAgentSessionSnapshot(): RingCXAgentSessionSnapshot;
  getDispositions(callId?: string): {
    callId?: string;
    dispositions: RingCXDispositionOption[];
  };
  getCallForLog(id: string): Promise<unknown>;
}
