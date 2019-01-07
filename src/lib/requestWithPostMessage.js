import uuid from 'uuid';

export default function requestWithPostMessage(path, body, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const id = uuid.v4();
    let responseFunc;
    const catchTimeout = setTimeout(() => {
      window.removeEventListener('message', responseFunc);
      reject('Time out');
    }, timeout);
    responseFunc = (e) => {
      const data = e.data;
      if (
        data &&
        data.type === 'rc-post-message-response' &&
        data.responseId === id
      ) {
        clearTimeout(catchTimeout);
        window.removeEventListener('message', responseFunc);
        resolve(data.response);
      }
    };
    window.parent.postMessage({
      type: 'rc-post-message-request',
      requestId: id,
      path,
      body,
    }, '*');
    window.addEventListener('message', responseFunc);
  });
}
