import uuid from 'uuid';

export default function requestWithPostMessage(path, body, timeout = 3000, target = window.parent, prefix = 'rc-post-message') {
  return new Promise((resolve, reject) => {
    const id = uuid.v4();
    let responseFunc;
    const catchTimeout = setTimeout(() => {
      window.removeEventListener('message', responseFunc);
      reject(Error('Time out'));
    }, timeout);
    responseFunc = (e) => {
      const data = e.data;
      if (
        data &&
        data.type === `${prefix}-response` &&
        data.responseId === id
      ) {
        clearTimeout(catchTimeout);
        window.removeEventListener('message', responseFunc);
        resolve(data.response);
      }
    };
    target.postMessage({
      type: `${prefix}-request`,
      requestId: id,
      path,
      body,
    }, '*');
    window.addEventListener('message', responseFunc);
  });
}
