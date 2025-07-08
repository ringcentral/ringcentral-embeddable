import React from 'react';

import {
  RcAlert,
  RcLink,
  styled,
} from '@ringcentral/juno';

const StyledAlert = styled(RcAlert)`
  &.RcAlert-root {
    padding: 10px;
  }

  .RcAlert-message {
    font-size: 0.875rem;
  }
`;

function TextWithLinks({ text }: { text: string }) {
  // Match markdown links in format [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;

  // Find all markdown links in the text
  let match = linkRegex.exec(text);
  if (!match) {
    return (
      <>{text}</>
    );
  }

  while (match !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    // Add the link component
    // match[1] is the link text, match[2] is the URL
    let href = match[2];
    // validate href, start with http:// or https://, and not javascript in url
    if (
      !href.startsWith('http://') &&
      !href.startsWith('https://')
    ) {
      console.warn(`Invalid href: ${href}`);
      href = "#";
    }
    if (href.includes('javascript')) {
      console.warn(`Invalid href: ${href}`);
      href = "#";
    }
    parts.push(
      <RcLink key={match.index} href={href} target="_blank" rel="noopener noreferrer">
        {match[1]}
      </RcLink>
    );
    lastIndex = match.index + match[0].length;
  
    // Find the next match
    match = linkRegex.exec(text);
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(
      <span key={lastIndex}>{text.slice(lastIndex)}</span>
    );
  }

  return <>{parts}</>;
}

export function Alert({
  schema,
  uiSchema,
}) {
  return (
    <StyledAlert severity={uiSchema && uiSchema['ui:severity'] || 'info'}>
      <TextWithLinks text={schema.description} />
    </StyledAlert>
  );
}
