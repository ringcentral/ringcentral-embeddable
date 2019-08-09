export default function hackSend(sdk) {
  const platform = sdk.platform();
  platform.originalSend = platform.send;
  const newSendFunc = (options) => {
    let { headers } = options;
    headers = {
      ...headers,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '-1'
    };
    return platform.originalSend({
      ...options,
      headers,
    });
  };
  platform.send = newSendFunc;
  return sdk;
}
