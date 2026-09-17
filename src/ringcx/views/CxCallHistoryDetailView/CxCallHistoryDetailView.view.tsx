import type { UIFunctions, UIProps } from '@ringcentral-integration/next-core';
import {
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  useConnector,
  useParams,
} from '@ringcentral-integration/next-core';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import React, { useEffect, useRef } from 'react';

import { CxAuth } from '../../services/CxAuth';
import { CxCall } from '../../services/CxCall';
import { CxCallHistory } from '../../services/CxCallHistory';
import { canDialHistoryCall } from '../../services/CxCallHistory/can-dial-history-call';
import { CallHistoryDetailPanel } from '../../components/CallHistoryDetailPanel';
import { callDirection } from '../../enums';
import { t as translate } from './i18n';

import type {
  CxCallHistoryDetailViewOptions,
  CxCallHistoryDetailViewUIProps,
  CxCallHistoryDetailViewUIFunctions,
} from './CxCallHistoryDetailView.interface';

/**
 * Display state for the history detail card.
 *
 * Mirrors eag's `getSelectedCallState`: completed / queued / dropped legs show
 * as `CALL-ENDED`; otherwise the raw dialog state is shown.
 */
function getHistoryCallState(
  dialogState?: string,
  termReason?: string,
): string | undefined {
  if (!dialogState) {
    return undefined;
  }
  if (
    dialogState === 'QUEUED' ||
    dialogState === 'COMPLETE' ||
    (dialogState === 'ACTIVE' && termReason === 'DROP')
  ) {
    return 'CALL-ENDED';
  }
  return dialogState;
}

/**
 * CxCallHistoryDetailView - Read-only call detail view
 *
 * Every field comes from the server history record, so there is no local
 * fallback to reconstruct: a row the endpoint does not return is genuinely not
 * found.
 */
@injectable({
  name: 'CxCallHistoryDetailView',
})
class CxCallHistoryDetailView extends RcViewModule {
  private _params: { id?: string } = {};

  constructor(
    private _cxCallHistory: CxCallHistory,
    private _cxAuth: CxAuth,
    private _cxCall: CxCall,
    private _router: RouterPlugin,
    private _toast: Toast,
    @optional('CxCallHistoryDetailViewOptions')
    private _options?: CxCallHistoryDetailViewOptions,
  ) {
    super();
  }

  goBack() {
    this._router.goBack();
  }

  goToCallLogPage(method: 'create' | 'update') {
    const callId = this._params.id;
    if (!callId) {
      return;
    }
    this._router.push(`/history/${callId}/callLog/${method}`);
  }

  /**
   * Place a callback from a history detail, matching eag's
   * `allowHistoricalDialing` gate and idle-call check.
   */
  async dialHistoryCall(phoneNumber: string): Promise<void> {
    if (
      !canDialHistoryCall({
        phoneNumber,
        allowHistoricalDialing:
          this._cxAuth.agentPermissions?.allowHistoricalDialing,
        isIdle: this._cxCall.isIdle,
      })
    ) {
      return;
    }
    await this._cxCall.dialout(phoneNumber, {
      skipParse: phoneNumber.endsWith('@RC_EXT'),
    });
  }

  copyNumber(phoneNumber: string): void {
    if (!phoneNumber) {
      return;
    }
    void navigator.clipboard.writeText(phoneNumber).then(
      () => {
        this._toast.success({ message: translate('numberCopied') });
      },
      () => {
        this.logger.warn('copyNumber failed');
      },
    );
  }

  copyCallId(callId: string): void {
    if (!callId) {
      return;
    }
    void navigator.clipboard.writeText(callId).then(
      () => {
        this._toast.success({ message: translate('callIdCopied') });
      },
      () => {
        this.logger.warn('copyCallId failed');
      },
    );
  }

  /**
   * Returns reactive UI state for the view
   */
  getUIProps(callId?: string): UIProps<CxCallHistoryDetailViewUIProps> {
    const callDetail = this._cxCallHistory.getCallById(callId);
    const isInbound = callDetail?.direction === callDirection.inbound;
    const isLoading = this._cxCallHistory.isLoading;
    return {
      callDetail,
      callMeta: {
        dnis: callDetail?.dnis,
        queueName: callDetail?.queueName,
        campaignName: callDetail?.campaignName,
        callId: callDetail?.uii,
        termParty: callDetail?.termParty,
        termReason: callDetail?.termReason,
        disposition: callDetail?.disposition,
        durationMs: callDetail?.durationMs,
        recordingUrl: callDetail?.recordingUrl,
        outboundType: callDetail?.outboundType,
        dialogState: callDetail?.dialogState,
        callState: getHistoryCallState(
          callDetail?.dialogState,
          callDetail?.termReason,
        ),
      },
      isInbound,
      isActiveCall: !!callDetail?.isActive,
      isLoading,
      // Only a genuine miss, not a page that has yet to arrive.
      callNotFound: !callDetail && !isLoading,
      dialableNumber: callDetail?.dialableNumber,
      canDial: !!this._cxAuth.agentPermissions?.allowHistoricalDialing,
      isDialDisabled: !this._cxCall.isIdle,
      isDisposed: !!callDetail?.isDisposed,
    };
  }

  /**
   * Returns stable UI callback functions for the view
   */
  getUIFunctions(): UIFunctions<CxCallHistoryDetailViewUIFunctions> {
    return {
      onBack: () => this.goBack(),
      onDial: (phoneNumber: string) => {
        void this.dialHistoryCall(phoneNumber);
      },
      onCopyNumber: (phoneNumber: string) => {
        this.copyNumber(phoneNumber);
      },
      onCopyCallId: (callId: string) => {
        this.copyCallId(callId);
      },
      onOpenCallLog: () => {
        const callDetail = this._cxCallHistory.getCallById(this._params.id);
        this.goToCallLogPage(callDetail?.isDisposed ? 'update' : 'create');
      },
    };
  }

  component() {
    this._params = useParams<{ id?: string }>();
    const { current: uiFunctions } = useRef(this.getUIFunctions());
    // Covers a deep link or a worker restart, where this view can mount before
    // any page has been loaded. A no-op once the list is populated.
    useEffect(() => {
      void this._cxCallHistory.fetchFirstPage();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const uiProps = useConnector(() => this.getUIProps(this._params.id));
    useEffect(() => {
      if (uiProps.callDetail) {
        this._cxCallHistory.matchCalls([uiProps.callDetail]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uiProps.callDetail?.id]);
    return <CallHistoryDetailPanel {...uiProps} {...uiFunctions} />;
  }
}

export { CxCallHistoryDetailView };
