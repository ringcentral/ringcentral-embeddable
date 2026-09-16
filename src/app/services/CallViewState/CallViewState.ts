import type { Call as ICall } from '@ringcentral-integration/commons/interfaces/Call.interface';
import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import { isInbound } from '@ringcentral-integration/commons/lib/callLogHelpers';
import {
  CallHistory,
  CallLogTasks,
  CallMonitor,
} from '@ringcentral-integration/micro-phone/src/app/services';
import { CallViewState as CallViewStateBase } from '@ringcentral-integration/micro-phone/src/app/views/CallView/services';
import {
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  takeUntilAppDestroy,
} from '@ringcentral-integration/next-core';
import { tap } from 'rxjs';

import { MatchedContactSelection } from '../MatchedContactSelection';

type CallWithMatches = ICall & {
  fromMatches?: Entity[];
  toMatches?: Entity[];
};

/**
 * Adds the user's matched-contact pick to the extra log data the framework
 * merges onto calls and call-history entries.
 *
 * `getExtraLogData` is the single funnel for both surfaces — the call history
 * list reads it through `CallsListView.latestCalls` and the call detail page
 * through `callDetailCallLog` — so overriding it here covers both.
 *
 * Upstream CRM apps produce `callSelectionInfo` by overriding
 * `CallLogTasks.callSelectionMap`. Embeddable has no CRM task store of its own,
 * and registering the base `CallLogTasks` would also pull in its click-to-dial
 * listeners, `fetchAndUpdateTask` and CRM log filters. If embeddable ever
 * registers a real `CallLogTasks`, move the selection map onto it — the
 * contract consumed downstream is identical.
 */
@injectable({
  name: 'CallViewState',
})
export class CallViewState extends CallViewStateBase {
  /**
   * The base constructor is redeclared in full and passed straight through:
   * re-applying `@injectable` to a subclass discards the base's parameter
   * decorators, so without this the optional `CallLogTasks` would become a
   * required binding and the container would fail to resolve.
   */
  constructor(
    router: RouterPlugin,
    portManager: PortManager,
    callMonitor: CallMonitor,
    callHistory: CallHistory,
    matchedContactSelection: MatchedContactSelection,
    @optional() callLogTasks?: CallLogTasks
  ) {
    super(router, portManager, callMonitor, callHistory, callLogTasks);
    this._matchedContactSelection = matchedContactSelection;
    this._matchLookupCallHistory = callHistory;
    this._matchLookupCallMonitor = callMonitor;

    if (portManager.shared) {
      portManager.onServer(() => this._bindOutboundSelectionHandoff());
    } else {
      this._bindOutboundSelectionHandoff();
    }
  }

  private readonly _matchedContactSelection: MatchedContactSelection;

  private readonly _matchLookupCallHistory: CallHistory;

  private readonly _matchLookupCallMonitor: CallMonitor;

  /**
   * Carries a pick made on a record onto the call placed from it, so dialling
   * from a call history row keeps the contact the user chose there.
   *
   * The selection is claimed on `NewCall` rather than read lazily so it lands
   * on exactly one session and cannot leak into later, unrelated calls.
   */
  private _bindOutboundSelectionHandoff() {
    this._matchLookupCallMonitor
      ?.addListener('NewCall')
      .pipe(
        tap((call: CallWithMatches) => {
          if (!this._matchedContactSelection?.pendingOutbound) {
            return;
          }
          if (isInbound(call)) {
            return;
          }
          void this._matchedContactSelection.adoptPendingOutbound(
            call.sessionId!,
            [call.to?.phoneNumber, call.to?.extensionNumber],
          );
        }),
        takeUntilAppDestroy
      )
      .subscribe();
  }

  override getExtraLogData(sessionId: string, telephonySessionId: string) {
    const extraLogData = super.getExtraLogData(sessionId, telephonySessionId);
    const callSelectionInfo = this._getCallSelectionInfo(sessionId);
    if (!callSelectionInfo) {
      return extraLogData;
    }
    return { ...extraLogData, callSelectionInfo };
  }

  private _getCallSelectionInfo(sessionId: string) {
    const selection = this._matchedContactSelection;
    if (!selection?.getSelectedEntityId('call', sessionId)) {
      return undefined;
    }
    const call = this._findCall(sessionId);
    if (!call) {
      return undefined;
    }
    // The same side the display resolves its name from.
    const matches = isInbound(call) ? call.fromMatches : call.toMatches;
    return selection.resolveSelection('call', sessionId, matches);
  }

  private _findCall(sessionId: string): CallWithMatches | undefined {
    return (
      this._matchLookupCallHistory?.callsInfo.map[sessionId] ??
      this._matchLookupCallMonitor?.getCallBySessionId(sessionId) ??
      undefined
    );
  }
}
