function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function requestWithPostMessage(
  path: string,
  body?: unknown,
  timeout = 3000,
  target: Window | null = window.parent,
  prefix = 'rc-post-message',
) {
  return new Promise<any>((resolve, reject) => {
    if (!target) {
      reject(new Error('Target window is not available'));
      return;
    }

    const id = createRequestId();
    let responseFunc: ((event: MessageEvent) => void) | null = null;
    const catchTimeout = window.setTimeout(() => {
      if (responseFunc) {
        window.removeEventListener('message', responseFunc);
      }
      reject(new Error('Time out'));
    }, timeout);

    responseFunc = (event: MessageEvent) => {
      const data = event.data;
      if (
        data &&
        data.type === `${prefix}-response` &&
        data.responseId === id
      ) {
        window.clearTimeout(catchTimeout);
        window.removeEventListener('message', responseFunc!);
        resolve(data.response);
      }
    };

    target.postMessage(
      {
        type: `${prefix}-request`,
        requestId: id,
        path,
        body,
      },
      '*',
    );
    window.addEventListener('message', responseFunc);
  });
}
