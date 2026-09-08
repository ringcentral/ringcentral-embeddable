import {
  AppFeatures,
  ConnectivityManager,
  ConnectivityMonitor,
  RateLimiter,
  RegionSettings,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher as ContactMatcherBase } from '@ringcentral-integration/micro-contacts/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
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
  inject,
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  type UIFunctions,
  useConnector,
} from '@ringcentral-integration/next-core';

import { useConversationDisplayNameWithMatches } from '../../components/MatchedContactsTag';
import {
  type ContactMatcher,
  refreshContactMatch,
} from '../../services/ContactMatcher';
import { ThirdParty } from '../../services/ThirdParty';

import {
  createConversationLogAction,
  insertConversationLogAction,
  logConversationManually,
} from './ConversationLogAction';
import { ConversationsPage } from './ConversationsPage';
import i18n from './i18n';

type ConversationsUIFunctions = UIFunctions<ConversationsPanelSpringProps> & {
  onRefreshContact?: (phoneNumber: string) => Promise<void>;
};

@injectable({
  name: 'ConversationsView',
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
    @inject(ConversationLogger) conversationLogger: ConversationLogger,
    @inject(ThirdParty) thirdParty: ThirdParty,
    @optional(ContactMatcherBase) contactMatcher?: ContactMatcher,
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
    this._appContactMatcher = contactMatcher;

    // `useConversationItemInfo` is an instance field on the base class, not a
    // prototype method, so it is wrapped here rather than overridden. Doing it
    // on the instance covers every consumer: the text, fax and voicemail lists
    // reach it through `getUIFunctions`, and `VoicemailView` and
    // `FaxDetailsView` call it directly off this view.
    const baseUseConversationItemInfo = this.useConversationItemInfo;
    this.useConversationItemInfo = (conversation, options) => {
      const conversationLogId =
        conversation.conversationLogId === 'unknown'
          ? conversation.conversationId
          : conversation.conversationLogId;
      const conversationWithLogState = {
        ...conversation,
        conversationLogId,
        conversationMatches: conversationLogId
          ? conversationLogger.dataMapping?.[conversationLogId] ??
            conversation.conversationMatches
          : conversation.conversationMatches,
      };
      const result = baseUseConversationItemInfo(
        conversationWithLogState,
        options,
      );
      const { t } = useLocale(i18n);
      const logState = useConnector(() => ({
        isLogging: Boolean(
          conversationLogId && conversationLogger.loggingMap[conversationLogId],
        ),
        logButtonTitle: thirdParty.messageLoggerTitle,
        ready: conversationLogger.ready && thirdParty.messageLoggerRegistered,
      }));
      const DisplayName = useConversationDisplayNameWithMatches(
        result.info.DisplayName,
        conversationWithLogState,
      );
      const logAction = createConversationLogAction({
        conversation: conversationWithLogState,
        editLogLabel: t('editLog'),
        logMessageLabel: t('logMessages'),
        ...logState,
      });
      return {
        ...result,
        actions: insertConversationLogAction(result.actions, logAction),
        info: { ...result.info, DisplayName },
      };
    };

    const baseUseActionsHandler = this.useActionsHandler;
    this.useActionsHandler = (conversation, info, location) => {
      const baseHandler = baseUseActionsHandler(conversation, info, location);
      return async (actionType, data) => {
        if (
          (actionType === 'createLog' || actionType === 'viewLog') &&
          thirdParty.messageLoggerRegistered
        ) {
          await logConversationManually({
            conversation,
            conversationLogger,
            correspondentEntity: info.matchedContact,
          });
          return;
        }
        await baseHandler(actionType, data);
      };
    };
  }

  private readonly _appContactMatcher?: ContactMatcher;

  private readonly _refreshContact = async (
    phoneNumber: string,
  ): Promise<void> => {
    if (!this._appContactMatcher) {
      return;
    }
    await refreshContactMatch(this._appContactMatcher, phoneNumber);
  };

  override getUIFunctions(
    props: ConversationsViewSpringProps,
  ): ConversationsUIFunctions {
    const functions = super.getUIFunctions(props);
    const baseUseActionsHandler = functions.useActionsHandler;
    const useActionsHandler: ConversationsPanelSpringProps['useActionsHandler'] =
      (conversation, info, location) => {
        const baseHandler = baseUseActionsHandler(conversation, info, location);
        return async (actionType, data) => {
          if (
            actionType === 'viewDetail' &&
            (info.isTextMessage || info.isVoicemail || info.isFax)
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
      onRefreshContact: this._appContactMatcher
        ? this._refreshContact
        : undefined,
      useActionsHandler,
    };
  }
}
