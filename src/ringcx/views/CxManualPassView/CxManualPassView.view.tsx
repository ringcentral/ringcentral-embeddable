import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  action,
  injectable,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React from 'react';

import { ManualPassForm } from '../../components/ManualPassForm';
import type { ManualPassSubmitParams } from '../../components/ManualPassForm';
import i18n from '../../components/LeadInfoPanel/i18n';
import { CxAuth } from '../../services/CxAuth';
import { CxCall } from '../../services/CxCall';
import {
  AGENT_BUSY_STATES,
  CxLeads,
  DISABLE_MANUAL_PASS_STATES,
} from '../../services/CxLeads';
import type { DispositionItem, Lead } from '../../services/CxLeads';
import { CxWorkingState } from '../../services/CxWorkingState';

const DEFAULT_TIMEZONE = 'America/New_York';

export interface CxManualPassViewProps {
  /** Set while no tab bar shows the tab, so the form shows its own header. */
  showCloseButton: boolean;
  /** Closes the Manual pass side widget tab. */
  onClose: () => void;
}

function getLeadName(lead: Lead): string {
  return [lead.firstName, lead.midName, lead.lastName].filter(Boolean).join(' ');
}

/**
 * The RingCX Manual pass side widget tab: the pass form for one fetched lead,
 * opened from the Leads tab or the Lead tab. The lead is server state, so
 * every tab and popup shows the same one.
 */
@injectable({
  name: 'CxManualPassView',
})
export class CxManualPassView extends RcViewModule {
  constructor(
    private readonly _cxLeads: CxLeads,
    private readonly _cxCall: CxCall,
    private readonly _cxWorkingState: CxWorkingState,
    private readonly _cxAuth: CxAuth,
  ) {
    super();
  }

  /** Request id of the fetched lead being passed. */
  @state
  requestId: string | null = null;

  @action
  setRequestId(requestId: string | null): void {
    this.requestId = requestId;
  }

  /**
   * The lead being passed, or `null` once it is passed or no longer fetched.
   */
  get lead(): Lead | null {
    const lead = this.requestId
      ? this._cxLeads.leads.find((item) => item.requestId === this.requestId)
      : undefined;
    return lead && !lead.completed ? lead : null;
  }

  private readonly _fetchDispositionList = (
    campaignId: string,
  ): Promise<DispositionItem[]> =>
    this._cxLeads.fetchManualPassDispositions(campaignId);

  /**
   * Passing is blocked as on the Leads tab: while dialing, during a pending
   * disposition, while the agent is busy, or in a lead state that cannot be
   * passed.
   */
  private _isPassDisabled(lead: Lead): boolean {
    const agentState = this._cxWorkingState.agentState?.agentState || '';
    return (
      this._cxCall.isDialing ||
      this._cxWorkingState.isPendingDisposition ||
      AGENT_BUSY_STATES.includes(agentState) ||
      DISABLE_MANUAL_PASS_STATES.includes(lead.leadState)
    );
  }

  component({ showCloseButton, onClose }: CxManualPassViewProps) {
    const { t } = useLocale(i18n);
    const { lead, disabled, defaultTimezone } = useConnector(() => {
      const current = this.lead;
      return {
        lead: current,
        disabled: current ? this._isPassDisabled(current) : true,
        defaultTimezone:
          (this._cxAuth.authenticateResponse as any)?.regionalSettings
            ?.timezoneName || DEFAULT_TIMEZONE,
      };
    });
    if (!lead) {
      return (
        <div className="typography-mainText p-4 text-center text-neutral-b2">
          {t('leadNotAvailable')}
        </div>
      );
    }
    return (
      <ManualPassForm
        key={lead.requestId}
        leadName={getLeadName(lead) || t('unknown')}
        showHeader={showCloseButton}
        onClose={onClose}
        onSubmit={async (params: ManualPassSubmitParams) => {
          onClose();
          await this._cxLeads.manualPassLead({ lead, ...params });
        }}
        fetchDispositionList={this._fetchDispositionList}
        campaignId={lead.campaignId || ''}
        defaultTimezone={defaultTimezone}
        disabled={disabled}
      />
    );
  }
}
