import { Call as CallBase } from '@ringcentral-integration/commons/modules/Call';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { callErrors } from '@ringcentral-integration/commons/modules/Call/callErrors';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';
import { ringoutErrors } from '@ringcentral-integration/commons/modules/Ringout/ringoutErrors';

const ANONYMOUS = 'anonymous';
const REFRESH_TOKEN_EXPIRED = 'Refresh token has expired';

@Module({
  name: 'NewCall',
  deps: [],
})
export class Call extends CallBase {
  /**
   * Fix for https://github.com/ringcentral/ringcentral-js-widgets/issues/1851
   *
   * `CallBase.call()` guards its fallback alert with
   * `!this._deps.availabilityMonitor.checkIfHAError(error)`. `checkIfHAError` is
   * async, so `!<Promise>` is always `false` and the `internalError` alert is
   * never presented when an `AvailabilityMonitor` is registered, which is the
   * case here. Uncategorized failures (transport timeouts, 5xx, ...) then fail
   * silently.
   *
   * Rather than duplicating the whole `call()` body, this re-checks the same
   * branches the base class uses and presents the missing alert with the HA
   * check properly awaited. `allowDuplicates: false` keeps this a no-op if
   * commons later fixes the base implementation.
   */
  override async call(params: any) {
    try {
      return await super.call(params);
    } catch (error: any) {
      if (await this._shouldAlertInternalError(error)) {
        this._deps.alert.danger({
          message: callErrors.internalError,
          payload: error,
          allowDuplicates: false,
        });
      }
      throw error;
    }
  }

  /**
   * Whether the base `call()` fell into the branch broken by the missing
   * `await`, i.e. it presented no alert at all for this error.
   */
  protected async _shouldAlertInternalError(error: any) {
    const { availabilityMonitor } = this._deps;
    // without an availability monitor the base class already alerts correctly
    if (!availabilityMonitor) {
      return false;
    }
    // validate format error: base class alerts a warning
    if (!error?.message && error?.type && (callErrors as any)[error.type]) {
      return false;
    }
    if (
      error?.message === ringoutErrors.firstLegConnectFailed ||
      error?.message === 'Failed to fetch' ||
      error?.message === REFRESH_TOKEN_EXPIRED
    ) {
      return false;
    }
    // ringout without international permission: base class alerts a danger
    const { feature } = await this._getErrorResponseBody(error);
    if (
      feature &&
      feature.includes('InternationalCalls') &&
      error?.response?.status === 403
    ) {
      return false;
    }
    return !(await availabilityMonitor.checkIfHAError(error));
  }

  protected async _getErrorResponseBody(error: any): Promise<any> {
    try {
      return (await error?.response?.clone().json()) || {};
    } catch (e) {
      // non JSON body, the base class does not alert on it either
      return {};
    }
  }

  override async _makeCall(params: any) {
    const { callingSettings, ringout } = this._deps as any;
    const callingMode = params.callingMode ?? callingSettings.callingMode;
    if (
      callingMode === callingModes.ringout &&
      callingSettings.isRingoutCallerIdEnabled
    ) {
      const fromNumber = callingSettings.fromNumber;
      const callerId =
        fromNumber && fromNumber !== ANONYMOUS ? fromNumber : undefined;
      return ringout.makeCall({
        fromNumber: params.fromNumber,
        toNumber: params.toNumber && params.toNumber.split('*')[0],
        prompt: callingSettings.ringoutPrompt,
        callerId,
      });
    }
    return super._makeCall(params);
  }
}
