import type { Call as ICall } from '@ringcentral-integration/commons/interfaces/Call.interface';
import {
  isInbound,
  isRinging,
  sortByStartTime,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import {
  AccountInfo,
  ExtensionInfo,
  NumberFormatter,
  Presence,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ActivityMatcher,
  ContactMatcher,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  injectable,
  optional,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import { sort } from 'ramda';
import {
  ActiveCallControl,
  Call,
  CallMonitor as CallMonitorBase,
  PreinsertCall,
  Webphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { ToNumberMatched } from '@ringcentral-integration/micro-phone/src/app/services/Call';
import type { CallMonitorOptions } from '@ringcentral-integration/micro-phone/src/app/services/CallMonitor/CallMonitor.interface';
import { callEvents } from '@ringcentral-integration/micro-phone/src/app/services/CallMonitor/callEvents';

@injectable({
  name: 'CallMonitor',
})
export class CallMonitor extends CallMonitorBase {
  constructor(
    _accountInfo: AccountInfo,
    _storage: StoragePlugin,
    _presence: Presence,
    _extensionInfo: ExtensionInfo,
    _numberFormatter: NumberFormatter,
    _activeCallControl: ActiveCallControl,
    _preInsertCall: PreinsertCall,
    _webphone: Webphone,
    @optional() _contactMatcher?: ContactMatcher,
    @optional() _call?: Call,
    @optional() _activityMatcher?: ActivityMatcher,
    @optional('CallMonitorOptions')
    _callMonitorOptions?: CallMonitorOptions,
  ) {
    super(
      _accountInfo,
      _storage,
      _presence,
      _extensionInfo,
      _numberFormatter,
      _activeCallControl,
      _preInsertCall,
      _webphone,
      _contactMatcher,
      _call,
      _activityMatcher,
      _callMonitorOptions,
    );
  }

  override handleCalls(oldCalls: ICall[]) {
    if (
      this._call &&
      oldCalls.length &&
      !this.allCalls.length &&
      this._call.toNumberEntities?.length
    ) {
      this._call.cleanToNumberEntities();
    }

    const eventEmitter = (this as any)._eventEmitter;
    const entities: ToNumberMatched[] = this._call
      ? sort(sortByStartTime, this._call.toNumberEntities)
      : [];

    this.allCalls.forEach((call) => {
      const oldCallIndex = oldCalls.findIndex(
        (item) =>
          item.telephonySessionId === call.telephonySessionId ||
          (item.sessionId && item.sessionId === call.sessionId),
      );

      if (oldCallIndex === -1) {
        eventEmitter.emit(callEvents.newCall, call);
        if (isRinging(call)) {
          eventEmitter.emit(callEvents.callRinging, call);
        }
      } else {
        const oldCall = oldCalls[oldCallIndex];
        oldCalls.splice(oldCallIndex, 1);
        if (
          call.telephonyStatus !== oldCall.telephonyStatus ||
          (oldCall.from && oldCall.from.phoneNumber) !==
            (call.from && call.from.phoneNumber)
        ) {
          eventEmitter.emit(callEvents.callUpdated, call);
          if (call.telephonyStatus === 'CallConnected') {
            if (isInbound(call)) {
              this.inboundCallConnectedTrack();
            } else {
              this.outboundCallConnectedTrack();
            }
          }
        }
      }

      entities.forEach((entity) => {
        const index = entities.indexOf(entity);
        const toEntity =
          entity &&
          call.toMatches?.find((toMatch) => toMatch.id === entity.entityId);
        if (toEntity !== undefined) {
          this._removeMatched(index, entities);
          this.setMatchedData({
            sessionId: call.sessionId,
            toEntityId: toEntity.id,
          });
        }
      });
    });

    if (oldCalls.length > 0) {
      oldCalls.forEach((call) => {
        eventEmitter.emit(callEvents.callEnded, call);
      });

      if (process.env.THEME_SYSTEM === 'spring-ui') {
        this._activeCallControl.cleanCurrentWarmTransferData(oldCalls);
      }
    }
  }
}
