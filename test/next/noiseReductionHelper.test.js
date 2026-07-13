import { Denoiser } from '../../next/app/services/NoiseReduction/Denoiser';
import { isSameOrigin } from '../../next/app/services/NoiseReduction/NoiseReduction.helper';

describe('Noise reduction helpers', () => {
  test('accepts relative and same-origin SDK URLs', () => {
    const location = { protocol: 'https:', host: 'app.example.com' };

    expect(isSameOrigin('/assets/noise-reduction', location)).toBe(true);
    expect(
      isSameOrigin('https://app.example.com/noise-reduction', location),
    ).toBe(true);
  });

  test('rejects cross-origin and malformed absolute SDK URLs', () => {
    const location = { protocol: 'https:', host: 'app.example.com' };

    expect(
      isSameOrigin('https://cdn.example.com/noise-reduction', location),
    ).toBe(false);
    expect(isSameOrigin('//cdn.example.com/noise-reduction', location)).toBe(
      false,
    );
    expect(isSameOrigin('http://[invalid', location)).toBe(false);
  });

  test('replaces the source audio track and releases tracks on disconnect', () => {
    const originalTrack = { stop: jest.fn() };
    const cleanTrack = { stop: jest.fn() };
    const stream = {
      id: 'source-stream',
      getAudioTracks: jest.fn(() => [originalTrack]),
      removeTrack: jest.fn(),
      addTrack: jest.fn(),
    };
    const sourceNode = {
      mediaStream: stream,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const destinationNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      stream: {
        getAudioTracks: jest.fn(() => [cleanTrack]),
        getTracks: jest.fn(() => [cleanTrack]),
      },
    };
    const filterNode = {
      isReady: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const audioContext = {
      createMediaStreamSource: jest.fn(() => sourceNode),
      createMediaStreamDestination: jest.fn(() => destinationNode),
    };
    const denoiser = new Denoiser({ audioContext, filterNode });

    expect(denoiser.connect(stream)).toBe(stream);
    expect(stream.removeTrack).toHaveBeenCalledWith(originalTrack);
    expect(stream.addTrack).toHaveBeenCalledWith(cleanTrack);

    denoiser.disconnect();

    expect(originalTrack.stop).toHaveBeenCalledTimes(1);
    expect(cleanTrack.stop).toHaveBeenCalledTimes(1);
    expect(denoiser.connected).toBe(false);
  });

  test('reuses an existing source stream and disconnects before switching streams', () => {
    const firstTrack = { stop: jest.fn() };
    const secondTrack = { stop: jest.fn() };
    const cleanTracks = [{ stop: jest.fn() }, { stop: jest.fn() }];
    const streams = [
      createStream('first', firstTrack),
      createStream('second', secondTrack),
    ];
    const sourceNodes = streams.map((stream) => ({
      mediaStream: stream,
      connect: jest.fn(),
      disconnect: jest.fn(),
    }));
    let sourceIndex = 0;
    const destinations = cleanTracks.map((cleanTrack) => ({
      disconnect: jest.fn(),
      stream: {
        getAudioTracks: jest.fn(() => [cleanTrack]),
        getTracks: jest.fn(() => [cleanTrack]),
      },
    }));
    let destinationIndex = 0;
    const denoiser = new Denoiser({
      audioContext: {
        createMediaStreamSource: jest.fn(() => sourceNodes[sourceIndex++]),
        createMediaStreamDestination: jest.fn(() => destinations[destinationIndex++]),
      },
      filterNode: { isReady: true, connect: jest.fn(), disconnect: jest.fn() },
    });

    expect(denoiser.connect(streams[0])).toBe(streams[0]);
    expect(denoiser.connect(streams[0])).toBe(streams[0]);
    expect(sourceIndex).toBe(1);

    expect(denoiser.connect(streams[1])).toBe(streams[1]);
    expect(firstTrack.stop).toHaveBeenCalledTimes(1);
    expect(cleanTracks[0].stop).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['a filter that is not ready', { isReady: false, connect: jest.fn() }, true],
    ['a destination without a clean track', { isReady: true, connect: jest.fn() }, false],
  ])('keeps the source stream when using %s', (_label, filterNode, hasCleanTrack) => {
    const originalTrack = { stop: jest.fn() };
    const stream = createStream('source', originalTrack);
    const sourceNode = { mediaStream: stream, connect: jest.fn(), disconnect: jest.fn() };
    const destinationNode = {
      disconnect: jest.fn(),
      stream: {
        getAudioTracks: jest.fn(() => (hasCleanTrack ? [{ stop: jest.fn() }] : [])),
        getTracks: jest.fn(() => []),
      },
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const denoiser = new Denoiser({
      audioContext: {
        createMediaStreamSource: jest.fn(() => sourceNode),
        createMediaStreamDestination: jest.fn(() => destinationNode),
      },
      filterNode,
    });

    expect(denoiser.connect(stream)).toBe(stream);
    expect(stream.removeTrack).not.toHaveBeenCalled();
    denoiser.disconnect();

    consoleError.mockRestore();
  });

  test('does nothing when disconnected before connecting', () => {
    const denoiser = new Denoiser({
      audioContext: {},
      filterNode: { isReady: true },
    });

    expect(denoiser.connected).toBe(false);
    expect(() => denoiser.disconnect()).not.toThrow();
  });
});

function createStream(id, track) {
  return {
    id,
    getAudioTracks: jest.fn(() => [track]),
    removeTrack: jest.fn(),
    addTrack: jest.fn(),
  };
}
