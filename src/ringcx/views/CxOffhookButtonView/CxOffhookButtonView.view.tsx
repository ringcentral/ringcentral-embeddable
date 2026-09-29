import {
  computed,
  injectable,
  optional,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import React, { useCallback } from 'react';
import { IconButton } from '@ringcentral/spring-ui';
import { AgentMd } from '@ringcentral/spring-icon';
import clsx from 'clsx';

import { CxSettings } from '../../services/CxSettings';
import { CxAuth } from '../../services/CxAuth';
import { CxCallMonitor } from '../../services/CxCallMonitor';
import { CxCall } from '../../services/CxCall';
import type {
  CxOffhookButtonViewOptions,
  CxOffhookButtonViewProps,
} from './CxOffhookButtonView.interface';
import type { OffhookState } from '../../services/CxSettings/CxSettings.interface';
import i18n from './i18n';

/**
 * CxOffhookButtonView - Offhook toggle button for Engage Voice agent
 * Displays agent offhook status with state-aware icon and tooltip
 */
@injectable({
  name: 'CxOffhookButtonView',
})
class CxOffhookButtonView extends RcViewModule {
  constructor(
    private _cxSettings: CxSettings,
    private _cxAuth: CxAuth,
    private _cxCallMonitor: CxCallMonitor,
    private _cxCall: CxCall,
    @optional('CxOffhookButtonViewOptions')
    private _options?: CxOffhookButtonViewOptions,
  ) {
    super();
  }

  /**
   * Whether the offhook button should be disabled
   * Matches old MainViewUI.isOffHookDisable logic
   */
  @computed((that: CxOffhookButtonView) => [
    that._cxSettings.isOffhooking,
    that._cxCallMonitor.isOnCall,
    that._cxCall.isDialing,
    that._cxAuth.agentPermissions,
  ])
  get isOffHookDisabled(): boolean {
    return (
      this._cxSettings.isOffhooking ||
      this._cxCallMonitor.isOnCall ||
      this._cxCall.isDialing ||
      !this._cxAuth.agentPermissions?.allowOffHook
    );
  }

  /**
   * Whether the offhook button should be hidden entirely
   */
  @computed((that: CxOffhookButtonView) => [that._cxAuth.agentPermissions])
  get hideOffHookBtn(): boolean {
    return !this._cxAuth.agentPermissions?.allowOffHook;
  }

  /**
   * Toggle offhook state (only when not disabled)
   */
  offhook(): void {
    if (!this.isOffHookDisabled) {
      this._cxSettings.offHook();
    }
  }

  /**
   * Get tooltip text based on current offhook state
   */
  private _getTooltipText(
    offhookState: OffhookState,
    isDisabled: boolean,
    isOffhooking: boolean,
    t: (key: string) => string,
  ): string {
    if (isDisabled && !isOffhooking) {
      return t('disabled');
    }
    switch (offhookState) {
      case 'connecting':
        return t('connecting');
      case 'disconnecting':
        return t('disconnecting');
      case 'disconnected':
        return t('turnOn');
      case 'connected':
      default:
        return t('turnOff');
    }
  }

  /**
   * Determine if the button is in a loading/transitioning state
   */
  private _isTransitioning(offhookState: OffhookState): boolean {
    return offhookState === 'connecting' || offhookState === 'disconnecting';
  }

  component(props?: CxOffhookButtonViewProps) {
    const { t } = useLocale(i18n);
    const {
      isOffhook,
      isOffhooking,
      offhookState,
      hideOffHookBtn,
      isOffHookDisabled,
    } = useConnector(() => ({
      isOffhook: this._cxSettings.isOffhook,
      isOffhooking: this._cxSettings.isOffhooking,
      offhookState: this._cxSettings.offhookState,
      hideOffHookBtn: this.hideOffHookBtn,
      isOffHookDisabled: this.isOffHookDisabled,
    }));
    const handleOffhook = useCallback(() => {
      this.offhook();
    }, []);
    if (hideOffHookBtn) {
      return null;
    }
    const isTransitioning = this._isTransitioning(offhookState);
    const tooltipText = this._getTooltipText(
      offhookState,
      isOffHookDisabled,
      isOffhooking,
      t,
    );
    return (
      <IconButton
        symbol={AgentMd}
        size="small"
        variant={isOffhook ? 'contained' : 'outlined'}
        color={isOffhook ? 'success' : 'neutral'}
        disabled={isOffHookDisabled}
        onClick={handleOffhook}
        aria-label={tooltipText}
        className={clsx(
          'flex-shrink-0',
          isTransitioning && 'animate-pulse',
          props?.className,
        )}
        TooltipProps={{
          title: tooltipText,
          triggerWhenDisabled: true,
        }}
      />
    );
  }
}

export { CxOffhookButtonView };
