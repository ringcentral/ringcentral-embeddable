import React from 'react';
import { styled, palette2 } from '@ringcentral/juno';
import { GlipMarkdown } from './GlipMarkdown';

// const StyledImage = styled.img`
//   max-width: 100%;
//   height: auto;
// `;

const AttachmentFile = styled.a`
  position: relative;
  height: 20px;
  line-height: 20px;
  display: block;
  padding-right: 30px;
  cursor: pointer;
  display: inline-block;
  clear: both;
  color: ${palette2('interactive', 'f01')};
  text-decoration: none;
`;

type Attachment = {
  name: string;
  contentUri: string;
  type: string;
};

function Attachments({ attachments }: { attachments: Attachment[] }) {
  const attachmentFiles = attachments.map((attachment) => {
    // if (isPicture(attachment.contentUri, attachment.name)) {
    //   return (
    //     <StyledImage
    //       key={attachment.name || attachment.contentUri}
    //       src={attachment.contentUri}
    //       alt={attachment.name}
    //     />
    //   );
    // }
    if (attachment.type !== 'File') {
      return 'Unsupported message';
    }
    return (
      <AttachmentFile
        key={attachment.name || attachment.contentUri}
        download
        href={attachment.contentUri}
        target="_blank"
      >
        {attachment.name}
      </AttachmentFile>
    );
  });
  return <div>{attachmentFiles}</div>;
}

const Root = styled.div`
  display: block;
  max-width: 90%;
  margin-top: 0;
`;

type Post = {
  text: string;
  attachments: Attachment[];
};

export function GlipPostContent({
  post,
  className,
  atRender,
} : {
  post: Post;
  className?: string;
  atRender?: (node: React.ReactNode, key: number) => React.ReactNode;
}) {
  if (!post.text && (!post.attachments || post.attachments.length === 0)) {
    return (
      <Root className={className}>Unsupported message</Root>
    );
  }
  let text = post.text;
  if (text) {
    text = text.replace('[code]', '```\n').replace('[/code]', '\n```\n');
  }
  const textContent = text ? (
    <GlipMarkdown text={text} atRender={atRender} />
  ) : null;
  const attachments = post.attachments ? (
    <Attachments attachments={post.attachments} />
  ) : null;
  return (
    <Root className={className}>
      {textContent}
      {attachments}
    </Root>
  );
}
