import React from 'react';
import { render } from '@testing-library/react';

import { useCallInfoWithPreinsert } from '../../next/app/views/CallView/useCallInfoWithPreinsert';

const mockUseActiveCallInfoWithPreinsert = jest.fn();

jest.mock('@ringcentral-integration/micro-phone/src/app/services', () => ({
  sessionStatus: { connected: 'connected', finished: 'finished' },
  useActiveCallInfoWithPreinsert: (...args) =>
    mockUseActiveCallInfoWithPreinsert(...args),
}));

let lastResult;

function Probe({ callAction, getPreinsert }) {
  lastResult = useCallInfoWithPreinsert(callAction, getPreinsert);
  return null;
}

function renderProbe(getPreinsert, activeCallInfo) {
  mockUseActiveCallInfoWithPreinsert.mockReturnValue(activeCallInfo);
  const utils = render(<Probe callAction={{}} getPreinsert={getPreinsert} />);
  return {
    rerenderProbe: (nextGetPreinsert, nextActiveCallInfo) => {
      mockUseActiveCallInfoWithPreinsert.mockReturnValue(nextActiveCallInfo);
      utils.rerender(
        <Probe callAction={{}} getPreinsert={nextGetPreinsert} />,
      );
    },
  };
}

describe('useCallInfoWithPreinsert', () => {
  beforeEach(() => {
    lastResult = undefined;
    mockUseActiveCallInfoWithPreinsert.mockReset();
  });

  test('prefers the connecting preinsert call over the active call info', () => {
    const preinsertInfo = {
      call: { sessionId: 'pre_insert_id_1', webphoneSession: {} },
      meta: { open: true },
    };
    const activeInfo = { call: { sessionId: 'server-1' }, meta: {} };

    renderProbe(() => preinsertInfo, activeInfo);

    expect(lastResult).toBe(preinsertInfo);
  });

  test('falls through to the active call info when no preinsert call', () => {
    const activeInfo = { call: { sessionId: 'server-1' }, meta: {} };

    renderProbe(() => undefined, activeInfo);

    expect(lastResult).toBe(activeInfo);
  });

  test('keeps the previous preinsert call for one render during the handoff', () => {
    const preinsertInfo = {
      call: {
        sessionId: 'pre_insert_id_1',
        webphoneSession: { callStatus: 'connected' },
      },
      meta: { open: true },
    };
    const activeInfo = { call: { sessionId: 'server-1' }, meta: {} };

    const { rerenderProbe } = renderProbe(() => preinsertInfo, undefined);
    expect(lastResult).toBe(preinsertInfo);

    // preinsert removed but the server-backed info not selected yet: bridge
    // the gap with the previous preinsert call
    rerenderProbe(() => undefined, undefined);
    expect(lastResult).toBe(preinsertInfo);

    // next render falls through to the active call info
    rerenderProbe(() => undefined, activeInfo);
    expect(lastResult).toBe(activeInfo);
  });

  test('does not keep the previous preinsert call when its session finished', () => {
    const preinsertInfo = {
      call: {
        sessionId: 'pre_insert_id_1',
        webphoneSession: { callStatus: 'finished' },
      },
      meta: { open: true },
    };

    const { rerenderProbe } = renderProbe(() => preinsertInfo, undefined);
    expect(lastResult).toBe(preinsertInfo);

    rerenderProbe(() => undefined, undefined);
    expect(lastResult).toBeUndefined();
  });
});
