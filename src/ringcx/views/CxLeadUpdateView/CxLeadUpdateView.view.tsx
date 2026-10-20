import {
  action,
  injectable,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React from 'react';

import { LeadUpdateForm } from '../../components/LeadInfoPanel';
import type { LeadUpdateSaveRequest } from '../../components/LeadInfoPanel';
import { CxLeadEdit } from '../../services/CxLeadEdit';
import type { CxLeadDetails } from '../../services/CxLeadInfo';

/**
 * The lead being edited, as the Lead tab showed it when Edit was pressed.
 */
export interface CxLeadUpdateTarget {
  lead: CxLeadDetails;
  phoneNumbers: string[];
  auxLabels: Array<string | undefined>;
}

export interface CxLeadUpdateViewProps {
  /** Set while no tab bar shows the tab, so the form shows its own header. */
  showCloseButton: boolean;
  /** Closes the Update lead side widget tab. */
  onClose: () => void;
}

/**
 * The RingCX Update lead side widget tab. It edits the lead the Lead tab
 * showed when Edit was pressed, so a call starting or ending, or the Lead
 * tab moving on to another lead, does not take the draft away.
 */
@injectable({
  name: 'CxLeadUpdateView',
})
export class CxLeadUpdateView extends RcViewModule {
  constructor(private readonly _cxLeadEdit: CxLeadEdit) {
    super();
  }

  @state
  target: CxLeadUpdateTarget | null = null;

  @action
  setTarget(target: CxLeadUpdateTarget | null): void {
    this.target = target;
  }

  private readonly _onSave = async (
    request: LeadUpdateSaveRequest,
  ): Promise<boolean> => {
    const lead = this.target?.lead;
    if (!lead) {
      return false;
    }
    return !!(await this._cxLeadEdit.updateLead({ lead, ...request }));
  };

  component({ showCloseButton, onClose }: CxLeadUpdateViewProps) {
    const { target, canEditPhone } = useConnector(() => ({
      target: this.target,
      canEditPhone:
        this._cxLeadEdit.getPermission(this.target?.lead ?? null) === 'all',
    }));
    if (!target) {
      return null;
    }
    return (
      <LeadUpdateForm
        key={target.lead.leadId}
        showHeader={showCloseButton}
        lead={target.lead}
        phoneNumbers={target.phoneNumbers}
        auxLabels={target.auxLabels}
        canEditPhone={canEditPhone}
        onClose={onClose}
        onSave={this._onSave}
      />
    );
  }
}
