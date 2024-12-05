import React from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { styled } from '@ringcentral/juno';
import emojiData from '@emoji-mart/data';
import { init } from 'emoji-mart'
import { SearchIndex } from 'emoji-mart';

init({ data: emojiData });

function ImageRender(props: {
  src: string;
  alt?: string;
  atRender?: any;
}) {
  if (props.alt === ':Person' || props.alt === ':Team' ||  props.alt === ':All') {
    if (typeof props.atRender === 'function') {
      const AtRender = props.atRender;
      return <AtRender id={props.src} type={props.alt.replace(':', '')} />;
    }
    return <a href={`#${props.src}`}>@{props.src}</a>;
  }
  return <img src={props.src} alt={props.alt} />;
}

function LinkRender(props: {
  href: string;
  children: ReactNode,
  title?: string;
}) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={props.href}
      title={props.title}
    >
      {props.children}
    </a>
  );
}

const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;

const replaceEmojiText = (text) => {
  if (typeof text !== 'string') {
    return text;
  }

  return text.split(emojiRegex).map((part, index) => {
    const emojiCode = SearchIndex.get(part);
    if (emojiCode && emojiCode.skins) {
      return emojiCode.skins[0].native;
    }
    return part;
  }).join('');
};

const atTeamRegex = /<a\s+class='at_mention_compose'\s+rel='{"id":-1}'>[^<]+<\/a>/;

const replaceAtTeamText = (text) => {
  if (typeof text !== 'string') {
    return text;
  }
  const matched = text.match(atTeamRegex);
  if (!matched) {
    return text;
  }
  let mentionText = matched[0].split('>')[1];
  if (!mentionText) {
    return text;
  }
  mentionText = mentionText.split('<')[0];
  return text.replace(matched[0], `![:All](${mentionText})`);
};

const StyleText = styled.p`
  margin: 0;
  user-select: text;
`;

function TextRender({
  children,
}: {
  children: string[];
}) {
  const lines = [];
  children.forEach((child) => {
    if (!child || !child.indexOf) {
      lines.push(child);
      return;
    }
    if (child.indexOf('\n') === 0) {
      lines.push(child);
      return;
    }
    child.split('\n').forEach((line) => {
      if (line) {
        lines.push(line);
        lines.push(<br />);
      }
    }, []);
  });
  return (
    <StyleText>
      {
        lines.map((line, index) => {
          return (
            <span key={index}>
              {line}
            </span>
          );
        })
      }
    </StyleText>
  );
}

export function GlipMarkdown({
  className = undefined,
  text,
  atRender = undefined,
}: {
  className?: string;
  text: string;
  atRender?: (...args: any[]) => any;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          a: LinkRender,
          img: (props) => (
            <ImageRender
              {...props}
              atRender={atRender}
            />
          ),
          p: TextRender,
        }}
      >
        {replaceAtTeamText(replaceEmojiText(text))}
      </ReactMarkdown>
    </div>
  );
}
