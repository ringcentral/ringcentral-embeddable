import {
  action,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import { CxCallbackTypes } from '../CxClient/enums';
import { CxClient } from '../CxClient';
import type {
  CxDispositionSummaryErrorResponse,
  CxDispositionSummaryPhaseResponse,
} from '../CxClient/interfaces';
import { CxPresence } from '../CxPresence';
import { CxSubscription } from '../CxSubscription';
import type {
  CxCallSummaryState,
  CxCallSummaryStateMapping,
  CxCallDispositionOptions,
  CxCallDispositionData,
  CxCallDispositionMapping,
  CxDispositionState,
  CxDispositionStateMapping,
} from './CxCallDisposition.interface';

/** How long streamed summary phases are collected before being applied. */
const SUMMARY_FLUSH_INTERVAL = 200;

/**
 * CxCallDisposition module - Call disposition management
 * Handles call disposition selection and submission
 */
@injectable({
  name: 'CxCallDisposition',
})
class CxCallDisposition extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxPresence: CxPresence,
    private cxSubscription: CxSubscription,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    @optional('CxCallDispositionOptions')
    private evCallDispositionOptions?: CxCallDispositionOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  @storage
  @state
  callsMapping: CxCallDispositionMapping = {};

  @storage
  @state
  dispositionStateMapping: CxDispositionStateMapping = {};

  @state
  callSummaryMapping: CxCallSummaryStateMapping = {};

  private _pendingSummaryPhases = new Map<
    string,
    CxDispositionSummaryPhaseResponse[]
  >();

  private _summaryFlushTimer?: ReturnType<typeof setTimeout>;

  @action
  setDisposition(id: string, data: CxCallDispositionData) {
    this.callsMapping[id] = data;
  }

  @action
  removeDisposition(id: string) {
    delete this.callsMapping[id];
    delete this.callSummaryMapping[id];
  }

  @action
  setDispositionState(id: string, state: CxDispositionState) {
    this.dispositionStateMapping[id] = state;
  }

  @action
  startSummaryRequest(callId: string, segmentId: string) {
    this.callSummaryMapping[callId] = {
      segmentId,
      orderedPhases: {},
      summary: '',
      isFinal: false,
      isLoading: true,
      isEditedAfterFinal: false,
    };
    const currentDisposition = this.callsMapping[callId];
    if (!currentDisposition) {
      this.callsMapping[callId] = {
        dispositionId: null,
        notes: '',
        summary: '',
      };
      return;
    }
    this.callsMapping[callId].summary = '';
  }

  @action
  setSummaryRequestError(callId: string, segmentId?: string) {
    const currentSummaryState = this.callSummaryMapping[callId];
    if (!currentSummaryState) {
      return;
    }
    if (segmentId && currentSummaryState.segmentId !== segmentId) {
      return;
    }
    currentSummaryState.isLoading = false;
  }

  @action
  upsertSummaryPhases(
    callId: string,
    phases: readonly CxDispositionSummaryPhaseResponse[],
  ) {
    const currentSummaryState = this.callSummaryMapping[callId];
    if (!currentSummaryState) {
      return;
    }
    let hasAcceptedPhase = false;
    phases.forEach((phase) => {
      const sequence = Number(phase.sequenceNo);
      if (Number.isNaN(sequence)) {
        this.logger.warn('Invalid summary sequence number', phase.sequenceNo);
        return;
      }
      if (String(currentSummaryState.segmentId) !== String(phase.segmentId)) {
        return;
      }
      currentSummaryState.orderedPhases[sequence] = phase.summary ?? '';
      currentSummaryState.isFinal = currentSummaryState.isFinal || phase.final;
      hasAcceptedPhase = true;
    });
    if (!hasAcceptedPhase) {
      return;
    }
    const aggregatedSummary = this.buildSummaryBySequence(currentSummaryState.orderedPhases);
    currentSummaryState.summary = aggregatedSummary;
    currentSummaryState.isLoading = !currentSummaryState.isFinal;
    if (!currentSummaryState.isEditedAfterFinal) {
      this.setSummary(callId, aggregatedSummary, false);
    }
  }

  @action
  setSummary(callId: string, summary: string, shouldMarkEdited = true) {
    const currentDisposition = this.callsMapping[callId];
    const previousSummary = currentDisposition?.summary ?? '';
    if (!currentDisposition) {
      this.callsMapping[callId] = {
        dispositionId: null,
        notes: '',
        summary,
      };
    } else {
      currentDisposition.summary = summary;
    }
    const currentSummaryState = this.callSummaryMapping[callId];
    if (!shouldMarkEdited || !currentSummaryState || !currentSummaryState.isFinal) {
      return;
    }
    if (previousSummary === summary) {
      return;
    }
    currentSummaryState.isEditedAfterFinal = true;
  }

  getSummaryState(callId: string): CxCallSummaryState | undefined {
    return this.callSummaryMapping[callId];
  }

  override onInitOnce() {
    // Set default disposition when call is answered
    // This would typically be connected to CxCallMonitor events
  }

  /**
   * A summary streams in as one phase per fragment, so applying each one as
   * its own state update floods every port with patches for text the agent
   * reads once. Phases are collected instead and written in batches, and the
   * final phase is written straight away so the summary never looks unfinished.
   */
  private _bufferSummaryPhase(
    callId: string,
    phase: CxDispositionSummaryPhaseResponse,
  ): void {
    const pending = this._pendingSummaryPhases.get(callId) ?? [];
    pending.push(phase);
    this._pendingSummaryPhases.set(callId, pending);
    if (phase.final) {
      this._flushSummaryPhases();
      return;
    }
    if (this._summaryFlushTimer) {
      return;
    }
    this._summaryFlushTimer = setTimeout(
      () => this._flushSummaryPhases(),
      SUMMARY_FLUSH_INTERVAL,
    );
  }

  private _flushSummaryPhases(): void {
    if (this._summaryFlushTimer) {
      clearTimeout(this._summaryFlushTimer);
      this._summaryFlushTimer = undefined;
    }
    const batches = [...this._pendingSummaryPhases.entries()];
    this._pendingSummaryPhases.clear();
    batches.forEach(([callId, phases]) => {
      this.upsertSummaryPhases(callId, phases);
    });
  }

  private initialize() {
    this.cxSubscription.subscribe(
      CxCallbackTypes.SUMMARY,
      (phase?: CxDispositionSummaryPhaseResponse) => {
        if (!phase || phase.status !== 'OK' || phase.type !== 'SUMMARY') {
          return;
        }
        const callId = this.getCallIdBySegmentId(String(phase.segmentId));
        if (!callId) {
          return;
        }
        this._bufferSummaryPhase(callId, phase);
      },
    );
    this.cxSubscription.subscribe(
      CxCallbackTypes.SUMMARY_ERROR,
      (error?: CxDispositionSummaryErrorResponse) => {
        if (error?.segmentId) {
          const callId = this.getCallIdBySegmentId(error.segmentId);
          if (callId) {
            this.setSummaryRequestError(callId, error.segmentId);
          }
          return;
        }
        const callIds = Object.keys(this.callSummaryMapping);
        callIds.forEach((callId) => this.setSummaryRequestError(callId));
      },
    );
  }

  /**
   * Dispose a call with the selected disposition
   * Includes safety check to ensure callDisposition exists
   */
  async disposeCall(id: string) {
    const call = this.cxPresence.callsMapping[id];
    const callDisposition = this.callsMapping[id];
    // Safety check - return early if no disposition data
    if (!callDisposition) {
      return;
    }
    const isDisposed =
      this.dispositionStateMapping[id] &&
      this.dispositionStateMapping[id].disposed;
    if (!call?.outdialDispositions || isDisposed) {
      return;
    }
    await this.cxClient.dispositionCall({
      uii: call.uii,
      dispId: callDisposition.dispositionId || '',
      notes: callDisposition.notes,
    });
    this.setDispositionState(id, { disposed: true });
  }

  /**
   * Initialize disposition for a call with default value
   */
  initDisposition(callId: string, outdialDispositions: any) {
    if (outdialDispositions) {
      const disposition = outdialDispositions.dispositions?.find(
        (d: any) => d.isDefault,
      );
      this.setDisposition(callId, {
        dispositionId: disposition ? disposition.dispositionId : null,
        notes: '',
        summary: '',
      });
    }
  }

  /**
   * Get disposition for a specific call
   */
  getDisposition(id: string): CxCallDispositionData | undefined {
    return this.callsMapping[id];
  }

  /**
   * Check if a call has been disposed
   */
  isDisposed(id: string): boolean {
    return this.dispositionStateMapping[id]?.disposed || false;
  }

  private buildSummaryBySequence(orderedPhases: Record<number, string>): string {
    return Object.keys(orderedPhases)
      .map((key) => Number(key))
      .sort((left, right) => left - right)
      .map((sequence) => orderedPhases[sequence])
      .join('');
  }

  private getCallIdBySegmentId(segmentId: string): string {
    const callIds = Object.keys(this.callSummaryMapping);
    const segmentIdValue = String(segmentId);
    return callIds.find((callId) => {
      const currentSegmentId = this.callSummaryMapping[callId]?.segmentId;
      return String(currentSegmentId) === segmentIdValue;
    }) || '';
  }
}

export { CxCallDisposition };
