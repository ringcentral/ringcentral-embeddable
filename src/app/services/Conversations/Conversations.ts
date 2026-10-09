import {
  AppFeatures,
  Auth,
  Client,
  ExtensionInfo,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  type Attachment,
  ConversationLogger,
  Conversations as BaseConversations,
  type ConversationsOptions,
  MessageSender,
  MessageStore,
  SmsOptOut,
} from '@ringcentral-integration/micro-message/src/app/services';
import { injectable, optional } from '@ringcentral-integration/next-core';

import { SmsTypingTimeTracker } from '../SmsTypingTimeTracker';

/**
 * Saves the SMS typing time against the reply sent from a conversation.
 */
@injectable({
  name: 'Conversations',
})
export class Conversations extends BaseConversations {
  constructor(
    protected override _toast: Toast,
    protected override _auth: Auth,
    protected override _client: Client,
    protected override _messageSender: MessageSender,
    protected override _extensionInfo: ExtensionInfo,
    protected override _messageStore: MessageStore,
    protected override _appFeatures: AppFeatures,
    protected override _regionSettings: RegionSettings,
    @optional() protected override _contactMatcher?: ContactMatcher,
    @optional() protected override _conversationLogger?: ConversationLogger,
    @optional('ConversationsOptions')
    protected override _conversationsOptions?: ConversationsOptions,
    @optional() protected override _smsOptOut?: SmsOptOut,
    @optional()
    private readonly _smsTypingTimeTracker?: SmsTypingTimeTracker,
  ) {
    super(
      _toast,
      _auth,
      _client,
      _messageSender,
      _extensionInfo,
      _messageStore,
      _appFeatures,
      _regionSettings,
      _contactMatcher,
      _conversationLogger,
      _conversationsOptions,
      _smsOptOut,
    );
  }

  override async replyToReceivers(
    text: string,
    attachments: Attachment[] = [],
  ): ReturnType<BaseConversations['replyToReceivers']> {
    const conversationId = this.currentConversationId;
    if (conversationId) {
      // Stop counting while sending, so a failed send stays paused.
      await this._smsTypingTimeTracker?.pauseTyping(conversationId);
    }
    const response = await super.replyToReceivers(text, attachments);
    const messageId = (response as { id?: string | number } | null)?.id;
    if (conversationId && messageId !== undefined && messageId !== null) {
      // Complete with the send response, as message store events may come
      // late or not carry the conversation id.
      await this._smsTypingTimeTracker?.stopTyping(
        conversationId,
        String(messageId),
      );
    }
    return response;
  }
}
