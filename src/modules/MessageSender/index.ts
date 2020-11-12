import { Module } from 'ringcentral-integration/lib/di';

import {
  MessageSender as MessageSenderBase,
  messageSenderStatus,
} from 'ringcentral-integration/modules/MessageSenderV2';

@Module({
  name: 'MessageSender',
  deps: [],
})
export class MessageSender extends MessageSenderBase {
  // TODO: fix noAttachmentToExtension error not idle issue
  async _validateToNumbers(options) {
    const result = await super._validateToNumbers(options);
    this.setSendStatus(messageSenderStatus.idle);
    return result;
  }
}
