import { messageTypes } from '@ringcentral-integration/commons/enums/messageTypes';
import {
  AppFeatures,
  ConnectivityManager,
  ConnectivityMonitor,
  RateLimiter,
  RegionSettings,
  track,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher as ContactMatcherBase } from '@ringcentral-integration/micro-contacts/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  Locale,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  ComposeText,
  ConversationLogger,
  Conversations,
  MessageThread,
  MessageStore,
  SmsConversations,
  SmsOptOut,
  VoicemailAudio,
} from '@ringcentral-integration/micro-message/src/app/services';
import type { SmsConversationsOptions } from '@ringcentral-integration/micro-message/src/app/services/Sms/SmsConversations.interface';
import { ConversationsViewSpring as ConversationsViewSpringBase } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring';
import { ConversationsTabsView } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsTabs.view';
import type {
  ConversationsPanelSpringProps,
  ConversationsViewSpringOptions,
  ConversationsViewSpringProps,
} from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/Conversations.view.interface';
import { LogInfo } from '@ringcentral-integration/micro-phone/src/app/hooks/useContactRenderInfo/components';
import { IntegrationConfig } from '@ringcentral-integration/micro-setting/src/app/services';
import {
  inject,
  injectable,
  optional,
  PortManager,
  RouterPlugin,
  type UIFunctions,
  type UIProps,
  useConnector,
  useContainer,
} from '@ringcentral-integration/next-core';
import React from 'react';

import { LogStatusMessage } from '../../components/LogStatusMessage';
import { useConversationDisplayNameWithMatches } from '../../components/MatchedContactsTag';
import { embeddableTrackEvents } from '../../services/Analytics/embeddableTrackEvents';
import type { AppFeatures as EmbeddableAppFeatures } from '../../services/AppFeatures';
import {
  type ContactMatcher,
  refreshContactMatch,
} from '../../services/ContactMatcher';
import {
  getConversationMatches,
  getLoggedContact,
  type MatchedContactSelection,
} from '../../services/MatchedContactSelection';
import { ThirdParty } from '../../services/ThirdParty';

import {
  createConversationLogAction,
  hasLoggedConversation,
  insertConversationLogAction,
  logConversationManually,
} from './ConversationLogAction';
import { ConversationsPage } from './ConversationsPage';
import i18n from './i18n';

type ConversationsUIFunctions = UIFunctions<ConversationsPanelSpringProps> & {
  onRefreshContact?: (phoneNumber: string) => Promise<void>;
};

type ItemConversation = Parameters<
  ConversationsViewSpringBase['useConversationItemInfo']
>[0];

type ActionsHandlerArgs = Parameters<
  ConversationsViewSpringBase['useActionsHandler']
>;

/**
 * Normalises the log id and overlays the logger's live matches, so a
 * conversation reads the same logged state wherever it is resolved.
 */
function withConversationLogState<T extends ItemConversation>(
  conversation: T,
  conversationLogger: ConversationLogger,
) {
  const compatibleConversation = conversation as T & {
    conversationId?: string;
  };
  const conversationLogId =
    conversation.conversationLogId === 'unknown'
      ? compatibleConversation.conversationId
      : conversation.conversationLogId;
  return {
    ...compatibleConversation,
    conversationLogId,
    conversationMatches: conversationLogId
      ? conversationLogger.dataMapping?.[conversationLogId] ??
        conversation.conversationMatches
      : conversation.conversationMatches,
  };
}

/**
 * Passes the contact this conversation resolved to on to the call about to be
 * placed from it, so the call control page does not fall back to guessing
 * `Maybe: <name>`.
 *
 * It resolves the same way the row does: the contact the conversation was
 * logged against wins over the user's pick. The guess itself is never handed
 * off, and anything else clears a stale pending pick.
 */
function handOffSelectionToOutboundCall(
  matchedContactSelection: MatchedContactSelection,
  conversationLogger: ConversationLogger,
  [conversation, info]: ActionsHandlerArgs,
) {
  const conversationWithLogState = withConversationLogState(
    conversation,
    conversationLogger,
  );
  const { conversationId, correspondents } = conversationWithLogState;
  // The raw number, as `dialToPhoneNumber` picks it: the formatted one the
  // dialer is handed may be in national form, which the new call's E.164
  // number cannot be matched against.
  const correspondent =
    correspondents?.length === 1 ? correspondents[0] : undefined;
  const phoneNumber =
    correspondent?.extensionNumber ?? correspondent?.phoneNumber;
  if (!conversationId || !phoneNumber || !info.getActionInfo()) {
    return;
  }
  const entityId =
    getLoggedContact(
      conversationWithLogState.conversationMatches,
      getConversationMatches(conversationWithLogState),
    )?.id ??
    matchedContactSelection.getSelectedEntityId('conversation', conversationId);
  void matchedContactSelection.setPendingOutbound(
    entityId ? { entityId, phoneNumber } : null,
  );
}

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
    conversationsTabsView: ConversationsTabsView,
    syncTabView: SyncTabView,
    @inject(ConversationLogger) conversationLogger: ConversationLogger,
    @inject(ThirdParty) thirdParty: ThirdParty,
    @optional(ContactMatcherBase) contactMatcher?: ContactMatcher,
    @optional() messageThread?: MessageThread,
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
      conversationsTabsView,
      syncTabView,
      contactMatcher,
      conversationLogger,
      messageThread,
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
    this.useConversationItemInfo = (conversation, options = {}) => {
      const conversationWithLogState = withConversationLogState(
        conversation,
        conversationLogger,
      );
      const { conversationId, conversationLogId } = conversationWithLogState;
      const matchedContactSelection = useContainer<MatchedContactSelection>(
        'MatchedContactSelection',
      );
      const selectedEntityId = useConnector(() =>
        conversationId
          ? matchedContactSelection.getSelectedEntityId(
              'conversation',
              conversationId,
            )
          : undefined,
      );
      const contactMatches = getConversationMatches(conversationWithLogState);
      const loggedContact = getLoggedContact(
        conversationWithLogState.conversationMatches,
        contactMatches,
      );
      const selectedContact = contactMatches?.find(
        ({ id }) => id === selectedEntityId,
      );
      const effectiveContact = loggedContact ?? selectedContact;
      const conversationWithContactSelection = effectiveContact
        ? {
            ...conversationWithLogState,
            lastMatchedCorrespondentEntity: effectiveContact,
          }
        : conversationWithLogState;
      const result = baseUseConversationItemInfo(
        conversationWithContactSelection,
        options,
      );
      const { t } = useLocale(i18n);
      const logState = useConnector(() => ({
        isLogging: Boolean(
          conversationLogId && conversationLogger.loggingMap[conversationLogId],
        ),
        logButtonTitle: thirdParty.messageLoggerTitle,
        registered: thirdParty.messageLoggerRegistered,
        ready: conversationLogger.ready && thirdParty.messageLoggerRegistered,
      }));
      const DisplayName = useConversationDisplayNameWithMatches(
        result.info.DisplayName,
        conversationWithLogState,
      );
      const displayDescription =
        options?.pageType === 'list' ? (
          <>
            {result.info.displayDescription}
            <LogStatusMessage
              className="block w-full"
              matches={conversationWithContactSelection.conversationMatches}
              multiline
            />
          </>
        ) : (
          result.info.displayDescription
        );
      const logAction = createConversationLogAction({
        conversation: conversationWithContactSelection,
        editLogLabel: t('editLog'),
        logMessageLabel: t('logMessages'),
        ...logState,
      });
      return {
        ...result,
        actions: insertConversationLogAction(result.actions, logAction),
        info: {
          ...result.info,
          DisplayName,
          displayDescription,
          logged: logState.registered ? (
            <LogInfo
              logged={hasLoggedConversation(conversationWithContactSelection)}
            />
          ) : null,
        },
      };
    };

    // `useActionsHandler` is an instance field too, and the voicemail and fax
    // detail pages and the SMS thread reuse this very field, so wrapping it
    // here covers every conversation surface's dial action.
    const baseUseActionsHandler = this.useActionsHandler;
    this.useActionsHandler = (conversation, info, location) => {
      const baseHandler = baseUseActionsHandler(conversation, info, location);
      const matchedContactSelection = useContainer<MatchedContactSelection>(
        'MatchedContactSelection',
      );
      return async (actionType, data) => {
        if (actionType === 'call') {
          handOffSelectionToOutboundCall(
            matchedContactSelection,
            conversationLogger,
            [conversation, info, location],
          );
        }
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

  private get _embeddableAppFeatures(): EmbeddableAppFeatures {
    return this._appFeatures as EmbeddableAppFeatures;
  }

  private readonly _refreshContact = async (
    phoneNumber: string,
  ): Promise<void> => {
    if (!this._appContactMatcher) {
      return;
    }
    await refreshContactMatch(this._appContactMatcher, phoneNumber);
  };

  @track(embeddableTrackEvents.viewMessageDetails)
  private _trackViewMessageDetails(): void {}

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
            const conversationId = (
              conversation as typeof conversation & {
                conversationId?: string;
              }
            ).conversationId;
            if (!conversationId) {
              return;
            }
            if (info.isFax) {
              this._trackViewMessageDetails();
              this._messageStore.readMessages(conversationId);
              await this._router.push(`/faxes/${conversationId}`);
              return;
            }
            if (info.isVoicemail) {
              this._trackViewMessageDetails();
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

  override getUIProps(
    props: ConversationsViewSpringProps,
  ): UIProps<ConversationsPanelSpringProps> {
    const uiProps = super.getUIProps(props);
    return {
      ...uiProps,
      showNewButton:
        props.typeFilter === messageTypes.fax
          ? uiProps.showNewButton && this._embeddableAppFeatures.hasFaxesScope
          : uiProps.showNewButton,
    };
  }
}
