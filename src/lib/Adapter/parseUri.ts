/**
 * Parse a URI string (query + hash) and return merged params.
 * Supports both query parameters and hash fragment parameters.
 */
export function parseUri(callbackUri: string): Record<string, string> {
  try {
    const url = new URL(callbackUri, 'http://placeholder');
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const hashString = url.hash ? url.hash.replace(/^#/, '') : '';
    const hashParams = hashString
      ? Object.fromEntries(new URLSearchParams(hashString).entries())
      : {};
    if (queryParams.error) {
      throw new Error(queryParams.error);
    }
    return {
      ...queryParams,
      ...hashParams,
    };
  } catch (err) {
    if (err instanceof Error && err.message) {
      throw err;
    }
    return {};
  }
}
