const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
let lastUserMediaStreams = null;
let lastGetUserMediaTimestamp = null;
let getUserMediaPromise = null;

if (isFirefox && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices._$getUserMedia = navigator.mediaDevices.getUserMedia;
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    if (
      lastGetUserMediaTimestamp &&
      Date.now() - lastGetUserMediaTimestamp < 3000 &&
      lastUserMediaStreams
    ) {
      return lastUserMediaStreams;
    }
    let streams;
    try {
      if (!getUserMediaPromise) {
        getUserMediaPromise = navigator.mediaDevices._$getUserMedia(constraints);
      }
      streams = await getUserMediaPromise;
      lastUserMediaStreams = streams;
      lastGetUserMediaTimestamp = Date.now();
      getUserMediaPromise = null;
    } catch (e) {
      getUserMediaPromise = null;
      lastUserMediaStreams = null;
      throw e;
    }
    return streams;
  };
}
