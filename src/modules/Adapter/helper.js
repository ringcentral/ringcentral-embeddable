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
    audioSettings.getUserMedia(); // refresh audio devices
  }
}

const SUPPORTED_MIME = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/svg+xml',
  'video/3gpp',
  'video/mp4',
  'video/mpeg',
  'video/msvideo',
  'audio/mpeg',
  'text/vcard',
  'application/zip',
  'application/gzip',
  'application/rtf'
];

function dataURLtoBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  if (!SUPPORTED_MIME.includes(mime)) {
    console.warn('Unsupported mime type:', mime);
    return null;
  }
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
      console.warn('Invalid attachment:', attachment);
      return;
    }
    if (typeof attachment.name !== 'string') {
      console.warn('Invalid attachment name:', attachment.name);
      return;
    }
    // only support base64 url
    if (
      typeof attachment.content !== 'string' ||
      attachment.content.indexOf('data:') !== 0 ||
      attachment.content.indexOf(';base64,') === -1
    ) {
      console.warn('Invalid attachment content:', attachment.content);
      return;
    }
    const blob = dataURLtoBlob(attachment.content);
    if (!blob) {
      return;
    }
    validAttachments.push({
      name: attachment.name,
      file: blob,
      size: blob.size,
    });
  });
  return validAttachments;
}

export function trackWebphoneCallEnded(analytics, session) {
  let duration = 0;
  if (session.startTime) {
    duration = Math.floor((Date.now() - session.startTime) / 1000) + 1;
  }
  let result = 'Terminated';
  if (session.isToVoicemail) {
    result = 'Voicemail';
  }
  if (session.isOnFlip) {
    result = 'Call Flip';
  }
  if (session.isForwarded) {
    result = 'Forwarded';
  }
  if (session.isReplied) {
    result = 'Replied';
  }
  if (session.isOnTransfer) {
    result = 'Transfer';
  }
  return analytics.track('WebRTC Call Ended', {
    direction: session.direction,
    duration,
    result,
  });
}
