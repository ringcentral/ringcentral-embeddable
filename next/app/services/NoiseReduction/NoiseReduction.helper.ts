export function isSameOrigin(
  uri: string,
  location: Pick<Location, 'host' | 'protocol'>,
): boolean {
  try {
    const url = new URL(uri, `${location.protocol}//${location.host}/`);
    return location.protocol === url.protocol && location.host === url.host;
  } catch {
    return false;
  }
}
