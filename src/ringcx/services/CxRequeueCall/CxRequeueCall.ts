import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import { requeueEvents } from '../../enums';
import { t } from './i18n';
import { CxClient } from '../CxClient';
import type { CxBaseCall } from '../CxClient/interfaces';
import { CxAuth } from '../CxAuth';
import { CxCall } from '../CxCall';
import { CxActiveCallControl } from '../CxActiveCallControl';
import type {
  CxRequeueCallOptions,
  CxRequeueCallStatus,
} from './CxRequeueCall.interface';

/**
 * CxRequeueCall module - Call requeue operations
 * Handles requeuing calls to different queues
 */
@injectable({
  name: 'CxRequeueCall',
})
class CxRequeueCall extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxCall: CxCall,
    private activeCallControl: CxActiveCallControl,
    private toast: Toast,
    private storagePlugin: StoragePlugin,
    @optional('CxRequeueCallOptions')
    private cxRequeueCallOptions?: CxRequeueCallOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
  }

  @storage
  @state
  selectedQueueGroupId = '';

  @storage
  @state
  selectedGateId = '';

  @storage
  @state
  requeuing = false;

  /**
   * Check if the current call allows requeue
   */
  @computed((that: CxRequeueCall) => [
    that.cxCall.currentCall,
    that.cxAuth.agentPermissions,
  ])
  get allowRequeueCall(): boolean {
    const { currentCall } = this.cxCall;
    let result = true;
    if (currentCall && !currentCall.endedCall) {
      if (!currentCall.allowRequeue) {
        result = false;
      } else if (
        !this.cxAuth.agentPermissions?.allowCrossQueueRequeue &&
        currentCall.callType === 'OUTBOUND' &&
        currentCall.requeueType === 'ADVANCED'
      ) {
        result = false;
      } else if (!this._hasRequeueQueues(currentCall)) {
        result = false;
      }
    }
    return result;
  }

  @action
  setStatus({
    selectedQueueGroupId,
    selectedGateId,
    requeuing,
  }: CxRequeueCallStatus) {
    if (selectedQueueGroupId !== undefined) {
      this.selectedQueueGroupId = selectedQueueGroupId;
    }
    if (selectedGateId !== undefined) {
      this.selectedGateId = selectedGateId;
    }
    if (requeuing !== undefined) {
      this.requeuing = requeuing;
    }
  }

  /**
   * Requeue the current call to a different queue.
   *
   * @param maintain keep the agent on the call (Ask first), holding the
   * customer while the queue finds an agent
   */
  async requeueCall({ maintain = false }: { maintain?: boolean } = {}): Promise<void> {
    try {
      this.setStatus({ requeuing: true });
      this.toast.info({
        message: t(requeueEvents.START),
      });

      const result = await this.cxClient.requeueCall({
        maintain,
        queueId: this.selectedGateId,
      });

      if (result.status === 'FAILURE') {
        throw new Error('Requeue failed');
      }

      if (maintain) {
        await this.activeCallControl.hold();
      }

      this.toast.success({
        message: t(requeueEvents.SUCCESS),
      });
    } catch (error) {
      this.toast.danger({
        message: t(requeueEvents.FAILURE),
      });
      throw error;
    } finally {
      this.setStatus({ requeuing: false });
    }
  }

  /**
   * Check if the call has requeue queues available
   */
  private _hasRequeueQueues(currentCall: CxBaseCall): boolean {
    let result = false;
    if (currentCall.requeueType === 'ADVANCED') {
      const queues = this.cxAuth.availableQueues;
      result = queues && queues.length > 0;
    } else {
      const shortcuts = currentCall.requeueShortcuts;
      result = shortcuts && shortcuts.length > 0;
    }
    return result;
  }
}

export { CxRequeueCall };
