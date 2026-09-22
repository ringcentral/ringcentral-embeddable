import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  storage,
  StoragePlugin,
  delegate,
} from '@ringcentral-integration/next-core';

import { CxCallbackTypes } from '../CxClient/enums';
import { t } from './i18n';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import { CxSubscription } from '../CxSubscription';
import { CxCall } from '../CxCall';
import type {
  CxLeadEvent,
  CxLeadsOptions,
  Lead,
  ManualPassParams,
} from './CxLeads.interface';
import { track } from '../Analytics/track';
import { trackEvents } from '../../lib/trackEvents';

// Available to show in the leads panel
export const AVAILABLE_LEAD_STATES = [
  'PENDING',
  'DIALING',
  'RINGING',
  'NOANSWER',
  'BUSY',
  'MACHINE',
  'HANGUP',
  'INTERCEPT',
  'DISCONNECT',
  'ABANDON',
  'CONGESTION',
  'APP-DNC',
  'OTHER',
];

// Available to dial
export const ALLOW_DIAL_STATES = [
  'PENDING',
  'READY',
  'CALLBACK',
  'AGENT-CALLBACK',
  'PENDING-CALLBACK',
  'COMPLETE',
];

// Disable dial from search results
export const SEARCH_DISABLE_DIAL_STATES = [
  'PENDING',
  'ACTIVE',
  'PENDING-HCI',
  'DO-NOT-CALL',
  'EXPIRED',
];

// Disable manual pass
export const DISABLE_MANUAL_PASS_STATES = [
  'DO-NOT-CALL',
  'DIALING',
  'RINGING',
  'ANSWER',
];

export const PHONE_DELIMETER = '|';

function allNumbersDialed(lead: Lead): boolean {
  const dialedList = lead.dialedList || [];
  let destination = lead.destination || [];
  if (destination && !Array.isArray(destination)) {
    destination = destination.split(PHONE_DELIMETER);
  }
  return dialedList.length === destination.length;
}

function isE164(phoneNumber: string): boolean {
  const isOnlyNumber = /^[0-9+]+$/.test(phoneNumber);
  return isOnlyNumber && phoneNumber.startsWith('+');
}

/**
 * CxLeads module - Lead management
 * Handles lead fetching, dialing, and manual pass
 */
@injectable({
  name: 'CxLeads',
})
class CxLeads extends RcModule {
  private readonly _leadListeners = new Set<(event: CxLeadEvent) => void>();

  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxSubscription: CxSubscription,
    private cxCall: CxCall,
    private toast: Toast,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    @optional('CxLeadsOptions') private evLeadsOptions?: CxLeadsOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  initialize() {
    this._bindSubscription();
    this.cxAuth.beforeAgentLogout(() => {
      this.clearLeads();
    });
  }

  @storage
  @state
  leads: Lead[] = [];

  @state
  loading = false;

  @storage
  @state
  noLeadsReturned = false;

  @storage
  @state
  leadStatesMapping: Record<string, string> = {};

  @action
  setLeadStatesMapping(requestId: string, leadState: string) {
    this.leadStatesMapping[requestId] = leadState;
  }

  @action
  setLoading(loading: boolean) {
    this.loading = loading;
  }

  @action
  setLeads(leads: Lead[]) {
    this.leads = leads;
    this.noLeadsReturned = !leads || leads.length === 0;
    this.leadStatesMapping = {};
  }

  @action
  updateLead(leadId: string, newProps: Partial<Lead> = {}) {
    const lead = this.leads.find((l) => l.leadId === leadId);
    if (lead) {
      Object.keys(newProps).forEach((key) => {
        (lead as any)[key] = newProps[key];
      });
    }
  }

  @action
  clearLeads() {
    this.leads = [];
    this.noLeadsReturned = false;
    this.leadStatesMapping = {};
  }

  @computed((that: CxLeads) => [that.leads, that.leadStatesMapping])
  get filteredLeads(): Lead[] {
    return this.leads.filter((lead) => {
      const destination = lead.destination;
      if (lead.completed) {
        return false;
      }
      const leadState = this.leadStatesMapping[lead.requestId] || lead.leadState;
      let availableLeadState = AVAILABLE_LEAD_STATES.includes(leadState as string);
      let allDialed = false;
      if (
        (typeof destination === 'string' && destination.indexOf(PHONE_DELIMETER) > -1) ||
        Array.isArray(destination)
      ) {
        allDialed = allNumbersDialed(lead);
        if (!allDialed && !availableLeadState) {
          availableLeadState = true;
        }
      }
      return availableLeadState && !allDialed;
    });
  }


  /**
   * Notifies the adapter bridge when leads are loaded, dialed, or passed.
   */
  onLeadEvent(listener: (event: CxLeadEvent) => void): () => void {
    this._leadListeners.add(listener);
    return () => {
      this._leadListeners.delete(listener);
    };
  }

  private _emitLeadEvent(event: CxLeadEvent): void {
    this._leadListeners.forEach((listener) => listener(event));
  }

  private _bindSubscription() {
    this.cxSubscription.subscribe(CxCallbackTypes.PREVIEW_LEAD_STATE, (data: any) => {
      this.setLeadStatesMapping(data.requestId, data.leadState);
    });
  }

  private _requiredToCall(): boolean {
    if (!this.cxAuth.agent?.agentConfig?.agentPermissions?.requireFetchedLeadsCalled) {
      return false;
    }
    return this.filteredLeads.some((lead) => {
      return (
        !lead.completed &&
        lead.leadState.toUpperCase() === 'PENDING'
      );
    });
  }

  /**
   * Manual pass a lead with disposition
   */
  @track(trackEvents.manualPassLead)
  @delegate('server')
  async manualPassLead({
    lead,
    dispositionId,
    notes,
    callback,
    callbackDTS,
  }: ManualPassParams): Promise<void> {
    try {
      await this.cxClient.manualPass({
        dispId: dispositionId,
        notes,
        callback,
        callbackDTS: callback ? callbackDTS : '',
        leadId: lead.leadId,
        requestId: lead.requestId,
        externId: lead.externId,
      });
      this.updateLead(lead.leadId, { completed: true });
      this._emitLeadEvent({ action: 'passed', lead });
    } catch (error) {
      this.toast.danger({
        message: t('leadPassFailed'),
      });
    }
  }

  /**
   * Fetch leads from preview dial
   */
  @track(trackEvents.fetchLeads)
  @delegate('server')
  async fetchLeads(): Promise<boolean> {
    if (this.loading) {
      return false;
    }
    if (this._requiredToCall()) {
      this.toast.warning({
        message: t('requiredLeadCall'),
      });
      return false;
    }
    let success = false;
    try {
      this.setLoading(true);
      const result = await this.cxClient.getPreviewDial();
      if (!result) {
        throw new Error('No result returned');
      }
      this.setLeads(result.leads as Lead[]);
      this._emitLeadEvent({
        action: 'loaded',
        leads: result.leads as Lead[],
      });
      success = true;
    } catch (error) {
      this.logger.error('fetchLeads error~~', error);
      success = false;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Dial a lead
   */
  @track(trackEvents.callLead)
  @delegate('server')
  async dialLead(lead: Lead, destination: string): Promise<void> {
    const destinationE164 = isE164(destination) ? destination : undefined;
    const dialedList = lead.dialedList || [];
    const newDialedList = [...dialedList, destination];
    this.updateLead(lead.leadId, { dialedList: newDialedList });
    this._emitLeadEvent({ action: 'dialed', lead, destination });
    await this.cxCall.previewDial(lead.requestId, destination, destinationE164 || '');
  }
}

export { CxLeads };
