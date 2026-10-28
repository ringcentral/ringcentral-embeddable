import {
  computed,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  useConnector,
  useParams,
  type UIFunctions,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import {
  IconButton,
  ListItem,
  ListItemText,
} from '@ringcentral/spring-ui';
import {
  HoldMd,
  MuteMd,
  MicrophoneOffFilledMd,
  MicrophoneMd,
  CallOffMd,
} from '@ringcentral/spring-icon';
import React, { useRef } from 'react';

import { CxCall } from '../../services/CxCall';
import { CxAuth } from '../../services/CxAuth';
import { CxCallMonitor } from '../../services/CxCallMonitor';
import { CxActiveCallControl } from '../../services/CxActiveCallControl';
import { CxIntegratedSoftphone } from '../../services/CxIntegratedSoftphone';
import { CxAgentSession } from '../../services/CxAgentSession';
import type { CxCallData } from '../../services/CxCallDataSource';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import { cxPath } from '../../routes';
import type {
  CxActiveCallListViewOptions,
  CxActiveCallListViewUIProps,
  CxActiveCallListViewUIFunctions,
} from './CxActiveCallListView.interface';
import i18n from './i18n';

/**
 * CxActiveCallListView - Display active call sessions during warm transfer
 * Shows all participants (everyone, caller/callee, agent, transfer targets)
 * with per-session call controls (hangup, hold, mute)
 */
@injectable({
  name: 'CxActiveCallListView',
})
class CxActiveCallListView extends RcViewModule {
  constructor(
    private _cxCall: CxCall,
    private _cxAuth: CxAuth,
    private _cxCallMonitor: CxCallMonitor,
    private _cxActiveCallControl: CxActiveCallControl,
    private _cxIntegratedSoftphone: CxIntegratedSoftphone,
    private _cxAgentSession: CxAgentSession,
    private _router: RouterPlugin,
    @optional('CxActiveCallListViewOptions')
    private _options?: CxActiveCallListViewOptions,
  ) {
    super();
  }

  get callId(): string {
    return this._cxCall.activityCallId;
  }

  @computed((that: CxActiveCallListView) => [
    that.callId,
    that._cxCallMonitor.callIds,
    that._cxCallMonitor.otherCallIds,
    that._cxCallMonitor.callsMapping,
    that._cxAuth.agentId,
  ])
  get callList(): CxCallData[] {
    const { callIds, otherCallIds, callsMapping } = this._cxCallMonitor;
    return this._cxCallMonitor.getActiveCallList(
      callIds,
      otherCallIds,
      callsMapping,
      this.callId,
    ) as unknown as CxCallData[];
  }

  onHangup(call: CxCallData): void {
    this._cxActiveCallControl.hangupSession({
      sessionId: call.session!.sessionId,
    });
  }

  onHold(call: CxCallData): void {
    this._cxActiveCallControl.holdSession({
      sessionId: call.session!.sessionId,
      state: true,
    });
  }

  onUnHold(call: CxCallData): void {
    this._cxActiveCallControl.holdSession({
      sessionId: call.session!.sessionId,
      state: false,
    });
  }

  getUIProps(callId: string): CxActiveCallListViewUIProps {
    this._cxCall.activityCallId = callId;
    return {
      callList: this.callList,
      isOnMute: this._cxIntegratedSoftphone.muteActive,
      showMuteButton: this._cxAgentSession.isIntegratedSoftphone,
      userName: this._cxAuth.agentSettings?.username ?? '',
      isInbound: this._cxCall.isInbound,
    };
  }

  getUIFunctions(): UIFunctions<CxActiveCallListViewUIFunctions> {
    return {
      goBack: () => this._router.replace(cxPath.call(this.callId)),
      onHangup: (call: CxCallData) => this.onHangup(call),
      onHold: (call: CxCallData) => this.onHold(call),
      onUnHold: (call: CxCallData) => this.onUnHold(call),
      onMute: () => this._cxActiveCallControl.mute(),
      onUnmute: () => this._cxActiveCallControl.unmute(),
    };
  }

  component() {
    const params = useParams<{ id?: string }>();
    const callId = params?.id ?? '';
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const {
      callList,
      isOnMute,
      showMuteButton,
      userName,
      isInbound,
    } = useConnector(() => this.getUIProps(callId));

    if (callList.length < 2) {
      return (
        <>
          <AppHeaderNav override>
            <PageHeader onBackClick={uiFunctions.goBack}>
              {t('activeCall')}
            </PageHeader>
          </AppHeaderNav>
          <div className="flex-1" />
          <AppFooterNav />
        </>
      );
    }

    const [everyoneCaller, ownCall, ...transferCalls] = callList;

    return (
      <>
        <AppHeaderNav override>
          <PageHeader onBackClick={uiFunctions.goBack}>
            {t('activeCall')}
          </PageHeader>
        </AppHeaderNav>

        <div className="flex-1 overflow-y-auto">
          {/* Everyone row */}
          <ListItem hoverable={false} data-sign="callItem" size="large">
            <ListItemText primary={t('everyone')} />
            <IconButton
              className="mr-1"
              symbol={CallOffMd}
              onClick={() => uiFunctions.onHangup(everyoneCaller)}
              size="small"
              variant="contained"
              color="danger"
              data-sign="hangupEveryone"
            />
          </ListItem>

          {/* Caller/Callee row */}
          <ListItem hoverable={false} data-sign="callItem" size="large" className="pl-8">
            <ListItemText
              primary={`${formatPhoneNumber({ phoneNumber: everyoneCaller.session?.phone ?? '' })}(${t(isInbound ? 'caller' : 'callee')})`}
            />
            <IconButton
              className="mr-1"
              symbol={HoldMd}
              onClick={() =>
                everyoneCaller.isHold
                  ? uiFunctions.onUnHold(everyoneCaller)
                  : uiFunctions.onHold(everyoneCaller)
              }
              size="small"
              variant="inverted"
              color={everyoneCaller.isHold ? 'warning' : 'neutral'}
              data-sign="holdCaller"
            />
            <IconButton
              className="mr-1"
              symbol={CallOffMd}
              onClick={() => uiFunctions.onHangup(everyoneCaller)}
              size="small"
              variant="contained"
              color="danger"
              data-sign="hangupCaller"
            />
          </ListItem>

          {/* Agent (Me) row */}
          <ListItem hoverable={false} data-sign="callItem" size="large" className="pl-8">
            <ListItemText
              primary={`${(ownCall as any).agentName || userName || ''}(${t('me')})`}
            />
            {showMuteButton && (
              <IconButton
                symbol={isOnMute ? MicrophoneOffFilledMd : MicrophoneMd}
                onClick={() =>
                  isOnMute ? uiFunctions.onUnmute() : uiFunctions.onMute()
                }
                size="small"
                variant="inverted"
                color={isOnMute ? 'danger' : 'neutral'}
                data-sign="muteButton"
                className="mr-1"
              />
            )}
            <IconButton
              className="mr-1"
              symbol={CallOffMd}
              onClick={() => uiFunctions.onHangup(ownCall)}
              size="small"
              variant="contained"
              color="danger"
              data-sign="hangupMe"
            />
          </ListItem>

          {/* Transfer call rows */}
          {transferCalls.map((callItem, index) => {
            const destination =
              callItem.session?.transferSessions?.[callItem.session.sessionId]
                ?.destination;
            return (
              <ListItem
                key={callItem.session?.sessionId ?? index}
                hoverable={false}
                data-sign="callItem"
                size="large"
                className="pl-8"
              >
                <ListItemText
                  primary={formatPhoneNumber({ phoneNumber: destination ?? '' })}
                />
                <IconButton
                  className="mr-1"
                  symbol={HoldMd}
                  onClick={() =>
                    callItem.isHold
                      ? uiFunctions.onUnHold(callItem)
                      : uiFunctions.onHold(callItem)
                  }
                  size="small"
                  variant="inverted"
                  color={callItem.isHold ? 'warning' : 'neutral'}
                  data-sign="holdTransfer"
                />
                <IconButton
                  className="mr-1"
                  symbol={CallOffMd}
                  onClick={() => uiFunctions.onHangup(callItem)}
                  size="small"
                  variant="contained"
                  color="danger"
                  data-sign="hangupTransfer"
                />
              </ListItem>
            );
          })}
        </div>
        <AppFooterNav />
      </>
    );
  }
}

export { CxActiveCallListView };
