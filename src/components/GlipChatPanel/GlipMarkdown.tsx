import React from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { styled } from '@ringcentral/juno';
import { replaceEmojiText, replaceAtTeamText } from './formatPost';

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
