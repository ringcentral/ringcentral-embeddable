import {
  AppFeatures,
  ConnectivityManager,
  ConnectivityMonitor,
  RateLimiter,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import { ModalView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  ComposeText,
  ConversationLogger,
  Conversations,
  MessageStore,
  SmsConversations,
  SmsOptOut,
  VoicemailAudio,
} from '@ringcentral-integration/micro-message/src/app/services';
import type { SmsConversationsOptions } from '@ringcentral-integration/micro-message/src/app/services/Sms/SmsConversations.interface';
import { ConversationsViewSpring as ConversationsViewSpringBase } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring';
import type {
  ConversationsPanelSpringProps,
  ConversationsViewSpringOptions,
  ConversationsViewSpringProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/Conversations.view.interface';
import { IntegrationConfig } from '@ringcentral-integration/micro-setting/src/app/services';
import {
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  type UIFunctions,
} from '@ringcentral-integration/next-core';

import { ConversationsPage } from './ConversationsPage';

@injectable({
  name: 'ConversationsViewSpring',
})
export class ConversationsView extends ConversationsViewSpringBase {
  constructor(
    modalView: ModalView,
    locale: Locale,
    conversations: Conversations,
    regionSettings: RegionSettings,
    appFeatures: AppFeatures,
    connectivityMonitor: ConnectivityMonitor,
    rateLimiter: RateLimiter,
    messageStore: MessageStore,
    connectivityManager: ConnectivityManager,
    router: RouterPlugin,
    toast: Toast,
    composeText: ComposeText,
    portManager: PortManager,
    voicemailAudio: VoicemailAudio,
    integrationConfig: IntegrationConfig,
    smsConversations: SmsConversations,
    @optional() contactMatcher?: ContactMatcher,
    @optional() conversationLogger?: ConversationLogger,
    @optional() smsOptOut?: SmsOptOut,
    @optional('ConversationsViewOptions')
    conversationsViewOptions?: ConversationsViewSpringOptions,
    @optional('SmsConversationsOptions')
    smsConversationsOptions?: SmsConversationsOptions,
  ) {
    super(
      modalView,
      locale,
      conversations,
      regionSettings,
      appFeatures,
      connectivityMonitor,
      rateLimiter,
      messageStore,
      connectivityManager,
      router,
      toast,
      composeText,
      portManager,
      voicemailAudio,
      integrationConfig,
      smsConversations,
      contactMatcher,
      conversationLogger,
      smsOptOut,
      {
        ...conversationsViewOptions,
        component: ConversationsPage,
      },
      smsConversationsOptions,
    );
  }

  override getUIFunctions(
    props: ConversationsViewSpringProps,
  ): UIFunctions<ConversationsPanelSpringProps> {
    const functions = super.getUIFunctions(props);
    const baseUseActionsHandler = functions.useActionsHandler;
    const useActionsHandler: ConversationsPanelSpringProps['useActionsHandler'] =
      (conversation, info, location) => {
        const baseHandler = baseUseActionsHandler(
          conversation,
          info,
          location,
        );
        return async (actionType, data) => {
          if (
            (actionType === 'viewDetail' &&
              (info.isTextMessage || info.isVoicemail || info.isFax))
          ) {
            const conversationId = conversation.conversationId;
            if (!conversationId) {
              return;
            }
            if (info.isFax) {
              this._messageStore.readMessages(conversationId);
              await this._router.push(`/faxes/${conversationId}`);
              return;
            }
            if (info.isVoicemail) {
              await this._router.push(`/voicemails/${conversationId}`);
              return;
            }
            await this._smsConversationsOptions?.checkDncStatusOfConversation?.(
              conversationId,
            );
            await this._router.push(`/conversations/${conversationId}`);
            return;
          }
          await baseHandler(actionType, data);
        };
      };
    return {
      ...functions,
      useActionsHandler,
    };
  }
}
