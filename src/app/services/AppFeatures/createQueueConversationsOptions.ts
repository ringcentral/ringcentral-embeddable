import type { QueueConversationsOptions } from '@ringcentral-integration/micro-message/src/app/services';

/**
 * Call queue conversation options that enable the Call queue tab (call queue
 * SMS through `/shared-sms`) only when the `enableSharedMessages` URL parameter
 * is on and the extension has the `CallQueueSmsRecipient` feature, as 3.x did.
 *
 * `QueueMessageStore` reads the same options, so this gates its sync too.
 * `enable` is read on use, so it follows the flag and features after startup.
 */
export function createQueueConversationsOptions(appFeatures: {
  readonly hasCallQueueSmsRecipientPermission: boolean;
}): QueueConversationsOptions {
  return {
    get enable(): boolean {
      return Boolean(appFeatures.hasCallQueueSmsRecipientPermission);
    },
  };
}
