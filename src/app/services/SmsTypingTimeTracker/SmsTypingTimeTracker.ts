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
  private readonly _typingStartTimes: Record<string, number> = {};

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
    Object.keys(this._typingStartTimes).forEach((contextKey) => {
      delete this._typingStartTimes[contextKey];
    });
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
  private _saveTypingTime(messageId: string, time: number): void {
    this.typingTimeMap[messageId] = time;
  }

  @delegate('server')
  async setEnabled(enabled: boolean): Promise<void> {
    this._setEnabled(enabled);
  }

  @delegate('server')
  async startTyping(contextKey: string): Promise<void> {
    if (!this.enabled || this._typingStartTimes[contextKey]) {
      return;
    }
    this._typingStartTimes[contextKey] = Date.now();
  }

  @delegate('server')
  async pauseTyping(contextKey: string): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const startTime = this._typingStartTimes[contextKey];
    if (!startTime) {
      return;
    }
    const accumulatedTime = this.accumulatedTypingTimes[contextKey] ?? 0;
    this._setAccumulatedTime(
      contextKey,
      accumulatedTime + Date.now() - startTime,
    );
    delete this._typingStartTimes[contextKey];
  }

  @delegate('server')
  async stopTyping(contextKey: string, messageId: string): Promise<void> {
    this._completeTyping(contextKey, messageId);
  }

  @delegate('server')
  async clearTyping(contextKey: string): Promise<void> {
    delete this._typingStartTimes[contextKey];
    this._clearAccumulatedTime(contextKey);
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
    this._completeTyping(message.conversationId, String(message.id));
  }

  private _completeTyping(contextKey: string, messageId: string): void {
    if (!this.enabled) {
      return;
    }
    const startTime = this._typingStartTimes[contextKey];
    const accumulatedTime = this.accumulatedTypingTimes[contextKey] ?? 0;
    const totalTime = startTime
      ? accumulatedTime + Date.now() - startTime
      : accumulatedTime;
    if (totalTime > 0) {
      this._saveTypingTime(messageId, totalTime);
    }
    delete this._typingStartTimes[contextKey];
    this._clearAccumulatedTime(contextKey);
  }
}
