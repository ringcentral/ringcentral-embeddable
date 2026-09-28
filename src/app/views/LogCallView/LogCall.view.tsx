import { callDirection } from "@ringcentral-integration/commons/enums/callDirections";
import type { Entity } from "@ringcentral-integration/commons/interfaces/Entity.interface";
import { CallLogger } from "@ringcentral-integration/micro-phone/src/app/services";
import { CallsListViewSpring } from "@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring";
import { CallViewState } from "@ringcentral-integration/micro-phone/src/app/views/CallView/services";
import {
  action,
  delegate,
  inject,
  injectable,
  RcViewModule,
  RouterPlugin,
  type RouteComponentProps,
  state,
  useConnector,
} from "@ringcentral-integration/next-core";
import React, { useEffect, useRef } from "react";

import type {
  CompatibleCall,
  EmbeddableCallLogger,
} from "../../services/CallLogger";
import {
  callLogSourceRegistry,
  RINGCX_CALL_LOG_SOURCE,
} from "../../services/CallLogger/CallLogSourceRegistry";
import { ThirdParty } from "../../services/ThirdParty";
import type { ThirdPartyCall, UnknownRecord } from "../../services/ThirdParty";

import { LogCallPage } from "./LogCallPage";

@injectable({
  name: "LogCallView",
})
export class LogCallView extends RcViewModule {
  constructor(
    @inject(CallLogger) private _callLogger: EmbeddableCallLogger,
    private _thirdParty: ThirdParty,
    private _router: RouterPlugin,
    private _callsListView: CallsListViewSpring,
    private _callViewState: CallViewState
  ) {
    super();
  }

  @state
  private currentCall: CompatibleCall | null = null;

  /** The route id `currentCall` was loaded for. */
  @state
  private currentCallRouteId: string | null = null;

  @state
  private loading = false;

  @state
  private saving = false;

  @action
  private setCurrentCall(
    call: CompatibleCall | null,
    routeId: string | null = null
  ): void {
    this.currentCall = call;
    this.currentCallRouteId = call ? routeId : null;
  }

  /**
   * Stores the call on the server port. The page loads it on the client that
   * renders it, but the shared worker needs it too: the side widget resolves
   * the log page's contact from it there, and without it would keep the
   * previous contact's tabs and hand them back on its next tab update.
   */
  @delegate('server')
  private async _storeCurrentCall(
    call: CompatibleCall | null,
    routeId: string | null = null,
  ): Promise<void> {
    this.setCurrentCall(call, routeId);
  }

  /**
   * The call loaded for a log page route, or null while it is loading or
   * when the page shows another call.
   *
   * @param routeId - The `callSessionId` route param of the log page.
   */
  getLoadedCall(routeId: string): CompatibleCall | null {
    return this.currentCallRouteId === routeId ? this.currentCall : null;
  }

  @action
  private setLoading(loading: boolean): void {
    this.loading = loading;
  }

  @action
  private setSaving(saving: boolean): void {
    this.saving = saving;
  }

  private async loadCall(sessionId: string, source?: string): Promise<void> {
    this.setLoading(true);
    await this._storeCurrentCall(null);
    try {
      const decodedId = decodeURIComponent(sessionId);
      let call: CompatibleCall | null = null;
      if (source) {
        call = await callLogSourceRegistry.getCall(source, decodedId);
        if (!call && decodedId !== sessionId) {
          call = await callLogSourceRegistry.getCall(source, sessionId);
        }
      }
      if (!call) {
        call = await this._callLogger.getCall(decodedId, decodedId);
        if (!call && decodedId !== sessionId) {
          call = await this._callLogger.getCall(sessionId, sessionId);
        }
      }
      if (!call && !source) {
        call = await callLogSourceRegistry.getCall(RINGCX_CALL_LOG_SOURCE, decodedId);
      }
      await this._storeCurrentCall(call, sessionId);
    } catch (error) {
      this.logger.error('LogCall load failed', error);
    } finally {
      this.setLoading(false);
    }
  }

  private getSelectedContact(
    call: CompatibleCall,
    formData: UnknownRecord
  ): Entity | undefined {
    const matches =
      call.direction === callDirection.inbound
        ? call.fromMatches
        : call.toMatches;
    return (
      matches?.find(({ id }) => id === formData.contactId) ??
      call.callSelectionInfo?.displayedSelection
    );
  }

  private getCurrentCallWithExtraLogData(): CompatibleCall | null {
    const call = this.currentCall;
    if (!call) {
      return null;
    }
    const { callSelectionInfo: _staleSelection, ...callWithoutSelection } =
      call;
    const extraLogData = this._callViewState.getExtraLogData(
      call.sessionId ?? "",
      call.telephonySessionId ?? ""
    );
    return { ...callWithoutSelection, ...extraLogData };
  }

  private async viewLog(call: CompatibleCall): Promise<void> {
    await this._callLogger.logCall({
      call,
      redirect: true,
      triggerType: "viewLog",
    });
  }

  component({
    location,
    match,
  }: RouteComponentProps<{ callSessionId: string }>): React.ReactElement {
    const sessionId = match.params.callSessionId;
    const rawSource = new URLSearchParams(location?.search || "").get("source");
    const source =
      rawSource && rawSource !== "undefined" && rawSource !== "null"
        ? rawSource
        : undefined;
    const { call, customizedPage, loading, logButtonTitle, saving } =
      useConnector(() => ({
        call: this.getCurrentCallWithExtraLogData(),
        customizedPage: this._thirdParty.customizedLogCallPage,
        loading: this.loading,
        logButtonTitle: this._thirdParty.callLoggerTitle,
        saving: this.saving,
      }));
    useEffect(() => {
      void this.loadCall(sessionId, source);
    }, [sessionId, source]);
    const callRef = useRef(call);
    callRef.current = call;
    const { current: handlers } = useRef({
      onBack: () => this._router.goBack(),
      onButtonClick: (buttonId: string, formData: UnknownRecord) => {
        void this._thirdParty.onClickButtonInCustomizedPage(
          buttonId,
          "button",
          formData
        );
      },
      onFormDataChange: (formData: UnknownRecord, changedKeys: string[]) => {
        if (!callRef.current) {
          return;
        }
        void this._thirdParty.onCustomizedLogCallPageInputChanged({
          call: callRef.current as ThirdPartyCall,
          formData,
          keys: changedKeys,
        });
      },
      onSubmit: async (formData: UnknownRecord) => {
        const currentCall = callRef.current;
        if (!currentCall || this.saving) {
          return;
        }
        this.setSaving(true);
        try {
          await this._callLogger.logCall({
            call: currentCall,
            contact: this.getSelectedContact(currentCall, formData),
            formData,
            note: formData.note,
            redirect: true,
            triggerType: "logForm",
          });
          this._router.goBack();
        } finally {
          this.setSaving(false);
        }
      },
      onViewLog: async () => {
        const currentCall = callRef.current;
        if (!currentCall) {
          return;
        }
        await this.viewLog(currentCall);
      },
    });
    return (
      <LogCallPage
        call={call}
        customizedPage={customizedPage}
        loading={loading}
        logButtonTitle={logButtonTitle}
        saving={saving}
        useActionsHandler={this._callsListView.useActionsHandler}
        useCallHistoryItemInfo={this._callsListView.useCallHistoryItemInfo}
        {...handlers}
      />
    );
  }
}
