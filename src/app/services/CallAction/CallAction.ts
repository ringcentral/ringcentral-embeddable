import { ConnectivityMonitor } from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  injectable,
  optional,
  PortManager,
  Root,
  RouterPlugin,
} from '@ringcentral-integration/next-core';

import {
  ActiveCallControl,
  CallAction as CallActionBase,
  CallMonitor,
  PreinsertCall,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { CallActionOptions } from '@ringcentral-integration/micro-phone/src/app/services/CallAction/CallAction.interface';
import { ConferenceCallAction } from '@ringcentral-integration/micro-phone/src/app/services/CallAction/ConferenceCallAction';
import { SwitchCallConfirm } from '@ringcentral-integration/micro-phone/src/app/services/CallAction/SwitchCallConfirm';
import { CallViewState } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';

@injectable({
  name: 'CallAction',
})
// @ts-expect-error override private base method leaveCallingRoute
export class CallAction extends CallActionBase {
  constructor(
    root: Root,
    callViewState: CallViewState,
    conferenceCallAction: ConferenceCallAction,
    switchCallConfirm: SwitchCallConfirm,
    callMonitor: CallMonitor,
    preinsertCall: PreinsertCall,
    connectivityMonitor: ConnectivityMonitor,
    activeCallControl: ActiveCallControl,
    toast: Toast,
    router: RouterPlugin,
    portManager: PortManager,
    @optional() webphone?: Webphone,
    @optional('CallActionOptions')
    callActionOptions?: CallActionOptions,
  ) {
    super(
      root,
      callViewState,
      conferenceCallAction,
      switchCallConfirm,
      callMonitor,
      preinsertCall,
      connectivityMonitor,
      activeCallControl,
      toast,
      router,
      portManager,
      webphone,
      callActionOptions,
    );
  }

  /**
   * the base `fullScreenCallActionOpened$` combines
   * `displayCallTelephonyIdChange$` with a watch on
   * `fullScreenCallActionOpened`; when the server-backed call replaces the
   * preinsert (connecting) call, the display-call id emits while the combined
   * tuple still holds the stale `opened: false`, requesting a leave from the
   * calling page the app already early-navigated to. Skip leaving whenever
   * the live state says the call screen should stay open — such a request is
   * always a stale glitch emission.
   */
  private async leaveCallingRoute() {
    if (this.fullScreenCallActionOpened) {
      return;
    }
    return (CallActionBase.prototype as any)['leaveCallingRoute'].call(this);
  }

  /**
   * Restores the route behind a post-call side widget without closing its
   * post-call state.
   */
  async leaveCallingRouteForSideWidget(): Promise<void> {
    return (CallActionBase.prototype as any)['leaveCallingRoute'].call(this);
  }
}
