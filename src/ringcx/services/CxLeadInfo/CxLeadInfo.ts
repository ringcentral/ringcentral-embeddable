import {
  action,
  computed,
  injectable,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import { CxAuth } from '../CxAuth';
import { CxClient } from '../CxClient';
import { CxLeads, PHONE_DELIMETER } from '../CxLeads';
import type { Lead } from '../CxLeads';
import { CxPresence } from '../CxPresence';
import { buildCxLeadInfoRows } from './buildCxLeadInfoRows';
import type {
  CxLeadDetails,
  CxLeadInfoData,
  CxLeadInfoTarget,
} from './CxLeadInfo.interface';
import { getCxLeadAuxLabels } from './getCxLeadAuxLabels';
import type { CxCampaignCustomLabels } from './getCxLeadAuxLabels';
import { resolveCxCallLead } from './resolveCxCallLead';

/** A campaign from LOGIN-PHASE-1, as far as the Lead tab reads it. */
interface CxLeadCampaign {
  campaignId: string;
  campaignName?: string;
  customLabels?: CxCampaignCustomLabels;
}

function getLeadName(lead: CxLeadDetails): string {
  return [lead.firstName, lead.midName, lead.lastName]
    .filter(Boolean)
    .join(' ');
}

/**
 * A multi-number lead joins its numbers with `|`, or lists them.
 */
function getLeadPhoneNumbers(lead: CxLeadDetails): string[] {
  const destination = lead.destinationE164 || lead.destination || '';
  const numbers = Array.isArray(destination)
    ? destination
    : destination.split(PHONE_DELIMETER);
  return numbers.filter(Boolean);
}

/**
 * What the RingCX Lead side widget tab shows, and the lead it resolves to.
 *
 * The target is server state, so every tab and popup shows the same lead. It
 * is a fetched preview lead opened from the Leads tab, or a call's lead
 * opened from the call screen; `followActivityCall` moves it along as calls
 * are answered.
 */
@injectable({
  name: 'CxLeadInfo',
})
export class CxLeadInfo extends RcModule {
  constructor(
    private readonly _cxLeads: CxLeads,
    private readonly _cxPresence: CxPresence,
    private readonly _cxAuth: CxAuth,
    private readonly _cxClient: CxClient,
  ) {
    super();
  }

  @state
  target: CxLeadInfoTarget | null = null;

  @action
  setTarget(target: CxLeadInfoTarget | null): void {
    this.target = target;
  }

  /**
   * The Lead tab content for the target, or `null` when the target no longer
   * resolves: its preview lead was refetched away or passed, or its call has
   * no lead.
   */
  @computed((that: CxLeadInfo) => [
    that.target,
    that._cxLeads.leads,
    that._cxLeads.leadStatesMapping,
    that._cxPresence.callsMapping,
    that._cxAuth.agentConfig,
  ])
  get info(): CxLeadInfoData | null {
    const target = this.target;
    const lead = target ? this._resolveLead(target) : null;
    if (!target || !lead) {
      return null;
    }
    const campaign = this._findCampaign(lead.campaignId);
    const source = this._getSource(lead, campaign);
    return {
      target,
      lead,
      name: getLeadName(lead),
      phoneNumbers: getLeadPhoneNumbers(lead),
      source,
      rows: buildCxLeadInfoRows({
        lead,
        source,
        leadState: this._getLeadState(lead),
        isCallLead: target.type === 'call',
        auxLabels: getCxLeadAuxLabels({
          campaignLabels: campaign?.customLabels,
          baggageLabels: lead.customLabels,
        }),
      }),
    };
  }

  /**
   * The fetched lead the tab shows when it is not on a call, for the dial
   * and manual pass actions.
   */
  get previewLead(): Lead | null {
    const target = this.target;
    if (target?.type !== 'lead') {
      return null;
    }
    const lead = this._findPreviewLead(target.requestId);
    return lead && !lead.completed ? lead : null;
  }

  /** The lead of a call, or `null` when it names no lead id. */
  getCallLead(callId: string): CxLeadDetails | null {
    if (!callId) {
      return null;
    }
    return resolveCxCallLead(
      this._cxPresence.callsMapping[callId],
      this._cxLeads.leads,
    );
  }

  /** Whether a call has a lead the Lead tab can show. */
  canViewCallLead(callId: string): boolean {
    return !!this.getCallLead(callId);
  }

  /**
   * Moves the target along when the call being worked on changes. A preview
   * lead switches to its own call once answered; a call's lead follows the
   * next call when it has one, and goes away otherwise, including when the
   * call's activity finishes.
   */
  followActivityCall(callId: string): void {
    const nextTarget = this._getFollowedTarget(callId);
    if (nextTarget !== this.target) {
      this.setTarget(nextTarget);
    }
  }

  /**
   * A playable URL for a lead field's recording: a `blob:` URL when the CX
   * token loads it, which the caller revokes, or else the proxy URL itself,
   * for the audio element to load with the CX session cookie.
   */
  async loadRecording(value: string): Promise<string> {
    // Delegated errors are dropped across ports, so a failure is `undefined`.
    const access = await this._cxClient.getRecordingAccess(value);
    if (!access) {
      throw new Error('Recording access is not available');
    }
    try {
      const response = await fetch(access.url, {
        headers: { Authorization: access.authorization },
      });
      if (!response.ok) {
        throw new Error(`Recording request failed: ${response.status}`);
      }
      return URL.createObjectURL(await response.blob());
    } catch (error) {
      this.logger.warn('[CxLeadInfo] recording fetch failed', error);
      return access.url;
    }
  }

  private _getFollowedTarget(callId: string): CxLeadInfoTarget | null {
    const target = this.target;
    if (!target || (target.type === 'call' && target.callId === callId)) {
      return target;
    }
    const callLead = this.getCallLead(callId);
    if (target.type === 'call') {
      return callLead ? { type: 'call', callId } : null;
    }
    const previewLead = this._findPreviewLead(target.requestId);
    const isSameLead =
      !!callLead &&
      !!previewLead &&
      String(previewLead.leadId) === callLead.leadId;
    return isSameLead ? { type: 'call', callId } : target;
  }

  private _resolveLead(target: CxLeadInfoTarget): CxLeadDetails | null {
    if (target.type === 'call') {
      return this.getCallLead(target.callId);
    }
    const lead = this._findPreviewLead(target.requestId);
    if (!lead || lead.completed) {
      return null;
    }
    return { ...lead, leadId: String(lead.leadId) };
  }

  private _findPreviewLead(requestId: string): Lead | undefined {
    return this._cxLeads.leads.find((lead) => lead.requestId === requestId);
  }

  private _findCampaign(campaignId?: string): CxLeadCampaign | undefined {
    if (!campaignId) {
      return undefined;
    }
    const campaigns: CxLeadCampaign[] =
      this._cxAuth.agentConfig?.outboundSettings?.availableCampaigns ?? [];
    return campaigns.find(
      (campaign) => String(campaign.campaignId) === String(campaignId),
    );
  }

  /**
   * The campaign name for a campaign lead, the queue name for an inbound
   * call, as Agent One shows it.
   */
  private _getSource(
    lead: CxLeadDetails,
    campaign: CxLeadCampaign | undefined,
  ): string {
    if (campaign?.campaignName && lead.sourceType !== 'INBOUND') {
      return campaign.campaignName;
    }
    return lead.sourceName ?? '';
  }

  private _getLeadState(lead: CxLeadDetails): string | undefined {
    const liveState = lead.requestId
      ? this._cxLeads.leadStatesMapping[lead.requestId]
      : undefined;
    return liveState || lead.leadState;
  }
}
