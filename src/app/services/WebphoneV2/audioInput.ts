import type { AudioSettings } from '@ringcentral-integration/micro-phone/src/app/services/AudioSettings';

/**
 * Resolves the `audio` constraint for the webphone's outbound stream.
 *
 * Mirrors the helper the micro/next webphone uses, implemented here because the
 * installed `AudioSettings` does not expose `getInputDeviceOptions`. Devices are
 * re-enumerated first because browsers can change a `deviceId` out from under a
 * stored setting; if the exact id is no longer accepted we fall back to `true`
 * and let the browser pick, which is better than failing to get a mic at all.
 */
export const getInputDeviceOptions = async (
  audioSettings: Pick<AudioSettings, 'checkDevices' | 'inputDeviceId'>,
  deviceId?: string,
): Promise<boolean | MediaTrackConstraints> => {
  try {
    await audioSettings.checkDevices();
  } catch {
    // Enumeration can fail before permission is granted; the probe below still
    // gives the browser a chance to prompt.
  }
  const resolvedDeviceId = deviceId ?? audioSettings.inputDeviceId;
  if (!resolvedDeviceId) return true;
  const getUserMedia = globalThis.navigator?.mediaDevices?.getUserMedia;
  if (!getUserMedia) return true;
  const constraints: MediaTrackConstraints = {
    deviceId: { exact: resolvedDeviceId },
  };
  try {
    // Probe whether the browser honours the exact id before handing these
    // constraints to the peer connection.
    const stream = await globalThis.navigator.mediaDevices.getUserMedia({
      audio: constraints,
      video: false,
    });
    stream.getTracks().forEach((track) => track.stop());
    return constraints;
  } catch {
    return true;
  }
};
