import type React from 'react';

import type { ThirdParty } from '../../services/ThirdParty';

interface MessageAttachment {
  id?: string | number;
  contentType?: string;
  fileName?: string;
  uri?: string;
}

interface RenderedMessage {
  messageType?: string;
  lastModifiedTime?: unknown;
  mmsAttachments?: readonly MessageAttachment[];
}

/** The file name shown on each non-image attachment the upstream list renders. */
const FILE_NAME_SELECTOR = '[data-sign="file-full-name"]';
const DOWNLOAD_SELECTOR = '[data-sign="download"]';

function isVCard({ contentType, fileName }: MessageAttachment): boolean {
  return (
    /vcard/i.test(contentType ?? '') || /\.(vcf|vcard)$/i.test(fileName ?? '')
  );
}

/**
 * The non-image attachments in the order the upstream message list renders
 * them: every message but a timed info message, image attachments left out.
 */
function getFileAttachments(
  messages: readonly RenderedMessage[],
): MessageAttachment[] {
  return messages
    .filter(
      ({ messageType, lastModifiedTime }) =>
        !(messageType === 'info' && lastModifiedTime),
    )
    .flatMap(({ mmsAttachments = [] }) =>
      mmsAttachments.filter(
        ({ contentType }) => !contentType || !contentType.includes('image'),
      ),
    );
}

/**
 * The smallest ancestor of a download button that holds one file name and
 * that one button, which is the file attachment it downloads. An image
 * attachment's button has no such ancestor.
 */
function findFileAttachmentElement(
  button: Element,
  container: Element,
): Element | null {
  let node = button.parentElement;
  while (node && node !== container) {
    if (node.querySelector(FILE_NAME_SELECTOR)) {
      return node.querySelectorAll(DOWNLOAD_SELECTOR).length === 1
        ? node
        : null;
    }
    node = node.parentElement;
  }
  return null;
}

function isShownAs(attachment: MessageAttachment, shownName: string): boolean {
  return attachment.fileName
    ? shownName === attachment.fileName
    : shownName.startsWith(`${attachment.id}.`);
}

/**
 * Sends a vCard attachment's download to the host's `vcardHandlerPath`
 * instead of downloading it, as 3.x did.
 *
 * The upstream message list does not take an attachment download handler,
 * so this runs in the capture phase on the panel and maps the clicked
 * download button back to its attachment by render order, checking the
 * shown file name.
 */
export function handleVCardDownloadClick(
  event: React.MouseEvent<HTMLElement>,
  messages: readonly RenderedMessage[] | undefined,
  thirdParty: Pick<ThirdParty, 'openVCard' | 'vcardHandlerRegistered'>,
): void {
  if (!thirdParty.vcardHandlerRegistered || !messages?.length) {
    return;
  }
  const container = event.currentTarget;
  const button = (event.target as Element | null)?.closest?.(DOWNLOAD_SELECTOR);
  if (!button || !container.contains(button)) {
    return;
  }
  const fileName = findFileAttachmentElement(button, container)?.querySelector(
    FILE_NAME_SELECTOR,
  );
  if (!fileName) {
    return;
  }
  const index = Array.from(container.querySelectorAll(FILE_NAME_SELECTOR)).indexOf(
    fileName,
  );
  const attachment = getFileAttachments(messages)[index];
  if (
    !attachment?.uri ||
    !isVCard(attachment) ||
    !isShownAs(attachment, fileName.textContent ?? '')
  ) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  void thirdParty.openVCard(attachment.uri);
}
