const FILE_URL_PARAM = /[?&]fileUrl=([^&]+)/;

/**
 * VRU v1 recording URLs carry the storage bucket, region and API version.
 */
function isVruV1RecordingUrl(value: string): boolean {
  return (
    value.includes('bucket') && value.includes('region') && value.includes('v1')
  );
}

/**
 * VRU v2 recording URLs point at a dialog segment's asset.
 */
function isVruV2RecordingUrl(value: string): boolean {
  return (
    value.includes('/assets/') &&
    value.includes('/dialogs/') &&
    value.includes('/segments/') &&
    value.includes('/type')
  );
}

function isVruRecordingUrl(value: string): boolean {
  return isVruV1RecordingUrl(value) || isVruV2RecordingUrl(value);
}

/**
 * The recording a `recording-access` proxy URL wraps in its `fileUrl` param.
 */
function getWrappedFileUrl(value: string): string | null {
  const match = value.match(FILE_URL_PARAM);
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Whether a lead field holds a VRU recording URL, either bare or wrapped in a
 * `recording-access` proxy URL. Agent One plays such values instead of
 * showing them (`components/DataPairs/DataPairs.tsx`).
 */
export function isCxRecordingUrl(value: string): boolean {
  if (!value) {
    return false;
  }
  if (isVruRecordingUrl(value)) {
    return true;
  }
  const fileUrl = getWrappedFileUrl(value);
  return !!fileUrl && isVruRecordingUrl(fileUrl);
}
