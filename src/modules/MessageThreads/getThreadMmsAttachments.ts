import type { MessageThreadAttachment } from '../MessageThreadEntries/MessageThreadEntries.interface';

export interface ThreadMmsAttachment {
  id: string;
  uri: string;
  contentType?: string;
  fileName?: string;
  size?: number;
}

/**
 * Convert thread message attachments to the MMS attachment shape used by the
 * conversation message list, appending the access token to the content uri so
 * the browser can display or download them directly.
 */
export function getThreadMmsAttachments(
  attachments: MessageThreadAttachment[] | undefined,
  accessToken: string | undefined,
): ThreadMmsAttachment[] {
  if (!attachments || attachments.length === 0 || !accessToken) {
    return [];
  }
  const token = decodeURIComponent(accessToken);
  return attachments
    .filter((attachment) => !!attachment.contentUri)
    .map((attachment) => {
      const separator = attachment.contentUri.includes('?') ? '&' : '?';
      return {
        id: attachment.id,
        uri: `${attachment.contentUri}${separator}access_token=${token}&shouldCache=true`,
        contentType: attachment.contentType,
        fileName: attachment.filename,
        size: attachment.size,
      };
    });
}
