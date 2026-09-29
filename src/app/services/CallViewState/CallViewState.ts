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
  fromWatchValue,
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

    // `NewCall` fires for the stand-in session the local webphone reports
    // first, whose session id is the telephony session id. When the server
    // session replaces it no second `NewCall` fires, so the pick is carried
    // over by the telephony session id both share.
    fromWatchValue(this, () => this._matchLookupCallMonitor?.allCalls)
      .pipe(
        tap((calls) => {
          calls?.forEach(({ sessionId, telephonySessionId }) => {
            void this._matchedContactSelection?.carryOverCallSelection(
              telephonySessionId!,
              sessionId!,
            );
          });
        }),
        takeUntilAppDestroy
      )
      .subscribe();
  }

  /**
   * Only the RingEX call history route `/history/:id`. The base pattern is
   * not anchored, so it also matched the RingCX history route
   * `/agent/history/:id`: a CX call details page looked like an EX one for an
   * unknown call, and the EX call details guard then replaced the route with
   * `/dialer`, closing the call details side widget tab.
   */
  override inCallDetailRouteTelephonySessionId(): string | null {
    // The base keeps the router private; it is set before any computed read,
    // unlike a field of this subclass.
    const currentPath = this['_router']?.currentPath;
    const match = currentPath?.match(/^\/history\/(.+)/);
    return match ? match[1] : null;
  }

  override getExtraLogData(sessionId: string, telephonySessionId: string) {
    const extraLogData = super.getExtraLogData(sessionId, telephonySessionId);
    const callSelectionInfo = this._getCallSelectionInfo(
      sessionId,
      telephonySessionId,
    );
    if (!callSelectionInfo) {
      return extraLogData;
    }
    return { ...extraLogData, callSelectionInfo };
  }

  /**
   * Falls back to the telephony session id, the key a pick adopted on the
   * stand-in session carries until `carryOverCallSelection` moves it, so the
   * pick shows without waiting for that round trip.
   */
  private _getCallSelectionInfo(sessionId: string, telephonySessionId?: string) {
    const selection = this._matchedContactSelection;
    if (!selection) {
      return undefined;
    }
    const key = selection.getSelectedEntityId('call', sessionId)
      ? sessionId
      : telephonySessionId &&
          selection.getSelectedEntityId('call', telephonySessionId)
        ? telephonySessionId
        : undefined;
    if (!key && !selection.pendingOutbound) {
      return undefined;
    }
    const call = this._findCall(sessionId);
    if (!call) {
      return undefined;
    }
    // The same side the display resolves its name from.
    const matches = isInbound(call) ? call.fromMatches : call.toMatches;
    if (key) {
      return selection.resolveSelection('call', key, matches);
    }
    // A call can reach a client tab a moment before the pick it claims does,
    // so until then the pending pick stands in for it. Only a live call may
    // borrow it: older history records to the same number never claimed it.
    const isLiveCall = Boolean(
      this._matchLookupCallMonitor?.getCallBySessionId(sessionId),
    );
    return isInbound(call) || !isLiveCall
      ? undefined
      : selection.resolvePendingOutboundSelection(
          [call.to?.phoneNumber, call.to?.extensionNumber],
          matches,
        );
  }

  private _findCall(sessionId: string): CallWithMatches | undefined {
    return (
      this._matchLookupCallHistory?.callsInfo.map[sessionId] ??
      this._matchLookupCallMonitor?.getCallBySessionId(sessionId) ??
      undefined
    );
  }
}
