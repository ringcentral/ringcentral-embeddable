import { DownloadMd } from '@ringcentral/spring-icon';
import { Icon } from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import { isPicture } from '../formatPostText';

type FileAttachmentData = {
  contentUri?: string;
  name?: string;
};

function FileLink({ contentUri, name }: FileAttachmentData): React.ReactElement {
  return (
    <a
      href={contentUri}
      target="_blank"
      rel="noopener noreferrer"
      className="typography-mainText flex min-w-0 items-center gap-1 text-primary-f"
      data-sign="postFile"
    >
      <Icon symbol={DownloadMd} size="small" />
      <span className="truncate">{name}</span>
    </a>
  );
}

/**
 * A file in a post. A picture shows inline and opens full size when clicked.
 * The file host only serves it to a browser signed in to the RingCentral web
 * app, so a picture that fails to load falls back to its link.
 */
export function FileAttachment({
  contentUri,
  name,
}: FileAttachmentData): React.ReactElement {
  const [failed, setFailed] = useState(false);
  if (!contentUri || failed || !isPicture(contentUri, name)) {
    return <FileLink contentUri={contentUri} name={name} />;
  }
  // The block gives the picture a definite width to fit; a shrink-to-fit
  // wrapper collapses an SVG without its own size.
  return (
    <div className="max-w-full" data-sign="postImage">
      <a href={contentUri} target="_blank" rel="noopener noreferrer" title={name}>
        <img
          src={contentUri}
          alt={name}
          loading="lazy"
          className="inline-block max-h-60 max-w-full rounded border border-neutral-b4 object-contain"
          onError={() => setFailed(true)}
        />
      </a>
    </div>
  );
}
