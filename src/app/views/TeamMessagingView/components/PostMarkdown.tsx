import Linkify from 'linkify-react';
import React, { type ReactNode } from 'react';

import type { MentionType } from '../TeamMessaging.view.interface';

type MarkdownBlock =
  | { type: 'code'; text: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'text'; lines: string[] };

const CODE_BLOCK_PATTERN = /```([\s\S]*?)```|\[code\]([\s\S]*?)\[\/code\]/g;

/**
 * Inline tokens: a mention `![:Person](id)`, a link `[text](url)`, bold
 * `**text**`, inline code `` `code` ``, and italic `*text*` or `_text_`.
 */
const INLINE_PATTERN =
  /!\[:(Person|Team|All)\]\(([^)]+)\)|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\n]+)\*|(^|\s)_([^_\n]+)_(?=$|\s|[.,!?;:])/g;

const QUOTE_PREFIX = /^>\s?/;

/** All matches of a global pattern, without `String.matchAll` (ES2020). */
function findMatches(pattern: RegExp, text: string): RegExpExecArray[] {
  const regExp = new RegExp(pattern.source, 'g');
  const matches: RegExpExecArray[] = [];
  let match = regExp.exec(text);
  while (match) {
    matches.push(match);
    if (match[0].length === 0) {
      regExp.lastIndex += 1;
    }
    match = regExp.exec(text);
  }
  return matches;
}

const LINKIFY_OPTIONS = {
  target: '_blank',
  rel: 'noopener noreferrer',
  className: 'underline',
} as const;

function pushLine(blocks: MarkdownBlock[], line: string): void {
  const isQuote = QUOTE_PREFIX.test(line);
  const type = isQuote ? 'quote' : 'text';
  const content = isQuote ? line.replace(QUOTE_PREFIX, '') : line;
  const last = blocks[blocks.length - 1];
  if (last && last.type === type) {
    last.lines.push(content);
    return;
  }
  blocks.push({ type, lines: [content] });
}

/** Split post text into code blocks, quotes and plain text blocks. */
function parseBlocks(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let lastIndex = 0;
  const addText = (value: string): void =>
    value
      .replace(/^\n|\n$/g, '')
      .split('\n')
      .forEach((line) => pushLine(blocks, line));
  for (const match of findMatches(CODE_BLOCK_PATTERN, text)) {
    addText(text.slice(lastIndex, match.index));
    blocks.push({ type: 'code', text: (match[1] ?? match[2] ?? '').trim() });
    lastIndex = match.index + match[0].length;
  }
  addText(text.slice(lastIndex));
  return blocks;
}

interface InlineOptions {
  renderMention: (type: MentionType, id: string) => ReactNode;
}

function renderPlain(text: string, key: string): ReactNode {
  return text ? (
    <Linkify key={key} options={LINKIFY_OPTIONS}>
      {text}
    </Linkify>
  ) : null;
}

function renderToken(
  match: RegExpMatchArray,
  key: string,
  options: InlineOptions,
): ReactNode {
  const [, mentionType, mentionId, linkText, linkUrl, bold, code, italic] =
    match;
  if (mentionType) {
    return (
      <React.Fragment key={key}>
        {options.renderMention(mentionType as MentionType, mentionId)}
      </React.Fragment>
    );
  }
  if (linkUrl) {
    return (
      <a key={key} href={linkUrl} {...LINKIFY_OPTIONS}>
        {linkText}
      </a>
    );
  }
  if (bold) {
    return <strong key={key}>{renderInline(bold, options)}</strong>;
  }
  if (code) {
    return (
      <code key={key} className="rounded bg-neutral-b5 px-1">
        {code}
      </code>
    );
  }
  const emphasized = italic ?? match[9];
  return (
    <React.Fragment key={key}>
      {match[8] ?? ''}
      <em>{renderInline(emphasized, options)}</em>
    </React.Fragment>
  );
}

function renderInline(text: string, options: InlineOptions): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of findMatches(INLINE_PATTERN, text)) {
    const index = match.index;
    nodes.push(renderPlain(text.slice(lastIndex, index), `t${index}`));
    nodes.push(renderToken(match, `m${index}`, options));
    lastIndex = index + match[0].length;
  }
  nodes.push(renderPlain(text.slice(lastIndex), `t${lastIndex}`));
  return nodes;
}

function renderLines(lines: string[], options: InlineOptions): ReactNode {
  return lines.map((line, index) => (
    <React.Fragment key={index}>
      {index > 0 ? <br /> : null}
      {renderInline(line, options)}
    </React.Fragment>
  ));
}

function renderBlock(
  block: MarkdownBlock,
  index: number,
  options: InlineOptions,
): ReactNode {
  if (block.type === 'code') {
    return (
      <pre
        key={index}
        className="my-1 overflow-x-auto whitespace-pre rounded bg-neutral-b5 p-2"
      >
        <code>{block.text}</code>
      </pre>
    );
  }
  if (block.type === 'quote') {
    return (
      <blockquote
        key={index}
        className="my-1 border-l-2 border-neutral-b3 bg-neutral-b5 py-1 pl-3 pr-1 text-neutral-b2"
      >
        {renderLines(block.lines, options)}
      </blockquote>
    );
  }
  return (
    <p key={index} className="m-0">
      {renderLines(block.lines, options)}
    </p>
  );
}

export interface PostMarkdownProps {
  text: string;
  renderMention: (type: MentionType, id: string) => ReactNode;
}

/**
 * Renders the markdown subset of team messaging posts, as the legacy app did.
 * Text is rendered as React nodes, never as HTML.
 */
export function PostMarkdown({
  text,
  renderMention,
}: PostMarkdownProps): React.ReactElement {
  const options: InlineOptions = { renderMention };
  return (
    <div
      className="typography-mainText select-text break-words text-neutral-b0"
      data-sign="postText"
    >
      {parseBlocks(text).map((block, index) =>
        renderBlock(block, index, options),
      )}
    </div>
  );
}
