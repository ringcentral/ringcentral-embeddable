import React from 'react';
import {
  injectable,
  optional,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { List, EmptyState, Button } from '@ringcentral/spring-ui';
import { OutgoingCallMd, MissedCallMd } from '@ringcentral/spring-icon';

import { CxLeads, ALLOW_DIAL_STATES, DISABLE_MANUAL_PASS_STATES, PHONE_DELIMETER } from '../../services/CxLeads';
import type { Lead, DispositionItem } from '../../services/CxLeads';
import { CxCall } from '../../services/CxCall';
import { CxWorkingState } from '../../services/CxWorkingState';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxAuth } from '../../services/CxAuth';
import { CxClient } from '../../services/CxClient';
import { LeadItem } from '../../components/LeadItem';
import type { PhoneNumberData, ManualPassParams } from '../../components/LeadItem';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import i18n from './i18n';

/**
 * Agent states that indicate the agent is busy
 */
const AGENT_BUSY_STATES = ['TRANSITION', 'ENGAGED', 'RNA-STATE'];

/**
 * CxLeadsView options for configuration
 */
export interface CxLeadsViewOptions {
  // Optional configuration options
}

/**
 * CxLeadsView module - Leads panel
 * Shows leads list with dial functionality
 */
@injectable({
  name: 'CxLeadsView',
})
class CxLeadsView extends RcViewModule {
  constructor(
    private cxLeads: CxLeads,
    private cxCall: CxCall,
    private cxWorkingState: CxWorkingState,
    private cxAgentSession: CxAgentSession,
    private cxAuth: CxAuth,
    private cxClient: CxClient,
    @optional('CxLeadsViewOptions')
    private leadsViewOptions?: CxLeadsViewOptions,
  ) {
    super();
  }

  fetchLeads = async () => {
    await this.cxLeads.fetchLeads();
  };

  dialLead = async (lead: Lead, destination: string) => {
    await this.cxLeads.dialLead(lead, destination);
  };

  manualPassLead = async (params: ManualPassParams) => {
    await this.cxLeads.manualPassLead(params);
  };

  fetchDispositionList = async (campaignId: string): Promise<DispositionItem[]> => {
    const list = await this.cxClient.getCampaignDispositions(campaignId);
    return list.map((item: any) => ({
      value: item.dispositionId,
      label: item.disposition,
    }));
  };

  viewLead = async (lead: Lead) => {
    void lead;
  };

  component() {
    const { t } = useLocale(i18n);

    const {
      filteredLeads,
      loading,
      noLeadsReturned,
      isDialing,
      pendingDisposition,
      agentState,
      allowManualPass,
      defaultTimezone,
      showViewLead,
    } = useConnector(() => ({
      filteredLeads: this.cxLeads.filteredLeads,
      loading: this.cxLeads.loading,
      noLeadsReturned: this.cxLeads.noLeadsReturned,
      isDialing: this.cxCall.isDialing,
      pendingDisposition: this.cxWorkingState.isPendingDisposition,
      agentState: this.cxWorkingState.agentState?.agentState || '',
      allowManualPass: this.cxAuth.agentConfig?.agentPermissions?.allowManualPass ?? false,
      defaultTimezone: (this.cxAuth.authenticateResponse as any)?.regionalSettings?.timezoneName || 'America/New_York',
      showViewLead: false,
    }));

    const agentBusy = AGENT_BUSY_STATES.includes(agentState);

    return (
      <div className="flex flex-col h-full bg-neutral-base">
        <div className="flex-1 overflow-auto">
          {filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={noLeadsReturned ? MissedCallMd : OutgoingCallMd}
                title={noLeadsReturned ? t('noLeadsReturned') : t('startOutboundDialing')}
                description={loading ? t('gettingLeads') : t('getLeadsToStart')}
              />
            </div>
          ) : (
            <List>
              {filteredLeads.map((lead) => {
                const displayName = [lead.firstName, lead.midName, lead.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Unknown';
                const destination = lead.destinationE164 || lead.destination;
                const destinations = typeof destination === 'string'
                  ? destination.split(PHONE_DELIMETER)
                  : Array.isArray(destination)
                    ? destination
                    : [];
                const phoneNumbers: PhoneNumberData[] = destinations.map((dest) => ({
                  formatted: formatPhoneNumber({ phoneNumber: dest }),
                  destination: dest,
                }));
                const allowDial = ALLOW_DIAL_STATES.includes(lead.leadState);
                const disableManualPass = DISABLE_MANUAL_PASS_STATES.includes(lead.leadState);
                return (
                  <LeadItem
                    key={lead.leadId}
                    lead={lead}
                    displayName={displayName}
                    phoneNumbers={phoneNumbers}
                    allowDial={allowDial}
                    isDialing={isDialing}
                    disabled={pendingDisposition || agentBusy}
                    onDial={(dest) => this.dialLead(lead, dest)}
                    onPass={this.manualPassLead}
                    showManualPassButton={allowManualPass}
                    disableManualPass={disableManualPass}
                    fetchDispositionList={this.fetchDispositionList}
                    defaultTimezone={defaultTimezone}
                    showViewLeadButton={showViewLead}
                    onViewLead={this.viewLead}
                  />
                );
              })}
            </List>
          )}
        </div>

        <div className="flex justify-center items-center p-4 border-t border-neutral-b4">
          <Button
            onClick={this.fetchLeads}
            variant="outlined"
            color="primary"
            loading={loading}
          >
            {t('getLeads')}
          </Button>
        </div>
      </div>
    );
  }
}

export { CxLeadsView };
