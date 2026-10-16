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

import {
  AGENT_BUSY_STATES,
  ALLOW_DIAL_STATES,
  CxLeads,
  DISABLE_MANUAL_PASS_STATES,
  PHONE_DELIMETER,
} from '../../services/CxLeads';
import type { Lead, DispositionItem } from '../../services/CxLeads';
import { CxProgressiveDial } from '../../services/CxProgressiveDial';
import type {
  ProgressiveDialPhase,
  ProgressiveDialStopReason,
} from '../../services/CxProgressiveDial';
import { CxCall } from '../../services/CxCall';
import { CxWorkingState } from '../../services/CxWorkingState';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxAuth } from '../../services/CxAuth';
import { RingCXSideWidgets } from '../../services/RingCXSideWidgets';
import { LeadItem } from '../../components/LeadItem';
import { ProgressiveDialFooter } from '../../components/ProgressiveDialFooter';
import type { PhoneNumberData, ManualPassParams } from '../../components/LeadItem';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import i18n from './i18n';

/**
 * Agent states in which the progressive dialer cannot be started
 */
const PROGRESSIVE_START_BLOCKED_STATES = ['TRANSITION', 'ENGAGED'];

type LeadsEmptyStateText =
  | 'startOutboundDialing'
  | 'noLeadsReturned'
  | 'getLeadsToStart'
  | 'gettingLeads'
  | 'startProgressiveSubtitle'
  | 'connectingLine'
  | 'offhookFailed'
  | 'waitingToDial';

interface ProgressiveEmptyStateInput {
  running: boolean;
  phase: ProgressiveDialPhase;
  stopReason: ProgressiveDialStopReason | null;
  loading: boolean;
}

/**
 * Empty Leads tab text in progressive dial mode
 */
function getProgressiveEmptyStateText({
  running,
  phase,
  stopReason,
  loading,
}: ProgressiveEmptyStateInput): {
  title: LeadsEmptyStateText;
  description: LeadsEmptyStateText;
} {
  if (phase === 'connecting') {
    return { title: 'startOutboundDialing', description: 'connectingLine' };
  }
  if (phase === 'fetching' || loading) {
    return { title: 'startOutboundDialing', description: 'gettingLeads' };
  }
  if (phase === 'noLeads') {
    return { title: 'noLeadsReturned', description: 'gettingLeads' };
  }
  if (running) {
    return { title: 'startOutboundDialing', description: 'waitingToDial' };
  }
  return {
    title: 'startOutboundDialing',
    description:
      stopReason === 'offhookFailed' ? 'offhookFailed' : 'startProgressiveSubtitle',
  };
}

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
    private cxProgressiveDial: CxProgressiveDial,
    private cxCall: CxCall,
    private cxWorkingState: CxWorkingState,
    private cxAgentSession: CxAgentSession,
    private cxAuth: CxAuth,
    @optional('CxLeadsViewOptions')
    private leadsViewOptions?: CxLeadsViewOptions,
    @optional()
    private _ringCXSideWidgets?: RingCXSideWidgets,
  ) {
    super();
  }

  fetchLeads = async () => {
    await this.cxLeads.fetchLeads();
  };

  dialLead = async (lead: Lead, destination: string) => {
    await this.cxLeads.dialLead(lead, destination);
  };

  startProgressiveDial = async () => {
    await this.cxProgressiveDial.start({ source: 'widget' });
  };

  stopProgressiveDial = async () => {
    await this.cxProgressiveDial.stop({ source: 'widget' });
  };

  manualPassLead = async (params: ManualPassParams) => {
    await this.cxLeads.manualPassLead(params);
  };

  fetchDispositionList = (campaignId: string): Promise<DispositionItem[]> =>
    this.cxLeads.fetchManualPassDispositions(campaignId);

  /**
   * Opens the lead in the Lead side widget tab, which links on to the host
   * lead viewer.
   */
  viewLead = async (lead: Lead) => {
    await this._ringCXSideWidgets?.viewLeadInfo({
      type: 'lead',
      requestId: lead.requestId,
    });
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
      isProgressiveDialMode,
      progressiveRunning,
      progressivePhase,
      progressiveStopReason,
      nextDialAt,
      nextLeadRequestId,
    } = useConnector(() => ({
      filteredLeads: this.cxLeads.filteredLeads,
      loading: this.cxLeads.loading,
      noLeadsReturned: this.cxLeads.noLeadsReturned,
      isDialing: this.cxCall.isDialing,
      pendingDisposition: this.cxWorkingState.isPendingDisposition,
      agentState: this.cxWorkingState.agentState?.agentState || '',
      allowManualPass: this.cxAuth.agentConfig?.agentPermissions?.allowManualPass ?? false,
      defaultTimezone: (this.cxAuth.authenticateResponse as any)?.regionalSettings?.timezoneName || 'America/New_York',
      isProgressiveDialMode: this.cxAgentSession.isProgressiveDialMode,
      progressiveRunning: this.cxProgressiveDial.running,
      progressivePhase: this.cxProgressiveDial.phase,
      progressiveStopReason: this.cxProgressiveDial.stopReason,
      nextDialAt: this.cxProgressiveDial.nextDialAt,
      nextLeadRequestId: this.cxProgressiveDial.nextLeadRequestId,
    }));

    const agentBusy = AGENT_BUSY_STATES.includes(agentState);
    const emptyState = isProgressiveDialMode
      ? getProgressiveEmptyStateText({
          running: progressiveRunning,
          phase: progressivePhase,
          stopReason: progressiveStopReason,
          loading,
        })
      : {
          title: noLeadsReturned ? 'noLeadsReturned' : 'startOutboundDialing',
          description: loading ? 'gettingLeads' : 'getLeadsToStart',
        } as const;

    return (
      <div className="flex flex-col h-full bg-neutral-base">
        <div className="flex-1 overflow-auto">
          {filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <EmptyState
                icon={emptyState.title === 'noLeadsReturned' ? MissedCallMd : OutgoingCallMd}
                title={t(emptyState.title)}
                description={t(emptyState.description)}
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
                    onDial={
                      isProgressiveDialMode
                        ? undefined
                        : (dest) => this.dialLead(lead, dest)
                    }
                    isNext={
                      isProgressiveDialMode &&
                      lead.requestId === nextLeadRequestId
                    }
                    onPass={this.manualPassLead}
                    showManualPassButton={allowManualPass}
                    disableManualPass={disableManualPass}
                    fetchDispositionList={this.fetchDispositionList}
                    defaultTimezone={defaultTimezone}
                    showViewLeadButton
                    onViewLead={this.viewLead}
                  />
                );
              })}
            </List>
          )}
        </div>

        {isProgressiveDialMode ? (
          <ProgressiveDialFooter
            running={progressiveRunning}
            phase={progressivePhase}
            nextDialAt={nextDialAt}
            disabled={
              loading ||
              isDialing ||
              pendingDisposition ||
              PROGRESSIVE_START_BLOCKED_STATES.includes(agentState)
            }
            onStart={this.startProgressiveDial}
            onStop={this.stopProgressiveDial}
          />
        ) : (
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
        )}
      </div>
    );
  }
}

export { CxLeadsView };
