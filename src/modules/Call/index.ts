import { Call as CallBase } from '@ringcentral-integration/commons/modules/Call';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { callingModes } from '@ringcentral-integration/commons/modules/CallingSettings/callingModes';

const ANONYMOUS = 'anonymous';

@Module({
  name: 'NewCall',
  deps: [],
})
export class Call extends CallBase {
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
