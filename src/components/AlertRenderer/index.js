import React from 'react';

export function getAlertRenderer() {
  return (message) => {
    if (message.message === 'allowMicrophonePermissionOnInactiveTab') {
      return () => 'Please go to your first opened tab with this widget to allow microphone permission for this call.';
    }
    if (message.message === 'popupWindowOpened') {
      return () => 'You have a popup window opened.';
    }
    if (message.message === 'cannotPopupWindowWithCall') {
      return () => 'Sorry, app can\'t open popup window when there are active calls.';
    }
    if (message.message === 'stopRecordDisabled') {
      return () => 'Sorry, stopping recording is not supported for this call.';
    }
    if (message.message.startsWith('showCustomAlertMessage')) {
      return () => message.message.split(':')[1];
    }
    return null;
  };
}
