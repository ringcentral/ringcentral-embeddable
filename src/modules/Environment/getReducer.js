export function getAppKeyReducer({ types }) {
  return (state = '', { type, appKey }) => {
    if (type === types.setData) return appKey;
    return state;
  };
}

export function getAppSecretReducer({ types }) {
  return (state = '', { type, appSecret }) => {
    if (type === types.setData) return appSecret;
    return state;
  };
}
