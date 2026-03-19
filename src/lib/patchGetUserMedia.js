if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices._$getUserMedia = navigator.mediaDevices.getUserMedia;
  
  /**
   * Helper function to handle OverconstrainedError by relaxing deviceId constraints.
   * Firefox throws OverconstrainedError when:
   * 1. deviceId is an empty string with 'exact' constraint
   * 2. deviceId doesn't exist in the system
   * 
   * This function converts 'exact' constraints to 'ideal' or removes them entirely,
   * allowing Firefox to fall back to any available device.
   */
  const handleGetUserMediaError = async (originalConstraints, originalError) => {
    // Only handle OverconstrainedError on deviceId
    if (originalError.name !== 'OverconstrainedError' || originalError.constraint !== 'deviceId') {
      throw originalError;
    }

    const fallbackConstraints = { ...originalConstraints };

    // Check if audio constraints exist and have a deviceId property
    if (fallbackConstraints.audio && typeof fallbackConstraints.audio === 'object') {
      const deviceId = fallbackConstraints.audio.deviceId?.exact;
      
      if (deviceId !== undefined) {
        fallbackConstraints.audio = { ...fallbackConstraints.audio };
        
        // If deviceId is empty or falsy, remove the constraint entirely
        // This allows the browser to select any available audio device
        if (!deviceId || deviceId === '') {
          delete fallbackConstraints.audio.deviceId;
        } else {
          // For valid device IDs, downgrade from 'exact' to 'ideal' constraint
          // This allows Firefox to use an alternative device if the exact one isn't available
          fallbackConstraints.audio.deviceId = { ideal: deviceId };
        }

        // Retry getUserMedia with relaxed constraints
        return await navigator.mediaDevices._$getUserMedia(fallbackConstraints);
      }
    }

    // If we can't handle the error, re-throw it
    throw originalError;
  };

  navigator.mediaDevices.getUserMedia = async (constraints) => {
    if (!document.hidden) {
      try {
        return await navigator.mediaDevices._$getUserMedia(constraints);
      } catch (e) {
        // Try to recover from OverconstrainedError by relaxing constraints
        return await handleGetUserMediaError(constraints, e);
      }
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
      try {
        const result = await navigator.mediaDevices._$getUserMedia(constraints);
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        return result;
      } catch (e) {
        // Try to recover from OverconstrainedError by relaxing constraints
        const result = await handleGetUserMediaError(constraints, e);
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        return result;
      }
    } catch (e) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      throw e;
    }
  };
}
