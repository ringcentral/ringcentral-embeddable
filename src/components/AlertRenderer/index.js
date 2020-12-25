import React from 'react';

export function getAlertRenderer() {
  return (message) => {
    if (message.message === 'allowMicrophonePermissionOnInactiveTab') {
      return () => 'Please go to your first opened tab with this widget to allow microphone permission for this call.';
    }
    return null;
  };
}
