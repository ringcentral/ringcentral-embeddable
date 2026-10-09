import type { Message } from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import {
  MessageStore,
  MessageThread,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  action,
  delegate,
  inject,
  injectable,
  ModuleRef,
  RcModule,
  state,
  storage,
  StoragePlugin,
  takeUntilAppDestroy,
} from '@ringcentral-integration/next-core';

import type { SmsTypingTimeTrackerOptions } from './SmsTypingTimeTracker.interface';

@injectable({
  name: 'SmsTypingTimeTracker',
})
export class SmsTypingTimeTracker extends RcModule {
  /**
   * Start time of the running typing session per context. Not persisted: a
   * start time from before a reload no longer reflects typing activity.
   */
  @state
  typingStartTimes: Record<string, number> = {};

  @storage
  @state
  private _enabledOverride: boolean | null = null;

  @storage
  @state
  accumulatedTypingTimes: Record<string, number> = {};

  @storage
  @state
  typingTimeMap: Record<string, number> = {};

  constructor(
    storagePlugin: StoragePlugin,
    private readonly _messageStore: MessageStore,
    private readonly _moduleRef: ModuleRef,
    @inject('SmsTypingTimeTrackerOptions')
    private readonly _options: SmsTypingTimeTrackerOptions,
  ) {
    super();
    storagePlugin.enable(this);
    this._messageStore.onMessageUpdated((message) => {
      this._captureOutboundMessage(message);
    });
  }

  get enabled(): boolean {
    return (
      this._enabledOverride ?? Boolean(this._options.enableTypingTimeTracking)
    );
  }

  override onInitOnce(): void {
    this._moduleRef
      .get(MessageThread)
      .message$.pipe(takeUntilAppDestroy)
      .subscribe((message) => {
        this._captureOutboundMessage(message);
      });
  }

  override onReset(): void {
    this._clearStartTimes();
  }

  @action
  private _setStartTime(contextKey: string, time: number): void {
    this.typingStartTimes[contextKey] = time;
  }

  @action
  private _clearStartTime(contextKey: string): void {
    delete this.typingStartTimes[contextKey];
  }

  @action
  private _clearStartTimes(): void {
    this.typingStartTimes = {};
  }

  @action
  private _setEnabled(enabled: boolean): void {
    this._enabledOverride = enabled;
  }

  @action
  private _setAccumulatedTime(contextKey: string, time: number): void {
    this.accumulatedTypingTimes[contextKey] = time;
  }

  @action
  private _clearAccumulatedTime(contextKey: string): void {
    delete this.accumulatedTypingTimes[contextKey];
  }

  @action
  private _saveTypingTime(messageIds: string[], time: number): void {
    messageIds.forEach((messageId) => {
      this.typingTimeMap[messageId] = time;
    });
  }

  @delegate('server')
  async setEnabled(enabled: boolean): Promise<void> {
    this._setEnabled(enabled);
  }

  @delegate('server')
  async startTyping(contextKey: string): Promise<void> {
    if (!this.enabled || this.typingStartTimes[contextKey]) {
      return;
    }
    this._setStartTime(contextKey, Date.now());
  }

  @delegate('server')
  async pauseTyping(contextKey: string): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const startTime = this.typingStartTimes[contextKey];
    if (!startTime) {
      return;
    }
    const accumulatedTime = this.accumulatedTypingTimes[contextKey] ?? 0;
    this._setAccumulatedTime(
      contextKey,
      accumulatedTime + Date.now() - startTime,
    );
    this._clearStartTime(contextKey);
  }

  @delegate('server')
  async stopTyping(contextKey: string, messageId: string): Promise<void> {
    this._completeTyping(contextKey, [messageId]);
  }

  /**
   * Saves one typing duration against every message sent from a context,
   * such as a group text sent from the compose page.
   */
  @delegate('server')
  async stopTypingForMessages(
    contextKey: string,
    messageIds: string[],
  ): Promise<void> {
    this._completeTyping(contextKey, messageIds);
  }

  @delegate('server')
  async clearTyping(contextKey: string): Promise<void> {
    if (this.typingStartTimes[contextKey]) {
      this._clearStartTime(contextKey);
    }
    if (contextKey in this.accumulatedTypingTimes) {
      this._clearAccumulatedTime(contextKey);
    }
  }

  hasTyping(contextKey: string): boolean {
    return Boolean(
      this.typingStartTimes[contextKey] ||
        this.accumulatedTypingTimes[contextKey],
    );
  }

  getTypingTime(messageId: string | number): number | undefined {
    return this.typingTimeMap[String(messageId)];
  }

  private _captureOutboundMessage(message: Message): void {
    if (
      message.direction !== 'Outbound' ||
      !message.conversationId ||
      !message.id
    ) {
      return;
    }
    this._completeTyping(message.conversationId, [String(message.id)]);
  }

  private _completeTyping(contextKey: string, messageIds: string[]): void {
    if (!this.enabled || !this.hasTyping(contextKey)) {
      return;
    }
    const startTime = this.typingStartTimes[contextKey];
    const accumulatedTime = this.accumulatedTypingTimes[contextKey] ?? 0;
    const totalTime = startTime
      ? accumulatedTime + Date.now() - startTime
      : accumulatedTime;
    if (totalTime > 0 && messageIds.length > 0) {
      this._saveTypingTime(messageIds, totalTime);
    }
    if (startTime) {
      this._clearStartTime(contextKey);
    }
    this._clearAccumulatedTime(contextKey);
  }
}
