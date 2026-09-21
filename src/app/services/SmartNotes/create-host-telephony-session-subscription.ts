import type {
  TelephonySessionSubscriptionManager,
  TelephonySessionsListener,
  TelephonySessionsPayload,
} from './SmartNotes.interface';

const TELEPHONY_SESSIONS_EVENT = /\/telephony\/sessions(\?|$)/;

type SubscriptionMessage = {
  readonly event?: string;
  readonly body?: TelephonySessionsPayload;
};

function isTelephonySessionsPayload(
  body: TelephonySessionsPayload | undefined,
): body is TelephonySessionsPayload {
  return typeof body?.telephonySessionId === 'string' && Boolean(body.telephonySessionId);
}

function notifyListeners(
  listeners: Set<TelephonySessionsListener>,
  payload: TelephonySessionsPayload,
): void {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.error('SmartNotes telephony session listener failed.', error);
    }
  });
}

/**
 * Fans out SharedWorker WSG telephony-session events to Copilot.
 *
 * The plugin SDK uses the host OAuth access token, so it must not open a
 * second RingCentral websocket. Late Copilot subscribers also receive the
 * latest payload per session so live transcription can start mid-call.
 */
export function createHostTelephonySessionSubscription(): {
  readonly manager: TelephonySessionSubscriptionManager;
  handleMessage(message: unknown): void;
  dispose(): void;
} {
  const listeners = new Set<TelephonySessionsListener>();
  const latestBySessionId = new Map<string, TelephonySessionsPayload>();
  function replay(listener: TelephonySessionsListener): void {
    latestBySessionId.forEach((payload) => {
      try {
        listener(payload);
      } catch (error) {
        console.error('SmartNotes telephony session listener failed.', error);
      }
    });
  }
  function handleMessage(message: unknown): void {
    const subscriptionMessage = message as SubscriptionMessage | undefined;
    if (!subscriptionMessage?.event || !TELEPHONY_SESSIONS_EVENT.test(subscriptionMessage.event)) {
      return;
    }
    if (!isTelephonySessionsPayload(subscriptionMessage.body)) {
      return;
    }
    latestBySessionId.set(
      subscriptionMessage.body.telephonySessionId,
      subscriptionMessage.body,
    );
    notifyListeners(listeners, subscriptionMessage.body);
  }
  return {
    manager: {
      subscribeTelephonySessions(listener) {
        listeners.add(listener);
        replay(listener);
      },
      unsubscribeTelephonySessions(listener) {
        listeners.delete(listener);
      },
      dispose() {
        listeners.clear();
      },
    },
    handleMessage,
    dispose() {
      listeners.clear();
      latestBySessionId.clear();
    },
  };
}
