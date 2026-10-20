import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  delegate,
  injectable,
  PortManager,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import { t } from '../../components/LeadInfoPanel/i18n';
import { CxAuth } from '../CxAuth';
import { CxClient } from '../CxClient';
import { CxLeads, PHONE_DELIMETER } from '../CxLeads';
import type { Lead } from '../CxLeads';
import type { CxLeadDetails } from '../CxLeadInfo/CxLeadInfo.interface';
import type {
  CxLeadEditPatch,
  CxLeadEditRequest,
  CxLeadUpdatePermission,
} from './CxLeadEdit.interface';

/** `allowLeadUpdatesByCampaign` values. */
const PERMISSIONS: Readonly<Record<string, CxLeadUpdatePermission>> = {
  1: 'all',
  2: 'noPhone',
};

/**
 * Edits agents save on leads, as Agent One's "Update lead" dialog does.
 *
 * The server sends no notification after LEAD-UPDATE, and a call's lead comes
 * from its NEW-CALL baggage, which never changes. So the saved fields are
 * kept here, by lead id, and laid over the lead wherever it is shown, until
 * the agent logs out.
 */
@injectable({
  name: 'CxLeadEdit',
})
export class CxLeadEdit extends RcModule {
  constructor(
    private readonly _cxClient: CxClient,
    private readonly _cxAuth: CxAuth,
    private readonly _cxLeads: CxLeads,
    private readonly _toast: Toast,
    private readonly _portManager: PortManager,
  ) {
    super();
    if (this._portManager?.shared) {
      this._portManager.onServer(() => this._bindLogout());
    } else {
      this._bindLogout();
    }
  }

  @state
  edits: Record<string, CxLeadEditPatch> = {};

  @action
  private _setEdit(leadId: string, patch: CxLeadEditPatch): void {
    this.edits[leadId] = { ...this.edits[leadId], ...patch };
  }

  @action
  private _clearEdits(): void {
    this.edits = {};
  }

  /**
   * What the lead's campaign lets the agent change. A lead without a
   * campaign, such as an inbound call's, cannot be edited, as in Agent One.
   */
  getPermission(lead: CxLeadDetails | null): CxLeadUpdatePermission {
    if (!lead?.leadId || !lead.campaignId) {
      return 'none';
    }
    const byCampaign =
      this._cxAuth.agentPermissions?.allowLeadUpdatesByCampaign ?? {};
    const value = parseInt(byCampaign[String(lead.campaignId)], 10);
    return PERMISSIONS[value] ?? 'none';
  }

  /** The lead with the fields the agent saved on it. */
  applyEdits(lead: CxLeadDetails): CxLeadDetails {
    const patch = this.edits[lead.leadId];
    return patch ? { ...lead, ...patch } : lead;
  }

  /**
   * Saves a lead's fields and numbers. On success the fetched lead is
   * updated, the edit is kept for the lead's call, and the host is told.
   *
   * @returns whether the server took the update
   */
  @delegate('server')
  async updateLead({
    lead,
    phoneNumbers,
    fields,
  }: CxLeadEditRequest): Promise<boolean> {
    const result = await this._cxClient.updateLead({
      leadId: lead.leadId,
      phoneNumbers,
      fields,
    });
    if (!result?.ok) {
      this._toast.danger({
        message: result?.message || t('leadUpdateFailed'),
      });
      return false;
    }
    const destination = phoneNumbers.join(PHONE_DELIMETER);
    const { externId, ...changedFields } = fields;
    const patch: CxLeadEditPatch = {
      ...changedFields,
      destination,
      destinationE164: destination,
    };
    this._setEdit(lead.leadId, patch);
    this._updateFetchedLead(lead.leadId, patch);
    this._cxLeads.notifyLeadUpdated({ ...lead, ...patch } as Lead);
    this._toast.success({ message: t('leadUpdated') });
    return true;
  }

  private _updateFetchedLead(leadId: string, patch: CxLeadEditPatch): void {
    const fetchedLead = this._cxLeads.leads.find(
      (item) => String(item.leadId) === leadId,
    );
    if (fetchedLead) {
      this._cxLeads.updateLead(fetchedLead.leadId, patch);
    }
  }

  private _bindLogout(): void {
    this._cxAuth.beforeAgentLogout(() => this._clearEdits());
  }
}
