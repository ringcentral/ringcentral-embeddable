const TRAILING_SLASH_PATTERN = /\/+$/;

/**
 * Returns the absolute URL of the folder that hosts the built app files,
 * without the trailing slash.
 *
 * Root relative asset paths such as `/assets/rc/logo.svg` must be appended to
 * it instead of to `location.origin`, otherwise they break whenever the build
 * is deployed into a sub folder, for example
 * `chrome-extension://<id>/embeddable/app.html`.
 */
export const getAssetBaseUrl = (): string => {
  const href = globalThis.location?.href;
  if (!href) {
    return '';
  }
  try {
    return new URL('.', href).toString().replace(TRAILING_SLASH_PATTERN, '');
  } catch {
    return globalThis.location?.origin ?? '';
  }
};
