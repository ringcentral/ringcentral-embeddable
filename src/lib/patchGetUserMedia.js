if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices._$getUserMedia = navigator.mediaDevices.getUserMedia;
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    if (!document.hidden) {
      return navigator.mediaDevices._$getUserMedia(constraints);
    }
    // show alert if not response after 3s
    let timeout = setTimeout(() => {
      timeout = null;
      if (window.phone && window.phone.alert) {
        window.phone.alert.warning({
          message: 'allowMicrophonePermissionOnInactiveTab',
          ttl: 0,
        });
      }
    }, 3000);
    try {
      const result = await navigator.mediaDevices._$getUserMedia(constraints);
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      return result;
    } catch (e) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      throw e;
    }
  };
}
