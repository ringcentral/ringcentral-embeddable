import { callDirection } from "@ringcentral-integration/commons/enums/callDirections";
import type { Entity } from "@ringcentral-integration/commons/interfaces/Entity.interface";
import {
  CALLING_ROUTE_PATH,
  CallLogger,
} from "@ringcentral-integration/micro-phone/src/app/services";
import { CallsListViewSpring } from "@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring";
import { CallViewState } from "@ringcentral-integration/micro-phone/src/app/views/CallView/services";
import {
  action,
  autobind,
  delegate,
  inject,
  injectable,
  optional,
  RcViewModule,
  Route as RouterRoute,
  RouterPlugin,
  type RouteComponentProps,
  state,
  Switch,
  useConnector,
  useLocation,
} from "@ringcentral-integration/next-core";
import React, { useEffect, useRef } from "react";

import { t } from "../../i18n";
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
import {
  type SideWidgetContentHandle,
  SideWidgetView,
} from "../SideWidgetView";

import { LogCallPage } from "./LogCallPage";

const LOG_CALL_PATH_PREFIX = "/log/call/";
const LOG_CALL_ROUTE_PATH = "/log/call/:callSessionId";

type LogCallPageProps = RouteComponentProps<{ callSessionId: string }> & {
  /** Replaces going back in the router, for a page not opened by a route. */
  onClose?: () => void;
};

@injectable({
  name: "LogCallView",
})
export class LogCallView extends RcViewModule {
  /** The log page path shown in the tab opened from the call page. */
  @state
  private _callPageLogPath: string | null = null;

  private readonly _callPageLogHandle: SideWidgetContentHandle | null;

  constructor(
    @inject(CallLogger) private _callLogger: EmbeddableCallLogger,
    private _thirdParty: ThirdParty,
    private _router: RouterPlugin,
    private _callsListView: CallsListViewSpring,
    private _callViewState: CallViewState,
    @optional() private _sideWidgetView?: SideWidgetView
  ) {
    super();
    this._callPageLogHandle =
      this._sideWidgetView?.createContent({
        id: "call-page-log-call",
        name: t("logCall"),
        getName: () => t("logCall"),
        scope: "contact",
        onBack: () => this._closeCallPageLog(),
        onClose: () => this._setCallPageLogPath(null),
        view: this.CallPageLogCall,
      }) ?? null;
  }

  /**
   * Opens a log page path, such as `/log/call/<sessionId>?source=ringcx`.
   *
   * Leaving the call page closes the call on it and blanks the main column, so
   * from the call page the log page opens in the side widget while the call
   * page stays in the main column.
   *
   * @returns Whether the path was a log call page.
   */
  @delegate("server")
  async openLogCallPage(path: string): Promise<boolean> {
    if (!path.startsWith(LOG_CALL_PATH_PREFIX)) {
      return false;
    }
    if (
      this._callPageLogHandle &&
      this._router.currentPath === CALLING_ROUTE_PATH
    ) {
      this._setCallPageLogPath(path);
      this._sideWidgetView!.openContent(this._callPageLogHandle);
      return true;
    }
    this._closeCallPageLog();
    await this._router.push(path);
    return true;
  }

  @action
  private _setCallPageLogPath(path: string | null): void {
    this._callPageLogPath = path;
  }

  /** The routed log page replaces the call page's tab. */
  private _closeCallPageLog(): void {
    if (this._callPageLogHandle && this._callPageLogPath) {
      void this._sideWidgetView!.closeTabFromPanel(
        this._callPageLogHandle.options.id
      );
    }
  }

  /**
   * Renders the call page's log page at its log route, which the router is
   * not on, so the page reads its params as usual.
   */
  @autobind
  private CallPageLogCall(): React.ReactElement | null {
    const location = useLocation();
    const path = useConnector(() => this._callPageLogPath);
    if (!path) {
      return null;
    }
    const [pathname, search = ""] = path.split("?");
    return (
      <Switch
        location={{
          ...location,
          pathname,
          search: search ? `?${search}` : "",
        }}
      >
        <RouterRoute
          path={LOG_CALL_ROUTE_PATH}
          render={(props) => (
            <this.component
              {...(props as LogCallPageProps)}
              onClose={() => this._closeCallPageLog()}
            />
          )}
        />
      </Switch>
    );
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

  private async viewLog(
    call: CompatibleCall,
    formData: UnknownRecord
  ): Promise<void> {
    await this._callLogger.logCall({
      call,
      // Same contact as Save, so the host gets fromEntity/toEntity like the
      // history item's "View log details".
      contact: this.getSelectedContact(call, formData),
      redirect: true,
      triggerType: "viewLog",
    });
  }

  component({ location, match, onClose }: LogCallPageProps): React.ReactElement {
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
    const goBack = (): void => {
      if (onClose) {
        onClose();
        return;
      }
      this._router.goBack();
    };
    const { current: handlers } = useRef({
      onBack: goBack,
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
          goBack();
        } finally {
          this.setSaving(false);
        }
      },
      onViewLog: async (formData: UnknownRecord) => {
        const currentCall = callRef.current;
        if (!currentCall) {
          return;
        }
        await this.viewLog(currentCall, formData);
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
