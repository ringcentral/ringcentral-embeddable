import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  RcModuleV2,
  action,
  state,
  storage,
} from '@ringcentral-integration/core';

interface SmsTypingTimeTrackerOptions {
  enableTypingTimeTracking?: boolean;
}

interface Deps {
  storage: any;
  smsTypingTimeTrackerOptions?: SmsTypingTimeTrackerOptions;
}

@Module({
  name: 'SmsTypingTimeTracker',
  deps: [
    'Storage',
    { dep: 'SmsTypingTimeTrackerOptions', optional: true },
  ],
})
export class SmsTypingTimeTracker extends RcModuleV2<Deps> {
  // In-memory: tracks when current typing session started per context
  _typingStartTimes: Record<string, number> = {};

  constructor(deps: Deps) {
    super({
      deps,
      enableCache: true,
      storageKey: 'SmsTypingTimeTracker',
    });
  }

  // Persisted: dynamic enabled state (null means use default from options)
  @storage
  @state
  _enabledOverride: boolean | null = null;

  @action
  setEnabled(enabled: boolean): void {
    this._enabledOverride = enabled;
  }

  // Feature flag getter - prioritizes dynamic override, falls back to options
  get enabled(): boolean {
    if (this._enabledOverride !== null) {
      return this._enabledOverride;
    }
    return this._deps.smsTypingTimeTrackerOptions?.enableTypingTimeTracking ?? false;
  }

  // Persisted: accumulated time from previous sessions (for pause/resume)
  @storage
  @state
  accumulatedTypingTimes: Record<string, number> = {};

  // Persisted: final map of messageId -> typing duration in ms
  @storage
  @state
  typingTimeMap: Record<string, number> = {};

  @action
  protected _setAccumulatedTime(contextKey: string, time: number): void {
    this.accumulatedTypingTimes[contextKey] = time;
  }

  @action
  protected _clearAccumulatedTime(contextKey: string): void {
    delete this.accumulatedTypingTimes[contextKey];
  }

  @action
  protected _saveTypingTime(messageId: string, time: number): void {
    this.typingTimeMap[messageId] = time;
  }

  // Called when user starts typing
  startTyping(contextKey: string): void {
    if (!this.enabled) return;
    if (!this._typingStartTimes[contextKey]) {
      this._typingStartTimes[contextKey] = Date.now();
    }
  }

  // Called when user leaves page (pause timer, preserve accumulated time)
  pauseTyping(contextKey: string): void {
    if (!this.enabled) return;
    const startTime = this._typingStartTimes[contextKey];
    if (startTime) {
      const elapsed = Date.now() - startTime;
      const accumulated = this.accumulatedTypingTimes[contextKey] || 0;
      this._setAccumulatedTime(contextKey, accumulated + elapsed);
      delete this._typingStartTimes[contextKey];
    }
  }

  // Called when message is sent successfully
  stopTyping(contextKey: string, messageId: string): void {
    if (!this.enabled) return;
    const startTime = this._typingStartTimes[contextKey];
    const accumulated = this.accumulatedTypingTimes[contextKey] || 0;

    let totalTime = accumulated;
    if (startTime) {
      totalTime += Date.now() - startTime;
    }

    if (totalTime > 0) {
      this._saveTypingTime(messageId, totalTime);
    }

    // Clean up
    delete this._typingStartTimes[contextKey];
    this._clearAccumulatedTime(contextKey);
  }

  // Called when compose is cleared without sending
  clearTyping(contextKey: string): void {
    if (!this.enabled) return;
    delete this._typingStartTimes[contextKey];
    this._clearAccumulatedTime(contextKey);
  }

  // Get typing time for a message (for message formatting)
  getTypingTime(messageId: string): number | undefined {
    return this.typingTimeMap[messageId];
  }
}

