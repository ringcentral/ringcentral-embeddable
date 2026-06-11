import React from 'react';
import { Link } from '@ringcentral/spring-ui';

type MarkdownMatch = {
  fullMatch: string;
  index: number;
  length: number;
  text: string;
  type: 'link' | 'bold';
  url?: string;
};

function getSafeHref(url: string | undefined): string {
  if (!url) {
    return '#';
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return '#';
  }
  if (url.toLowerCase().includes('javascript')) {
    return '#';
  }
  return url;
}

function getMarkdownMatches(text: string): MarkdownMatch[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const boldRegex = /\*\*([^\*]+)\*\*/g;
  const matches: MarkdownMatch[] = [];
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    matches.push({
      fullMatch: linkMatch[0],
      index: linkMatch.index,
      length: linkMatch[0].length,
      text: linkMatch[1],
      type: 'link',
      url: linkMatch[2],
    });
  }
  let boldMatch: RegExpExecArray | null;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    matches.push({
      fullMatch: boldMatch[0],
      index: boldMatch.index,
      length: boldMatch[0].length,
      text: boldMatch[1],
      type: 'bold',
    });
  }
  return matches.sort((a, b) => a.index - b.index);
}

export function TextWithMarkdown({ text = '' }: { text?: string }) {
  const matches = getMarkdownMatches(text);
  if (matches.length === 0) {
    return <>{text}</>;
  }
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  matches.forEach((match) => {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match.type === 'link') {
      parts.push(
        <Link key={`link-${match.index}`} href={getSafeHref(match.url)} target="_blank" rel="noopener noreferrer">
          {match.text}
        </Link>,
      );
    } else {
      parts.push(<strong key={`bold-${match.index}`}>{match.text}</strong>);
    }
    lastIndex = match.index + match.length;
  });
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }
  return <>{parts}</>;
}
