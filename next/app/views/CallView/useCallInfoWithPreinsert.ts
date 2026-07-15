import { useConnector } from '@ringcentral-integration/next-core';
import { useRef } from 'react';

import type { CallAction } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  sessionStatus,
  useActiveCallInfoWithPreinsert,
} from '@ringcentral-integration/micro-phone/src/app/services';

export type PreinsertCallInfo = CallAction['preInsertCallInfoList'][number];

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  const prev = ref.current;
  ref.current = value;
  return prev;
}

function usePreinsertCallInfo(
  getPreinsert: () => PreinsertCallInfo | undefined,
) {
  const curr = useConnector(getPreinsert);
  const prev = usePrevious(curr);

  if (curr) {
    return curr;
  }

  // when the preinsert call is superseded by the server-backed call there is
  // a one-render gap before activeCallInfo becomes available; keep the
  // previous preinsert while its webphone session is still alive so the call
  // control panel doesn't blank out during the handoff
  const webphoneSession = prev?.call.webphoneSession;
  if (
    webphoneSession &&
    webphoneSession.callStatus !== sessionStatus.finished
  ) {
    return prev;
  }

  return undefined;
}

/**
 * Render the outbound call as soon as the local webphone (SIP) session
 * exists, instead of waiting for the server telephony session event: prefer
 * the preinsert call info while the call is connecting, then fall through to
 * the regular server-backed active call info.
 */
export function useCallInfoWithPreinsert(
  callAction: CallAction,
  getPreinsert: () => PreinsertCallInfo | undefined,
) {
  const activeCallInfo = useActiveCallInfoWithPreinsert(callAction);
  const preinsertInfo = usePreinsertCallInfo(getPreinsert);

  return preinsertInfo ?? activeCallInfo;
}
