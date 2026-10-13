import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { handleVCardDownloadClick } from '../../src/app/views/ConversationView/handleVCardDownloadClick';

/**
 * Mirrors the upstream message list: image attachments have a download
 * button but no file name, and each file attachment holds one name and one
 * download button.
 */
function MessageList({ messages, onDownload, thirdParty }) {
  return (
    <div
      onClickCapture={(event) =>
        handleVCardDownloadClick(event, messages, thirdParty)
      }
    >
      {messages
        .filter(
          ({ messageType, lastModifiedTime }) =>
            !(messageType === 'info' && lastModifiedTime),
        )
        .map((message) => (
          <div key={message.id}>
            {(message.mmsAttachments || []).map((attachment) =>
              attachment.contentType.includes('image') ? (
                <div key={attachment.id}>
                  <button
                    aria-label={`download ${attachment.id}`}
                    data-sign="download"
                    onClick={() => onDownload(attachment.id)}
                    type="button"
                  />
                </div>
              ) : (
                <div data-sign="InboundAttachment" key={attachment.id}>
                  <div>
                    <div data-sign="file-full-name">
                      {attachment.shownName ?? attachment.fileName}
                    </div>
                    <button
                      aria-label={`download ${attachment.id}`}
                      data-sign="download"
                      onClick={() => onDownload(attachment.id)}
                      type="button"
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        ))}
    </div>
  );
}

function createThirdParty(vcardHandlerRegistered = true) {
  return {
    openVCard: jest.fn(async () => undefined),
    vcardHandlerRegistered,
  };
}

const vcard = {
  contentType: 'text/vcard',
  fileName: 'Ada.vcf',
  id: 'vcard',
  uri: 'https://media.example.com/vcard',
};

const pdf = {
  contentType: 'application/pdf',
  fileName: 'report.pdf',
  id: 'pdf',
  uri: 'https://media.example.com/pdf',
};

const image = {
  contentType: 'image/png',
  fileName: 'photo.png',
  id: 'image',
  uri: 'https://media.example.com/image',
};

function renderList(messages, thirdParty = createThirdParty()) {
  const onDownload = jest.fn();
  render(
    <MessageList
      messages={messages}
      onDownload={onDownload}
      thirdParty={thirdParty}
    />,
  );
  return { onDownload, thirdParty };
}

function clickDownload(id) {
  fireEvent.click(screen.getByRole('button', { name: `download ${id}` }));
}

describe('handleVCardDownloadClick', () => {
  test('sends a vcard to the host instead of downloading it', () => {
    const { onDownload, thirdParty } = renderList([
      { id: 'm1', mmsAttachments: [pdf] },
      { id: 'm2', mmsAttachments: [image, vcard] },
    ]);

    clickDownload('vcard');

    expect(thirdParty.openVCard).toHaveBeenCalledWith(vcard.uri);
    expect(onDownload).not.toHaveBeenCalled();
  });

  test('downloads other files and images as usual', () => {
    const { onDownload, thirdParty } = renderList([
      { id: 'm1', mmsAttachments: [image, pdf, vcard] },
    ]);

    clickDownload('pdf');
    clickDownload('image');

    expect(onDownload.mock.calls).toEqual([['pdf'], ['image']]);
    expect(thirdParty.openVCard).not.toHaveBeenCalled();
  });

  test('downloads a vcard as usual without a registered handler', () => {
    const { onDownload, thirdParty } = renderList(
      [{ id: 'm1', mmsAttachments: [vcard] }],
      createThirdParty(false),
    );

    clickDownload('vcard');

    expect(onDownload).toHaveBeenCalledWith('vcard');
    expect(thirdParty.openVCard).not.toHaveBeenCalled();
  });

  test('recognises a vcard by its file name and one shown by its id', () => {
    const namedVCard = {
      contentType: 'application/octet-stream',
      fileName: 'Grace.vcard',
      id: 'named',
      uri: 'https://media.example.com/named',
    };
    const unnamedVCard = {
      contentType: 'text/x-vcard',
      id: 'unnamed',
      shownName: 'unnamed.vcf',
      uri: 'https://media.example.com/unnamed',
    };
    const { thirdParty } = renderList([
      { id: 'm1', mmsAttachments: [namedVCard, unnamedVCard] },
    ]);

    clickDownload('named');
    clickDownload('unnamed');

    expect(thirdParty.openVCard.mock.calls).toEqual([
      [namedVCard.uri],
      [unnamedVCard.uri],
    ]);
  });

  test('skips timed info messages the list does not render', () => {
    const { thirdParty } = renderList([
      {
        id: 'info',
        lastModifiedTime: '2026-10-13T00:00:00Z',
        messageType: 'info',
        mmsAttachments: [pdf],
      },
      { id: 'm1', mmsAttachments: [vcard] },
    ]);

    clickDownload('vcard');

    expect(thirdParty.openVCard).toHaveBeenCalledWith(vcard.uri);
  });

  test('downloads as usual when the shown name does not match', () => {
    const { onDownload, thirdParty } = renderList([
      { id: 'm1', mmsAttachments: [{ ...vcard, shownName: 'Other.vcf' }] },
    ]);

    clickDownload('vcard');

    expect(onDownload).toHaveBeenCalledWith('vcard');
    expect(thirdParty.openVCard).not.toHaveBeenCalled();
  });
});
