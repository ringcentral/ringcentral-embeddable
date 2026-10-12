const {
  getInputDeviceOptions,
} = require('../../src/app/services/WebphoneV2/audioInput');

function createAudioSettings(inputDeviceId = 'mic-1') {
  return {
    inputDeviceId,
    checkDevices: jest.fn(async () => undefined),
  };
}

function mockGetUserMedia(impl) {
  const getUserMedia = jest.fn(impl);
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
  return getUserMedia;
}

function createStream() {
  const track = { stop: jest.fn() };
  return { stream: { getTracks: () => [track] }, track };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis.navigator, 'mediaDevices');
});

it('re-enumerates devices before resolving constraints', async () => {
  const audioSettings = createAudioSettings();
  mockGetUserMedia(async () => createStream().stream);

  await getInputDeviceOptions(audioSettings);

  expect(audioSettings.checkDevices).toHaveBeenCalledTimes(1);
});

it('returns exact constraints when the browser accepts the deviceId', async () => {
  const { stream, track } = createStream();
  const getUserMedia = mockGetUserMedia(async () => stream);

  await expect(getInputDeviceOptions(createAudioSettings('mic-1'))).resolves.toEqual(
    { deviceId: { exact: 'mic-1' } },
  );
  expect(getUserMedia).toHaveBeenCalledWith({
    audio: { deviceId: { exact: 'mic-1' } },
    video: false,
  });
  // The probe stream must not be left running, or the mic stays busy.
  expect(track.stop).toHaveBeenCalledTimes(1);
});

it('prefers an explicitly passed deviceId over the stored setting', async () => {
  const getUserMedia = mockGetUserMedia(async () => createStream().stream);

  await expect(
    getInputDeviceOptions(createAudioSettings('stored'), 'explicit'),
  ).resolves.toEqual({ deviceId: { exact: 'explicit' } });
  expect(getUserMedia).toHaveBeenCalledWith({
    audio: { deviceId: { exact: 'explicit' } },
    video: false,
  });
});

it('falls back to true when the exact deviceId is rejected', async () => {
  mockGetUserMedia(async () => {
    throw new Error('OverconstrainedError');
  });

  await expect(
    getInputDeviceOptions(createAudioSettings('stale-id')),
  ).resolves.toBe(true);
});

it('falls back to true when no deviceId is configured', async () => {
  const getUserMedia = mockGetUserMedia(async () => createStream().stream);

  await expect(getInputDeviceOptions(createAudioSettings(''))).resolves.toBe(
    true,
  );
  expect(getUserMedia).not.toHaveBeenCalled();
});

it('falls back to true when getUserMedia is unavailable', async () => {
  await expect(getInputDeviceOptions(createAudioSettings('mic-1'))).resolves.toBe(
    true,
  );
});

it('still probes when device enumeration fails', async () => {
  const audioSettings = createAudioSettings('mic-1');
  audioSettings.checkDevices.mockRejectedValue(new Error('not permitted yet'));
  mockGetUserMedia(async () => createStream().stream);

  await expect(getInputDeviceOptions(audioSettings)).resolves.toEqual({
    deviceId: { exact: 'mic-1' },
  });
});
