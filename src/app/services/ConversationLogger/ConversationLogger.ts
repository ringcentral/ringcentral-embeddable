import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import type { Message } from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import type { Correspondent } from '@ringcentral-integration/commons/lib/messageHelper';
import {
  AppFeatures,
  Auth,
  ExtensionInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ContactMatcher } from '@ringcentral-integration/micro-contacts/src/app/services';
import { DateTimeFormat } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ConversationMatcher,
  MessageStore,
  MessageThread,
} from '@ringcentral-integration/micro-message/src/app/services';
import { ConversationLogger as ConversationLoggerBase } from '@ringcentral-integration/micro-message/src/app/services/ConversationLogger/ConversationLogger';
import type {
  ConversationLogItem,
  ConversationLogMap,
} from '@ringcentral-integration/micro-message/src/app/services/ConversationLogger/ConversationLogger.interface';
import {
  computed,
  delegate,
  inject,
  injectable,
  ModuleRef,
  optional,
  RouterPlugin,
  StoragePlugin,
  watch,
} from '@ringcentral-integration/next-core';

import { SmsTypingTimeTracker } from '../SmsTypingTimeTracker';
import { ThirdParty } from '../ThirdParty';
import type { ConversationLoggerOptions } from './ConversationLogger.interface';

type CompatibleConversationLogItem = Omit<ConversationLogItem, 'type'> & {
  type: ConversationLogItem['type'] | 'Thread';
  entities?: Message[];
  lastModifiedTime?: number;
  status?: string;
  statusReason?: string;
  assignee?: unknown;
  owner?: unknown;
  guestParty?: Correspondent;
  ownerParty?: Correspondent;
};

type CompatibleThreadConversation = {
  conversationId?: string;
  creationTime?: number;
  lastModifiedTime?: number;
  self?: Correspondent;
  correspondents?: Correspondent[];
};

type TabManagerLike = {
  active: boolean;
};

function addConversationLoggerStorageMigration(
  storagePlugin: StoragePlugin,
): StoragePlugin {
  const migratingStoragePlugin = Object.create(storagePlugin) as StoragePlugin;
  migratingStoragePlugin.enable = ((target: object) =>
    storagePlugin.enable(target as object & { _autoLog: boolean }, {
      migrations: [['_autoLog', 'ConversationLogger-_autoLog']],
    })) as StoragePlugin['enable'];
  return migratingStoragePlugin;
}

@injectable({
  name: 'ConversationLogger',
})
export class ConversationLogger extends ConversationLoggerBase {
  private _threadUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    auth: Auth,
    storagePlugin: StoragePlugin,
    contactMatcher: ContactMatcher,
    conversationMatcher: ConversationMatcher,
    dateTimeFormat: DateTimeFormat,
    extensionInfo: ExtensionInfo,
    messageStore: MessageStore,
    appFeatures: AppFeatures,
    router: RouterPlugin,
    @inject('ConversationLoggerOptions')
    conversationLoggerOptions: ConversationLoggerOptions,
    private readonly _moduleRef: ModuleRef,
    private readonly _smsTypingTimeTracker: SmsTypingTimeTracker,
    private readonly _thirdParty: ThirdParty,
    @optional('TabManager') private readonly _tabManager?: TabManagerLike,
  ) {
    super(
      auth,
      addConversationLoggerStorageMigration(storagePlugin),
      contactMatcher,
      conversationMatcher,
      dateTimeFormat,
      extensionInfo,
      messageStore,
      appFeatures,
      router,
      conversationLoggerOptions,
    );
    if (conversationLoggerOptions.autoLog) {
      this._autoLog = true;
    }
  }

  private get _messageThread(): MessageThread {
    return this._moduleRef.get(MessageThread);
  }

  get logButtonTitle(): string | null {
    return this._thirdParty.messageLoggerTitle;
  }

  get loggerSourceReady(): boolean {
    return this._thirdParty.messageLoggerRegistered;
  }

  get autoLogReadOnly(): boolean {
    return this._thirdParty.messageLoggerAutoSettingReadOnly;
  }

  get autoLogReadOnlyReason(): string {
    return this._thirdParty.messageLoggerAutoSettingReadOnlyReason;
  }

  override onInitOnce(): void {
    watch(
      this,
      () => [
        this._messageThread.data.threads,
        this._messageThread.data.messages,
      ],
      () => this._scheduleThreadLogProcessing(),
      { multiple: true },
    );
  }

  override onInit(): void {
    const readOnlyValue =
      this._thirdParty.messageLoggerAutoSettingReadOnlyValue;
    if (
      this._thirdParty.messageLoggerAutoSettingReadOnly &&
      typeof readOnlyValue === 'boolean' &&
      readOnlyValue !== this.autoLog
    ) {
      this._setAutoLog(readOnlyValue);
    }
  }

  override onInitSuccess(): void {
    this._processConversationLogMap();
  }

  override onReset(): void {
    super.onReset();
    if (this._threadUpdateTimeout) {
      clearTimeout(this._threadUpdateTimeout);
      this._threadUpdateTimeout = null;
    }
  }

  @computed((that: ConversationLogger) => [
    that._messageStore.conversationStore,
    that._extensionInfo.extensionNumber,
    that._conversationMatcher.dataMapping,
    that._messageThread.data.threads,
    that._messageThread.data.messages,
    that._smsTypingTimeTracker.typingTimeMap,
  ])
  override get conversationLogMap(): ConversationLogMap {
    const mapping = this._addTypingDurations(super.conversationLogMap);
    const threadConversations = this._messageThread.threadConversationsInfo
      .conversations as unknown as CompatibleThreadConversation[];
    threadConversations.forEach((conversation) => {
      const conversationId = conversation.conversationId;
      if (!conversationId) {
        return;
      }
      const thread = this._messageThread.getThread(conversationId);
      const threadInfo = thread?.threadInfo;
      const entities = this._messageThread
        .getThreadMessages(conversationId)
        .map((message) => this._addTypingDuration(message));
      const messages = entities.filter(
        (message) => message.messageType === 'message',
      );
      const creationTime =
        new Date(threadInfo?.creationTime ?? '').getTime() ||
        conversation.creationTime ||
        Date.now();
      const date = this._formatDateTime({
        type: 'date',
        utcTimestamp: creationTime,
      });
      const conversationLogId = this.getMessageThreadLogId(conversation);
      if (!date || !conversationLogId) {
        return;
      }
      const item: CompatibleConversationLogItem = {
        conversationId,
        conversationLogId,
        creationTime,
        date,
        type: 'Thread',
        messages,
        entities,
        conversationLogMatches:
          this._conversationMatcher.dataMapping[conversationLogId] ?? [],
        self: conversation.self,
        correspondents: conversation.correspondents,
        lastModifiedTime:
          new Date(threadInfo?.lastModifiedTime ?? '').getTime() ||
          conversation.lastModifiedTime,
        status: threadInfo?.status,
        statusReason: threadInfo?.statusReason,
        assignee: threadInfo?.assignee,
        owner: threadInfo?.owner,
        guestParty: threadInfo?.guestParty,
        ownerParty: threadInfo?.ownerParty,
      };
      mapping[conversationId] = {
        [date]: item as ConversationLogItem,
      };
    });
    return mapping;
  }

  getMessageThreadLogId(thread: {
    conversationId?: string;
    id?: string | number;
  }): string | undefined {
    return (
      thread.conversationId ??
      (typeof thread.id === 'undefined' ? undefined : String(thread.id))
    );
  }

  override _processConversationLogMap(_record?: Message): void {
    if (this.ready && this._lastAutoLog !== this.autoLog) {
      this._lastAutoLog = this.autoLog;
      if (this.autoLog) {
        this._lastProcessedConversations = null;
      }
    }
    if (
      !this.ready ||
      this._lastProcessedConversations === this.conversationLogMap
    ) {
      return;
    }
    this._conversationMatcher.triggerMatch();
    this._contactMatcher.triggerMatch();
    const previousMap = this._lastProcessedConversations ?? {};
    this._lastProcessedConversations = this.conversationLogMap;
    if (this._tabManager && !this._tabManager.active) {
      return;
    }
    Object.values(this._lastProcessedConversations).forEach((dateMap) => {
      Object.values(dateMap).forEach((conversation) => {
        const previousConversation =
          previousMap[conversation.conversationId]?.[conversation.date];
        if (
          this._getConversationRevision(previousConversation) ===
          this._getConversationRevision(conversation)
        ) {
          return;
        }
        if (this.accordWithProcessLogRequirement(conversation)) {
          this._queueAutoLogConversation({ conversation });
        }
      });
    });
  }

  override async _processConversationLog({
    conversation,
  }: {
    conversation: ConversationLogItem;
  }): Promise<void> {
    await this._conversationMatcher.match({
      queries: [conversation.conversationLogId],
    });
    const matches =
      this._conversationMatcher.dataMapping[conversation.conversationLogId];
    if (this._isAutoUpdate && matches?.length) {
      await this._autoLogConversation({ conversation });
      return;
    }
    if (!this.autoLog) {
      return;
    }
    const contacts = [
      conversation.self,
      ...(conversation.correspondents ?? []),
    ];
    const numbers = Array.from(
      new Set(
        contacts
          .map((contact) => contact?.phoneNumber || contact?.extensionNumber)
          .filter((number): number is string => Boolean(number)),
      ),
    );
    await this._contactMatcher.match({ queries: numbers });
    const selfNumber =
      conversation.self?.phoneNumber || conversation.self?.extensionNumber;
    const selfMatches = selfNumber
      ? this._contactMatcher.dataMapping[selfNumber] ?? []
      : [];
    const correspondentMatches = this._getCorrespondentMatches(conversation);
    const selfEntity = selfMatches.length === 1 ? selfMatches[0] : null;
    const correspondentEntity =
      this.getLastMatchedCorrespondentEntity(conversation) ||
      (correspondentMatches.length === 1 ? correspondentMatches[0] : null);
    await this._autoLogConversation({
      conversation,
      selfEntity,
      correspondentEntity,
    });
  }

  override async _autoLogConversation({
    conversation,
    selfEntity,
    correspondentEntity,
  }: {
    conversation: ConversationLogItem;
    selfEntity?: Entity | null;
    correspondentEntity?: Entity | null;
  }): Promise<void> {
    await this.log({
      conversation,
      selfEntity,
      correspondentEntity,
      triggerType: 'auto',
    });
  }

  override async logConversation<T>({
    triggerType = 'auto',
    ...options
  }: {
    conversationId: string;
    correspondentEntity: Entity;
    redirect: boolean;
    triggerType?: string;
  } & T): Promise<void> {
    await super.logConversation({ ...options, triggerType });
  }

  /**
   * Logs only the selected messages of a conversation, for services that
   * enable granular per-message selection.
   */
  @delegate('server')
  async logSelectedMessages({
    conversationId,
    messages,
    correspondents,
    correspondentEntity,
  }: {
    conversationId: string;
    messages: Message[];
    correspondents?: Correspondent[];
    correspondentEntity?: Entity | null;
  }): Promise<void> {
    if (messages.length === 0) {
      return;
    }
    const [logItem] = Object.values(this.conversationLogMap[conversationId] ?? {});
    const selectedMessages = [...messages]
      .sort(
        (a, b) =>
          new Date(a.creationTime ?? 0).getTime() -
          new Date(b.creationTime ?? 0).getTime(),
      )
      .map((message) => this._addTypingDuration(message));
    await this._thirdParty.logSelectedMessages({
      conversation: {
        conversationId,
        type: logItem?.type ?? selectedMessages[0].type,
        self: logItem?.self,
        correspondents: logItem?.correspondents ?? correspondents,
        messages: selectedMessages,
      },
      selectedMessageIds: selectedMessages.map(({ id }) => String(id)),
      correspondentEntity: correspondentEntity ?? undefined,
    });
  }

  private _scheduleThreadLogProcessing(): void {
    if (this._threadUpdateTimeout) {
      clearTimeout(this._threadUpdateTimeout);
    }
    this._threadUpdateTimeout = setTimeout(() => {
      this._threadUpdateTimeout = null;
      this._processConversationLogMap();
    }, 2_000);
  }

  private _addTypingDurations(mapping: ConversationLogMap): ConversationLogMap {
    return Object.fromEntries(
      Object.entries(mapping).map(([conversationId, dateMap]) => [
        conversationId,
        Object.fromEntries(
          Object.entries(dateMap).map(([date, conversation]) => [
            date,
            {
              ...conversation,
              messages: conversation.messages.map((message) =>
                this._addTypingDuration(message),
              ),
            },
          ]),
        ),
      ]),
    );
  }

  private _addTypingDuration(message: Message): Message {
    const typingDuration = this._smsTypingTimeTracker.getTypingTime(message.id);
    return typeof typingDuration === 'number'
      ? { ...message, typingDurationMs: typingDuration }
      : message;
  }

  private _getConversationRevision(conversation?: ConversationLogItem): string {
    if (!conversation) {
      return '';
    }
    const compatibleConversation =
      conversation as CompatibleConversationLogItem;
    const messages = compatibleConversation.messages ?? [];
    const entities = compatibleConversation.entities ?? [];
    return [
      messages[0]?.id,
      messages[messages.length - 1]?.id,
      messages.length,
      entities[entities.length - 1]?.id,
      entities.length,
      compatibleConversation.lastModifiedTime,
      compatibleConversation.status,
    ].join('|');
  }
}
