import {
  messageIsTextMessage,
} from '@ringcentral-integration/commons/lib/messageHelper';

export function findExistedConversation(conversations, phoneNumber) {
  return conversations.find((conversation) => {
    if (!conversation.to || conversation.to.length > 1) {
      return false;
    }
    if (!messageIsTextMessage(conversation)) {
      return false;
    }
    if (conversation.direction === 'Inbound') {
      return conversation.from && (
        conversation.from.phoneNumber === phoneNumber ||
        conversation.from.extensionNumber === phoneNumber
      );
    }
    return conversation.to.find(
      number => (
        number.phoneNumber === phoneNumber ||
        number.extensionNumber === phoneNumber
      )
    );
  });
}

export function setOutputDeviceWhenCall(webphone, audioSettings) {
  if (webphone._webphone) {
    if (webphone._remoteVideo && webphone._remoteVideo.setSinkId) {
      if (audioSettings.outputDeviceId === 'default') {
        const defaultDevice = audioSettings.outputDevice;
        const defaultDeviceLabel = defaultDevice.label;
        const deviceLabel = defaultDeviceLabel.split(' - ')[1];
        if (deviceLabel) {
          const device = audioSettings.availableOutputDevices.find(
            (device) => device.label === deviceLabel
          );
          if (device) {
            webphone._remoteVideo.setSinkId(device.deviceId);
          }
        }
      } else {
        webphone._remoteVideo.setSinkId(audioSettings.outputDeviceId);
      }
    }
  }
}

function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bStr = atob(arr[1]);
  let n = bStr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bStr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function getValidAttachments(attachments = []) {
  if (!attachments || !attachments.length) {
    return [];
  }
  const validAttachments = [];
  attachments.forEach((attachment) => {
    if (!attachment || !attachment.name || !attachment.content) {
      return;
    }
    if (typeof attachment.name !== 'string') {
      return;
    }
    if (typeof attachment.content !== 'string') {
      return;
    }
    // if is base64 url
    if (
      attachment.content.startsWith('data:') &&
      attachment.content.indexOf(';base64,') !== -1
    ) {
      const blob = dataURLtoBlob(attachment.content);
      validAttachments.push({
        name: attachment.name,
        file: blob,
        size: blob.size,
      });
    }
  });
  return validAttachments;
}
