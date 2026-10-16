import {
  injectable,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useMemo } from 'react';

import { ThirdParty } from '../../../app/services/ThirdParty';
import { LeadInfoPanel } from '../../components/LeadInfoPanel';
import type { LeadInfoPreviewActions } from '../../components/LeadInfoPanel';
import type { ManualPassSubmitParams } from '../../components/ManualPassModal';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxAuth } from '../../services/CxAuth';
import { CxCall } from '../../services/CxCall';
import { CxLeadInfo } from '../../services/CxLeadInfo';
import type { CxLeadDetails } from '../../services/CxLeadInfo';
import {
  AGENT_BUSY_STATES,
  ALLOW_DIAL_STATES,
  CxLeads,
  DISABLE_MANUAL_PASS_STATES,
} from '../../services/CxLeads';
import type { DispositionItem } from '../../services/CxLeads';
import { CxWorkingState } from '../../services/CxWorkingState';

const DEFAULT_TIMEZONE = 'America/New_York';

/** Kept stable so the connector does not see a new value on every read. */
const NO_DIAL_NUMBERS: string[] = [];

export interface CxLeadInfoViewProps {
  /** Set while no tab bar shows the Lead tab. */
  showCloseButton: boolean;
  onClose: () => void;
}

interface PreviewActionState {
  hasPreviewActions: boolean;
  dialNumbers: string[];
  isDialDisabled: boolean;
  showManualPass: boolean;
  isManualPassDisabled: boolean;
  defaultTimezone: string;
}

const NO_PREVIEW_ACTIONS: PreviewActionState = {
  hasPreviewActions: false,
  dialNumbers: NO_DIAL_NUMBERS,
  isDialDisabled: true,
  showManualPass: false,
  isManualPassDisabled: true,
  defaultTimezone: DEFAULT_TIMEZONE,
};

/**
 * The content of the RingCX Lead side widget tab. For a fetched lead not on
 * a call it offers dial and manual pass under the same rules as the Leads
 * list, so the agent can work the lead from here.
 */
@injectable({
  name: 'CxLeadInfoView',
})
export class CxLeadInfoView extends RcViewModule {
  constructor(
    private readonly _cxLeadInfo: CxLeadInfo,
    private readonly _cxLeads: CxLeads,
    private readonly _cxCall: CxCall,
    private readonly _cxWorkingState: CxWorkingState,
    private readonly _cxAgentSession: CxAgentSession,
    private readonly _cxAuth: CxAuth,
    private readonly _thirdParty: ThirdParty,
  ) {
    super();
  }

  private readonly _onViewLead = (lead: CxLeadDetails) => {
    void this._thirdParty.viewLead({ lead, agentId: this._cxAuth.agentId });
  };

  private readonly _loadRecording = (value: string) =>
    this._cxLeadInfo.loadRecording(value);

  private readonly _onDial = (phoneNumber: string) => {
    const lead = this._cxLeadInfo.previewLead;
    if (lead) {
      void this._cxLeads.dialLead(lead, phoneNumber);
    }
  };

  private readonly _onManualPass = async (
    params: ManualPassSubmitParams,
  ): Promise<void> => {
    const lead = this._cxLeadInfo.previewLead;
    if (lead) {
      await this._cxLeads.manualPassLead({ lead, ...params });
    }
  };

  private readonly _fetchDispositionList = (
    campaignId: string,
  ): Promise<DispositionItem[]> =>
    this._cxLeads.fetchManualPassDispositions(campaignId);

  /**
   * Dial and manual pass availability for the tab's fetched lead, as the
   * Leads list computes it; none for a call's lead.
   */
  private _getPreviewActionState(): PreviewActionState {
    const lead = this._cxLeadInfo.previewLead;
    if (!lead) {
      return NO_PREVIEW_ACTIONS;
    }
    const agentState = this._cxWorkingState.agentState?.agentState || '';
    const isBlocked =
      this._cxCall.isDialing ||
      this._cxWorkingState.isPendingDisposition ||
      AGENT_BUSY_STATES.includes(agentState);
    return {
      hasPreviewActions: true,
      dialNumbers: this._cxAgentSession.isProgressiveDialMode
        ? NO_DIAL_NUMBERS
        : (this._cxLeadInfo.info?.phoneNumbers ?? NO_DIAL_NUMBERS),
      isDialDisabled: isBlocked || !ALLOW_DIAL_STATES.includes(lead.leadState),
      showManualPass:
        !!this._cxAuth.agentConfig?.agentPermissions?.allowManualPass,
      isManualPassDisabled:
        isBlocked || DISABLE_MANUAL_PASS_STATES.includes(lead.leadState),
      defaultTimezone:
        (this._cxAuth.authenticateResponse as any)?.regionalSettings
          ?.timezoneName || DEFAULT_TIMEZONE,
    };
  }

  component({ showCloseButton, onClose }: CxLeadInfoViewProps) {
    const {
      info,
      showViewLeadButton,
      hasPreviewActions,
      dialNumbers,
      isDialDisabled,
      showManualPass,
      isManualPassDisabled,
      defaultTimezone,
    } = useConnector(() => ({
      info: this._cxLeadInfo.info,
      showViewLeadButton: this._thirdParty.leadViewerRegistered,
      ...this._getPreviewActionState(),
    }));
    const previewActions = useMemo<LeadInfoPreviewActions | null>(
      () =>
        hasPreviewActions
          ? {
              dialNumbers,
              isDialDisabled,
              showManualPass,
              isManualPassDisabled,
              defaultTimezone,
              onDial: this._onDial,
              onManualPass: this._onManualPass,
              fetchDispositionList: this._fetchDispositionList,
            }
          : null,
      [
        hasPreviewActions,
        dialNumbers,
        isDialDisabled,
        showManualPass,
        isManualPassDisabled,
        defaultTimezone,
      ],
    );
    const target = info?.target;
    const key = target?.type === 'call' ? target.callId : target?.requestId;
    return (
      <LeadInfoPanel
        key={key}
        info={info}
        showViewLeadButton={showViewLeadButton}
        onViewLead={this._onViewLead}
        previewActions={previewActions}
        loadRecording={this._loadRecording}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />
    );
  }
}
