import React from 'react';

import { RcLink } from '@ringcentral/juno';

export function TextWithMarkdown({ text }: { text: string }) {
  // Find all markdown patterns: links [text](url) and bold **text**
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const boldRegex = /\*\*([^\*]+)\*\*/g;
  
  // Collect all matches with their positions
  const matches = [];
  
  // Find all link matches
  let linkMatch;
  while ((linkMatch = linkRegex.exec(text)) !== null) {
    matches.push({
      type: 'link',
      index: linkMatch.index,
      length: linkMatch[0].length,
      text: linkMatch[1],
      url: linkMatch[2],
      fullMatch: linkMatch[0]
    });
  }
  
  // Find all bold matches
  let boldMatch;
  while ((boldMatch = boldRegex.exec(text)) !== null) {
    matches.push({
      type: 'bold',
      index: boldMatch.index,
      length: boldMatch[0].length,
      text: boldMatch[1],
      fullMatch: boldMatch[0]
    });
  }
  
  // If no matches found, return plain text
  if (matches.length === 0) {
    return <>{text}</>;
  }
  
  // Sort matches by position in text
  matches.sort((a, b) => a.index - b.index);
  
  const parts = [];
  let lastIndex = 0;
  
  matches.forEach((match, i) => {
    // Add text before this match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    
    // Add the formatted element
    if (match.type === 'link') {
      // Validate and sanitize URL
      let href = match.url;
      if (!href.startsWith('http://') && !href.startsWith('https://')) {
        console.warn(`Invalid href: ${href}`);
        href = "#";
      }
      if (href.includes('javascript')) {
        console.warn(`Invalid href: ${href}`);
        href = "#";
      }
      
      parts.push(
        <RcLink 
          key={`link-${match.index}`} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {match.text}
        </RcLink>
      );
    } else if (match.type === 'bold') {
      parts.push(
        <strong key={`bold-${match.index}`}>
          {match.text}
        </strong>
      );
    }
    
    lastIndex = match.index + match.length;
  });
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }
  
  return <>{parts}</>;
}
