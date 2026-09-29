import {
  computed,
  injectable,
  optional,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useCallback, useEffect, useState } from 'react';

import { agentStatesColors } from '../../enums';
import { getClockByTimestamp } from '../../lib/getClockByTimestamp';
import { CxWorkingState } from '../../services/CxWorkingState';
import { CxAuth } from '../../services/CxAuth';
import { WorkingStateSelect } from '../../components/WorkingStateSelect';
import type { AgentStateOption } from '../../components/WorkingStateSelect';
import type {
  CxWorkingStateSelectViewOptions,
  CxWorkingStateSelectViewProps,
} from './CxWorkingStateSelectView.interface';

/**
 * CxWorkingStateSelectView - View module for agent working state selection
 * Manages timer, state colors, break-time alerts, and renders the WorkingStateSelect component
 */
@injectable({
  name: 'CxWorkingStateSelectView',
})
class CxWorkingStateSelectView extends RcViewModule {
  private _oldIntervalTime = 0;

  constructor(
    private _cxWorkingState: CxWorkingState,
    private _cxAuth: CxAuth,
    @optional('CxWorkingStateSelectViewOptions')
    private _options?: CxWorkingStateSelectViewOptions,
  ) {
    super();
  }

  @computed((that: CxWorkingStateSelectView) => [
    that._cxWorkingState.agentStates,
  ])
  get agentStates(): AgentStateOption[] {
    return this._cxWorkingState.agentStates.map((state) => ({
      ...state,
      color: agentStatesColors[state.agentState] || 'grey',
      title: state.agentAuxState || state.agentState,
    }));
  }

  @computed((that: CxWorkingStateSelectView) => [
    that.agentStates,
    that._cxWorkingState.workingState,
  ])
  get currentStateIndex(): number {
    const { workingState } = this._cxWorkingState;
    return this.agentStates.findIndex(
      (state) =>
        state.agentAuxState === workingState.agentAuxState &&
        state.agentState === workingState.agentState,
    );
  }

  @computed((that: CxWorkingStateSelectView) => [
    that._cxWorkingState.workingState,
  ])
  get stateText(): string {
    const { workingState } = this._cxWorkingState;
    return workingState.agentAuxState || workingState.agentState;
  }

  @computed((that: CxWorkingStateSelectView) => [
    that._cxWorkingState.workingState,
  ])
  get isBreak(): boolean {
    const { isOnBreakOrAway, isOnLunch } = this._cxWorkingState;
    return isOnBreakOrAway || isOnLunch;
  }

  get maxBreakTime(): number {
    return this._cxWorkingState.maxBreakTime;
  }

  /**
   * Compute state indicator color based on interval time and break status
   */
  getStateColor(intervalTime: number): string {
    if (this.isBreak && this._checkOverTime(intervalTime)) {
      return 'red';
    }
    return (
      agentStatesColors[this._cxWorkingState.workingState.agentState] || 'grey'
    );
  }

  /**
   * Compute timer display text based on interval time and break status
   */
  getTimerText(intervalTime: number): string {
    if (this._checkOverTime(intervalTime)) {
      return `-${getClockByTimestamp(intervalTime - this.maxBreakTime)}`;
    }
    if (this.isBreak && this.maxBreakTime > 0) {
      const remaining = Math.max(0, this.maxBreakTime - intervalTime);
      return getClockByTimestamp(remaining, { useCeil: true });
    }
    return getClockByTimestamp(intervalTime);
  }

  /**
   * Handle interval time update and trigger break-time alert when exceeded
   */
  handleWithIntervalTime(intervalTime: number): void {
    const isOverTime = this._checkOverTime(intervalTime);
    if (
      this._oldIntervalTime < this.maxBreakTime &&
      isOverTime &&
      this.isBreak
    ) {
      this._cxWorkingState.alertOverBreakTime();
    }
    this._oldIntervalTime = intervalTime;
  }

  /**
   * Change agent working state
   */
  changeWorkingState(state: AgentStateOption): void {
    this._cxWorkingState.changeWorkingState(state);
  }

  private _checkOverTime(intervalTime: number): boolean {
    return (
      this.isBreak && this.maxBreakTime > 0 && intervalTime > this.maxBreakTime
    );
  }

  component(_props?: CxWorkingStateSelectViewProps) {
    const {
      agentStates,
      currentStateIndex,
      stateText,
      time,
      isPendingDisposition,
    } = useConnector(() => ({
      agentStates: this.agentStates,
      currentStateIndex: this.currentStateIndex,
      stateText: this.stateText,
      time: this._cxWorkingState.time,
      isPendingDisposition: this._cxWorkingState.isPendingDisposition,
    }));

    const [intervalTime, setIntervalTime] = useState(
      () => Date.now() - time,
    );

    useEffect(() => {
      const updateTimer = () => {
        const newIntervalTime = Date.now() - time;
        this.handleWithIntervalTime(newIntervalTime);
        setIntervalTime(newIntervalTime);
      };
      updateTimer();
      const timerId = setInterval(updateTimer, 1000);
      return () => clearInterval(timerId);
    }, [time]);

    const timerText = this.getTimerText(intervalTime);
    const stateColor = this.getStateColor(intervalTime);
    const isOverTime = this._checkOverTime(intervalTime);

    const handleChangeState = useCallback(
      (state: AgentStateOption) => {
        this.changeWorkingState(state);
      },
      [],
    );

    return (
      <WorkingStateSelect
        agentStates={agentStates}
        currentStateIndex={currentStateIndex}
        stateText={stateText}
        stateColor={stateColor}
        timerText={timerText}
        isOverTime={isOverTime}
        onChangeState={handleChangeState}
        disabled={isPendingDisposition}
        className={_props?.className}
        data-sign="workingStateSelect"
      />
    );
  }
}

export { CxWorkingStateSelectView };
