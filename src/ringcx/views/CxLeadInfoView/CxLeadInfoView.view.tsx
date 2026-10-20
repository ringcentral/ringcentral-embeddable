import {
  injectable,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useMemo } from 'react';

import { ThirdParty } from '../../../app/services/ThirdParty';
import { LeadInfoPanel } from '../../components/LeadInfoPanel';
import type {
  LeadInfoEditActions,
  LeadInfoPreviewActions,
} from '../../components/LeadInfoPanel';
import { isLeadNumberDialed } from '../../lib/isLeadNumberDialed';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxAuth } from '../../services/CxAuth';
import { CxCall } from '../../services/CxCall';
import { CxLeadEdit } from '../../services/CxLeadEdit';
import { CxLeadInfo } from '../../services/CxLeadInfo';
import type { CxLeadDetails } from '../../services/CxLeadInfo';
import {
  AGENT_BUSY_STATES,
  ALLOW_DIAL_STATES,
  CxLeads,
  DISABLE_MANUAL_PASS_STATES,
} from '../../services/CxLeads';
import { CxWorkingState } from '../../services/CxWorkingState';

/** Kept stable so the connector does not see a new value on every read. */
const NO_DIAL_NUMBERS: string[] = [];

export interface CxLeadInfoViewProps {
  /** Set while no tab bar shows the Lead tab. */
  showCloseButton: boolean;
  onClose: () => void;
  /** Opens the Manual pass side widget tab on a fetched lead. */
  onOpenManualPass: (requestId: string) => void;
  /** Opens the Update lead side widget tab on the tab's lead. */
  onOpenLeadUpdate: () => void;
}

interface PreviewActionState {
  /** Request id of the fetched lead; `''` for a call's lead. */
  previewRequestId: string;
  dialNumbers: string[];
  /** The lead's `dialedList`, as the state holds it. */
  dialedList: string[];
  isDialDisabled: boolean;
  showManualPass: boolean;
  isManualPassDisabled: boolean;
}

const NO_PREVIEW_ACTIONS: PreviewActionState = {
  previewRequestId: '',
  dialNumbers: NO_DIAL_NUMBERS,
  dialedList: NO_DIAL_NUMBERS,
  isDialDisabled: true,
  showManualPass: false,
  isManualPassDisabled: true,
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
    private readonly _cxLeadEdit: CxLeadEdit,
  ) {
    super();
  }

  private readonly _onViewLead = (lead: CxLeadDetails) => {
    void this._thirdParty.viewLead({ lead, agentId: this._cxAuth.agentId });
  };

  private readonly _loadRecording = (value: string) =>
    this._cxLeadInfo.loadRecording(value);

  private readonly _loadLeadHistory = (leadId: string) =>
    this._cxLeadInfo.loadLeadHistory(leadId);

  private readonly _onDial = (phoneNumber: string) => {
    const lead = this._cxLeadInfo.previewLead;
    if (lead) {
      void this._cxLeads.dialLead(lead, phoneNumber);
    }
  };

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
      previewRequestId: lead.requestId,
      dialNumbers: this._cxAgentSession.isProgressiveDialMode
        ? NO_DIAL_NUMBERS
        : (this._cxLeadInfo.info?.phoneNumbers ?? NO_DIAL_NUMBERS),
      dialedList: lead.dialedList ?? NO_DIAL_NUMBERS,
      isDialDisabled: isBlocked || !ALLOW_DIAL_STATES.includes(lead.leadState),
      showManualPass:
        !!this._cxAuth.agentConfig?.agentPermissions?.allowManualPass,
      isManualPassDisabled:
        isBlocked || DISABLE_MANUAL_PASS_STATES.includes(lead.leadState),
    };
  }

  component({
    showCloseButton,
    onClose,
    onOpenManualPass,
    onOpenLeadUpdate,
  }: CxLeadInfoViewProps) {
    const {
      info,
      showViewLeadButton,
      showLeadHistory,
      editPermission,
      previewRequestId,
      dialNumbers,
      dialedList,
      isDialDisabled,
      showManualPass,
      isManualPassDisabled,
    } = useConnector(() => ({
      info: this._cxLeadInfo.info,
      showViewLeadButton: this._thirdParty.leadViewerRegistered,
      showLeadHistory: !!this._cxAuth.agentPermissions?.showLeadHistory,
      editPermission: this._cxLeadEdit.getPermission(
        this._cxLeadInfo.info?.lead ?? null,
      ),
      ...this._getPreviewActionState(),
    }));
    const previewActions = useMemo<LeadInfoPreviewActions | null>(
      () =>
        previewRequestId
          ? {
              dialNumbers,
              dialedNumbers: dialNumbers.filter((phoneNumber) =>
                isLeadNumberDialed({ dialedList }, phoneNumber),
              ),
              isDialDisabled,
              showManualPass,
              isManualPassDisabled,
              onDial: this._onDial,
              onOpenManualPass: () => onOpenManualPass(previewRequestId),
            }
          : null,
      [
        previewRequestId,
        dialNumbers,
        dialedList,
        isDialDisabled,
        showManualPass,
        isManualPassDisabled,
        onOpenManualPass,
      ],
    );
    const editActions = useMemo<LeadInfoEditActions | null>(
      () =>
        editPermission === 'none' ? null : { onOpenEdit: onOpenLeadUpdate },
      [editPermission, onOpenLeadUpdate],
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
        editActions={editActions}
        loadRecording={this._loadRecording}
        loadLeadHistory={showLeadHistory ? this._loadLeadHistory : undefined}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />
    );
  }
}
