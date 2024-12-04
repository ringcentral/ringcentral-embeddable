import PropTypes from 'prop-types';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { styled } from '@ringcentral/juno';
import data from '@emoji-mart/data';
import { init } from 'emoji-mart'
import { SearchIndex } from 'emoji-mart';

init({ data });

function ImageRender(props) {
  console.log('ImageRender', props);
  if (props.alt === ':Person' || props.alt === ':Team') {
    if (typeof props.atRender === 'function') {
      const AtRender = props.atRender;
      return <AtRender id={props.src} type={props.alt.replace(':', '')} />;
    }
    return <a href={`#${props.src}`}>@{props.src}</a>;
  }
  return <img src={props.src} alt={props.alt} />;
}

ImageRender.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  atRender: PropTypes.func,
};

ImageRender.defaultProps = {
  alt: undefined,
  atRender: undefined,
};

function LinkRender(props) {
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

LinkRender.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
};

LinkRender.defaultProps = {
  title: undefined,
};

const parseAndRenderEmoji = (text) => {
  if (typeof text !== 'string') {
    return text;
  }
  const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;

  return text.split(emojiRegex).map((part, index) => {
    const emojiCode = SearchIndex.get(part);
    if (emojiCode && emojiCode.skins) {
      return emojiCode.skins[0].native;
    }
    return part;
  }).join('');
};

const StyleText = styled.p`
  margin: 0;
`;

function TextRender({
  children,
}) {
  return (
    <StyleText>
      {
        children.map(child => parseAndRenderEmoji(child))
      }
    </StyleText>
  );
}

TextRender.propTypes = {
  children: PropTypes.node.isRequired,
};

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
        {text}
      </ReactMarkdown>
    </div>
  );
}
