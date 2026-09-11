import url from 'url';
import qs from 'qs';

export default function parseCallbackUri(callbackUri) {
  const { query, hash } = url.parse(callbackUri, true);
  const hashObject = hash ? qs.parse(hash.replace(/^#/, '')) : {};
  if (query.error) {
    const error = new Error(query.error);
    for (const key in query) {
      if (Object.prototype.hasOwnProperty.call(query, key)) {
        error[key] = query[key];
      }
    }
    throw error;
  }

  return {
    ...query,
    ...hashObject,
  };
}
