import { Ringout as RingoutBase } from '@ringcentral-integration/commons/modules/Ringout';
import { Module } from '@ringcentral-integration/commons/lib/di';
import type GetRingOutStatusResponse from '@rc-ex/core/lib/definitions/GetRingOutStatusResponse';
import { ringoutErrors } from '@ringcentral-integration/commons/modules/Ringout/ringoutErrors';
import { ringoutStatus } from '@ringcentral-integration/commons/modules/Ringout/ringoutStatus';

interface MakeCallOptions {
  callerId: string;
  fromNumber: string;
  toNumber: string;
  prompt: boolean;
}

interface PostRingOutParams {
  from: { phoneNumber: string };
  to: { phoneNumber: string };
  playPrompt: boolean;
  callerId?: { phoneNumber: string };
}

@Module({
  name: 'NewRingout',
  deps: [],
})
export class Ringout extends RingoutBase {
  override async makeCall({
    fromNumber,
    toNumber,
    prompt,
    callerId,
  }: MakeCallOptions): Promise<void> {
    if (this.ready) {
      this.setRingoutStatus(ringoutStatus.connecting);
      try {
        const params: PostRingOutParams = {
          from: { phoneNumber: fromNumber },
          to: { phoneNumber: toNumber },
          playPrompt: prompt,
        };
        if (callerId) {
          params.callerId = {
            phoneNumber: callerId,
          };
        }
        const resp: GetRingOutStatusResponse = await this._deps.client
          .account()
          .extension()
          .ringOut()
          .post(params);

        if (this._deps.contactMatcher) {
          await this._deps.contactMatcher.forceMatchBatchNumbers({
            phoneNumbers: [fromNumber, toNumber],
          });
        }

        const startTime = Date.now();
        await this._monitorRingout(resp.id, startTime);

        this.setRingoutStatus(ringoutStatus.idle);
      } catch (e: any /** TODO: confirm with instanceof */) {
        this.setRingoutStatus(ringoutStatus.idle);
        if (e.message !== ringoutErrors.pollingCancelled) {
          throw e;
        }
      }
    } else {
      // TODO: Need to dispatch a generic error action
    }
  }
}
