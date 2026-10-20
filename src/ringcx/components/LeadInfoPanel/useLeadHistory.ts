import { useCallback, useEffect, useRef, useState } from 'react';

import type { CxLeadHistoryRecord } from '../../services/CxClient/interfaces';
import type {
  LeadHistoryState,
  LeadHistoryStatus,
  UseLeadHistoryOptions,
} from './LeadInfoPanel.interface';

/**
 * Loads a lead's past dial attempts when asked, or on mount with
 * `autoLoad`, and keeps the last answer while a refresh runs.
 */
export function useLeadHistory({
  leadId,
  loadLeadHistory,
  autoLoad = false,
}: UseLeadHistoryOptions): LeadHistoryState {
  const [status, setStatus] = useState<LeadHistoryStatus>('idle');
  const [records, setRecords] = useState<CxLeadHistoryRecord[]>([]);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );
  const load = useCallback(async () => {
    setStatus('loading');
    const history = await loadLeadHistory(leadId);
    if (!mountedRef.current) {
      return;
    }
    setRecords(history ?? []);
    setStatus(history ? 'loaded' : 'failed');
  }, [leadId, loadLeadHistory]);
  useEffect(() => {
    if (autoLoad) {
      void load();
    }
    // Only on mount: a refresh is the agent's call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { status, records, load };
}
