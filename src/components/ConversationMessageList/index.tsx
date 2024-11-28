import React, { Component, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import type { FunctionComponent } from 'react';
import { isBlank } from '@ringcentral-integration/commons/lib/isBlank';
import { RcIcon, styled, palette2, css } from '@ringcentral/juno';
import {
  DefaultFile as fileSvg,
  Download as downloadSvg,
} from '@ringcentral/juno-icon';

import i18n from '@ringcentral-integration/widgets/components/ConversationMessageList/i18n';
import { SubjectRender as DefaultRender } from '@ringcentral-integration/widgets/components/ConversationMessageList/SubjectRender';

function getExtFromContentType(contentType: any) {
  const ext = contentType.split('/');
  return ext[1].split('+')[0];
}

const MessageTextWrapper = styled.div<{
  inbound?: boolean;
  big?: boolean;
}>`
  position: relative;
  display: inline-block;
  margin-bottom: 10px;
  min-width: 50%;
  max-width: 60%;
  text-align: left;
  hyphens: auto;
  padding: 10px 15px;
  background: ${palette2('interactive', 'b02')};
  border-radius: 16px;
  min-height: 13px;
  box-sizing: content-box;
  /* For Firefox */
  white-space: pre-wrap;
  word-break: break-word;
  /* For Chrome and IE */
  word-wrap: break-word;

  ${(props) =>
    props.inbound ? css`
      background: ${palette2('interactive', 'b01')};
      border-radius: 16px 16px 16px 0px;
      a {
        color: ${palette2('interactive', 'f01')};
      }
    ` : css`
      border-radius: 16px 16px 0px 16px;
      float: right;
      clear: both;
      color: ${palette2('neutral', 'f01')};
      a {
        color: ${palette2('neutral', 'f01')};
      }
    `
  }
  
  ${(props) =>
    props.big &&
    css`
      width: 85%;
      max-width: 85%;
    `}
`;

const MessageWrapper = styled.div`
  display: block;
  width: 100%;
  font-size: 12px;
  color: ${palette2('neutral', 'f06')};

  &:first-child {
    margin-top: 10px;
  }

  &:last-child {
    margin-bottom: 10px;
  }
`;

const Time = styled.div`
  text-align: center;
  font-size: 12px;
  margin-bottom: 10px;
  color: ${palette2('neutral', 'f02')};
  clear: both;
`;

const Sender = styled.div`
  color:${palette2('neutral', 'f02')};
  clear: both;
  margin-bottom: 1px;
`;

const Clear = styled.div`
  clear: both;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
`;

const Loading = styled.div`
  text-align: center;
  line-height: 40px;
  font-size: 14px;
`;

const Picture = styled.img`
  width: 100%;
`;

const File = styled.div`
  padding: 10px;
  min-width: 80px;
  max-width: 200px;
  border-radius: 4px;
  background: ${palette2('neutral', 'b01')};
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: flex-start;
  margin-bottom: 5px;
  color: ${palette2('neutral', 'f06')};
`;

const FileName = styled.span`
  margin: 0 5px;
  flex: 1;
`;

const Download = styled.a`
  cursor: pointer;
  .icon {
    color: ${palette2('neutral', 'f06')};
  }
  &:focus {
    outline: 0;
  }
`;

export const Message = ({
  subject = '',
  time = undefined,
  direction,
  sender = undefined,
  subjectRenderer: SubjectRenderer = undefined,
  mmsAttachments = [],
  currentLocale,
  onAttachmentDownload = undefined,
  onLinkClick,
}: {
  subject: string;
  time?: string;
  direction: string;
  sender?: string;
  subjectRenderer?: FunctionComponent<{ subject: string }>;
  mmsAttachments: any[];
  currentLocale: string;
  onAttachmentDownload?: any;
  onLinkClick: any;
}) => {
  let subjectNode;
  if (subject && !isBlank(subject)) {
    const SubjectComp = SubjectRenderer || DefaultRender;
    subjectNode = <SubjectComp subject={subject} onLinkClick={onLinkClick} />;
  }
  const imageAttachments = mmsAttachments
    .filter((m: any) => m.contentType.indexOf('image') > -1)
    .map((attachment: any) => {
      return (
        <Picture
          key={attachment.id}
          src={attachment.uri}
          alt={`attachment${attachment.id}`}
        />
      );
    });
  const otherAttachments = mmsAttachments
    .filter((m: any) => m.contentType.indexOf('image') === -1)
    .map((attachment: any) => {
      const fileName =
        attachment.fileName ||
        `${attachment.id}.${getExtFromContentType(attachment.contentType)}`;
      return (
        <File key={attachment.id} title={fileName}>
          <RcIcon size="small" symbol={fileSvg} />
          <FileName>{fileName}</FileName>
          <Download
            target="_blank"
            download={fileName}
            onClick={(e) => {
              if (typeof onAttachmentDownload === 'function') {
                onAttachmentDownload(attachment.uri, e);
              }
            }}
            title={i18n.getString('download', currentLocale)}
            href={`${attachment.uri}&contentDisposition=Attachment`}
          >
            <RcIcon size="small" symbol={downloadSvg} />
          </Download>
        </File>
      );
    });
  return (
    <MessageWrapper data-sign="message">
      {time ? (
        <Time data-sign="conversationSendTime">
          {time}
        </Time>
      ) : null}
      {sender && direction === 'Inbound' ? (
        <Sender>{sender}</Sender>
      ) : null}
      <MessageTextWrapper
        data-sign={`${direction}Text`}
        inbound={direction === 'Inbound'}
        big={subject && subject.length > 500}
      >
        {subjectNode}
        {imageAttachments}
        {otherAttachments}
      </MessageTextWrapper>
      <Clear />
    </MessageWrapper>
  );
};

const Root = styled.div`
  position: relative;
  display: block;
  overflow-y: auto;
  overflow-x: hidden;
  height: 354px;
  padding: 0 15px;
  background: ${palette2('neutral', 'b01')};
`;

type MessageData = {
  creationTime: number;
  id: number;
  direction: string;
  subject: string;
  mmsAttachments: any[];
}

export function ConversationMessageList({
  className = undefined,
  dateTimeFormatter,
  messages,
  showSender = false,
  height = '100%',
  messageSubjectRenderer = undefined,
  formatPhone,
  loadingNextPage = false,
  currentLocale = 'en-US',
  onAttachmentDownload = undefined,
  onLinkClick,
  loadPreviousMessages = () => null,
}: {
  className: string;
  dateTimeFormatter: any;
  messages: MessageData[];
  showSender: boolean;
  height: number | string;
  messageSubjectRenderer: FunctionComponent<{ subject: string }>;
  formatPhone: (phone: string) => string;
  loadingNextPage: boolean;
  currentLocale: string;
  onAttachmentDownload: (uri: string, e: any) => void;
  onLinkClick: (e: any) => void;
  loadPreviousMessages: () => void;
}) {
  const listRef = useRef(null);
  const scrollHeight = useRef(null);
  const scrollTop = useRef(null);
  const scrollUp = useRef(null);
  const messageLength = useRef(0);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (messageLength.current === messages.length) {
      return;
    }
    messageLength.current = messages.length;
    if (!scrollUp.current) {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    } else if (listRef.current && scrollHeight.current !== listRef.current.scrollHeight) {
      listRef.current.scrollTop += listRef.current.scrollHeight - scrollHeight.current;
    }
  }, [messages]);

  let lastDate = 0;
  const messageList = messages.map((message: any) => {
    const sender = showSender
      ? message.from.name ||
        formatPhone(message.from.extensionNumber || message.from.phoneNumber)
      : null;
    const date = new Date(message.creationTime);
    const time =
      // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
      date - lastDate < 60 * 60 * 1000 &&
      // @ts-expect-error TS(2339): Property 'getHours' does not exist on type 'number... Remove this comment to see the full error message
      date.getHours() === lastDate.getHours()
        ? null
        : dateTimeFormatter({
            utcTimestamp: message.creationTime,
            type: 'long',
          });
    // @ts-expect-error TS(2322): Type 'Date' is not assignable to type 'number'.
    lastDate = date;
    return (
      <Message
        key={message.id}
        sender={sender}
        time={time}
        direction={message.direction}
        subject={message.subject}
        subjectRenderer={messageSubjectRenderer}
        mmsAttachments={message.mmsAttachments}
        currentLocale={currentLocale}
        onAttachmentDownload={onAttachmentDownload}
        onLinkClick={onLinkClick}
      />
    );
  });
  const loading = loadingNextPage ? (
    <Loading>
      {i18n.getString('loading', currentLocale)}
    </Loading>
  ) : null;
  return (
    <Root
      className={className}
      style={{ height }}
      ref={listRef}
      onScroll={async () => {
        if (!listRef.current) {
          return;
        }
        const currentScrollTop = listRef.current.scrollTop;
        scrollHeight.current = listRef.current.scrollHeight;
        const clientHeight = listRef.current.clientHeight;
        if (currentScrollTop < scrollTop.current) {
          // user scroll up
          scrollUp.current = true;
        } else if (currentScrollTop + clientHeight > scrollHeight.current - 200) {
          // user scroll down to bottom
          scrollUp.current = false;
        }
        if (currentScrollTop < 20 && scrollTop.current >= 20) {
          loadPreviousMessages();
        }
        scrollTop.current = currentScrollTop;
      }}
    >
      {loading}
      {messageList}
    </Root>
  );
}
