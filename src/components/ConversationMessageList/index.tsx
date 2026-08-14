import React, { useCallback, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';
import { isBlank } from '@ringcentral-integration/commons/lib/isBlank';
import {
  RcIcon,
  RcIconButton,
  RcCheckbox,
  RcText,
  RcTypography,
  styled,
  palette2,
  css,
} from '@ringcentral/juno';
import {
  DefaultFile as fileSvg,
  Download as downloadSvg,
  Notes,
  Disposition as loggedSvg,
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
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  margin-bottom: 10px;
  color: ${palette2('neutral', 'f02')};
  clear: both;
`;

const BubbleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  clear: both;
  width: 100%;
`;

// Takes the remaining row width so the bubble keeps its inbound (left) /
// outbound (right) alignment while the control stays in a fixed right column.
const BubbleArea = styled.div<{ inbound?: boolean }>`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: ${(props) => (props.inbound ? 'flex-start' : 'flex-end')};
`;

const SelectionControl = styled.div`
  flex: 0 0 auto;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  .RcCheckbox-root {
    margin: 0;
  }
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
  background-color: ${palette2('neutral', 'b02')};
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

const SendStatus = styled(RcText)`
  float: right;
  clear: both;
`;

function MessageSendStatus({ direction, status }: { direction: string, status: string }) {
  if (direction === 'Inbound') {
    return null;
  }
  if (status === 'Queued') {
    return (
      <SendStatus variant="caption1" color="neutral.f04">Sending</SendStatus>
    );
  }
  if (status === 'SendingFailed') {
    return (
      <SendStatus variant="caption1" color="danger.f02">Sending failure</SendStatus>
    );
  }
  if (status === 'DeliveryFailed') {
    return (
      <SendStatus variant="caption1" color="danger.f02">Delivery failure</SendStatus>
    );
  }
  return null;
}

const HintText = styled(RcTypography)`
  margin-bottom: 24px;
  margin-top: -8px;
  clear: both;
  text-align: center;
  width: 100%;
`;

export function ThreadHintMessage({
  assignee,
  time,
  type,
  myExtensionId,
  statusReason,
}) {
  let message = '';
  if (type === 'ThreadCreatedHint') {
    message = 'Conversation has been created.';
  } else if (type == 'ThreadAssignedHint') {
    if (assignee) {
      const name = myExtensionId === assignee.extensionId ? 'you' : assignee.name;
      message = `Conversation has been assigned to ${name}.`;
    } else {
      message = 'This conversation is unassigned.';
    }
  } else if (type === 'ThreadResolvedHint') {
    if (statusReason === 'ThreadExpired') {
      message = 'Conversation resolved automatically.';
    } else {
      message = 'Conversation has been resolved.';
    }
  } else if (type === 'ThreadDeletedHint') {
    message = 'Conversation has been deleted.';
  }
  return (
    <MessageWrapper data-sign="threadHintMessage">
      {time ? (
        <Time data-sign="threadHintMessageTime">
          {time}
        </Time>
      ) : null}
      <HintText variant="caption1" color="interactive.f01">
        {message}
      </HintText>
    </MessageWrapper>
  );
};

const InternalNoteWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 16px;
  margin-left: auto;
  margin-right: auto;
  clear: both;

  &:first-child {
    margin-top: 10px;
  }
`;

const InternalNoteHeader = styled.div`
  margin-bottom: 8px;
  font-size: 0.75rem;
  color: ${palette2('neutral', 'f06')};
  line-height: 1.5;
  text-align: center;
`;

const InternalNoteIcon = styled(RcIcon)`
  color: ${palette2('neutral', 'f04')};
  vertical-align: middle;
  margin-right: 6px;
`;

const InternNoteTime = styled.span`
  color: ${palette2('neutral', 'f04')};
`;

const InternalNoteAuthor = styled.span`
  font-weight: 700;
`;

const InternalNoteContent = styled.div`
  border: 1px solid ${palette2('neutral', 'l02')};
  border-radius: 8px;
  padding: 12px;
  background: ${palette2('neutral', 'b01')};
  color: ${palette2('neutral', 'f06')};
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
  max-width: 270px;

  &:hover {
    cursor: pointer;
    background: ${palette2('neutral', 'b02')};
  }
`;

function InternalNoteMessage({
  text,
  time,
  author,
  onViewNote,
}: {
  text: string;
  time?: string;
  author?: { name?: string; extensionId?: string };
  onViewNote: () => void;
}) {
  return (
    <InternalNoteWrapper data-sign="internalNoteMessage">
      <InternalNoteHeader>
        <InternalNoteIcon symbol={Notes} size="small" />
        Internal note posted by <InternalNoteAuthor>{author?.name || 'Unknown'}</InternalNoteAuthor>
        {time && <InternNoteTime>&nbsp;&nbsp;{time}</InternNoteTime>}
      </InternalNoteHeader>
      <InternalNoteContent
        onClick={onViewNote}
      >
        {text}
      </InternalNoteContent>
    </InternalNoteWrapper>
  );
}

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
  messageStatus,
  selectionEnabled = false,
  logged = false,
  checked = false,
  onClickLog = undefined,
  onSelectDragStart = undefined,
  onSelectDragEnter = undefined,
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
  messageStatus: string;
  selectionEnabled?: boolean;
  logged?: boolean;
  checked?: boolean;
  onClickLog?: () => void;
  onSelectDragStart?: () => void;
  onSelectDragEnter?: () => void;
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
  const inbound = direction === 'Inbound';
  // Only unlogged messages are selectable; logged ones show a link-out icon.
  const selectable = selectionEnabled && !logged;
  let control = null;
  if (logged) {
    control = (
      <SelectionControl>
        <RcIconButton
          data-sign="messageLoggedIcon"
          symbol={loggedSvg}
          size="medium"
          color="success.f02"
          title="Logged"
          onClick={() => {
            if (typeof onClickLog === 'function') {
              onClickLog();
            }
          }}
        />
      </SelectionControl>
    );
  } else if (selectionEnabled) {
    // The checkbox is presentational only; selection is driven entirely by the
    // row's mouse handlers (see BubbleRow below) so a single click reliably
    // toggles and a press-drag paints the same state across messages.
    control = (
      <SelectionControl>
        <RcCheckbox
          data-sign="messageSelectCheckbox"
          checked={checked}
          onChange={() => {}}
        />
      </SelectionControl>
    );
  }
  const bubble = (
    <MessageTextWrapper
      data-sign={`${direction}Text`}
      inbound={inbound}
      big={subject && subject.length > 500}
    >
      {subjectNode}
      {imageAttachments}
      {otherAttachments}
    </MessageTextWrapper>
  );
  return (
    <MessageWrapper data-sign="message">
      {time ? (
        <Time data-sign="conversationSendTime">
          {time}
        </Time>
      ) : null}
      {sender && inbound ? (
        <Sender>{sender}</Sender>
      ) : null}
      <MessageSendStatus direction={direction} status={messageStatus} />
      {control ? (
        <BubbleRow
          // When selectable, the entire row (bubble + checkbox) is the
          // click/drag surface: mousedown toggles this message and starts a
          // drag; entering another row while dragging paints the same state.
          style={selectable ? { cursor: 'pointer', userSelect: 'none' } : undefined}
          onMouseDown={
            selectable
              ? (e) => {
                  e.preventDefault();
                  if (typeof onSelectDragStart === 'function') {
                    onSelectDragStart();
                  }
                }
              : undefined
          }
          onMouseEnter={
            selectable
              ? () => {
                  if (typeof onSelectDragEnter === 'function') {
                    onSelectDragEnter();
                  }
                }
              : undefined
          }
        >
          <BubbleArea inbound={inbound}>{bubble}</BubbleArea>
          {control}
        </BubbleRow>
      ) : (
        bubble
      )}
      <Clear />
    </MessageWrapper>
  );
};

const Root = styled.div`
  position: relative;
  display: block;
  overflow-y: auto;
  overflow-x: hidden;
  height: auto;
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
  messageSubjectRenderer = undefined,
  formatPhone,
  loadingNextPage = false,
  currentLocale = 'en-US',
  onAttachmentDownload = undefined,
  onLinkClick,
  loadPreviousMessages = () => null,
  myExtensionId,
  onViewNote,
  statusReason,
  selectionEnabled = false,
  selectedMessageIds = undefined,
  messageLogStateMap = {},
  setMessageSelected = undefined,
  onClickMessageLog = undefined,
}: {
  className: string;
  dateTimeFormatter: any;
  messages: MessageData[];
  showSender: boolean;
  messageSubjectRenderer: FunctionComponent<{ subject: string }>;
  formatPhone: (phone: string) => string;
  loadingNextPage: boolean;
  currentLocale: string;
  onAttachmentDownload: (uri: string, e: any) => void;
  onLinkClick: (e: any) => void;
  loadPreviousMessages: () => void;
  myExtensionId: string;
  onViewNote: () => void;
  statusReason: string;
  selectionEnabled?: boolean;
  selectedMessageIds?: Set<number>;
  messageLogStateMap?: Record<string, { logId: string }>;
  setMessageSelected?: (id: number, selected: boolean) => void;
  onClickMessageLog?: (logId: string) => void;
}) {
  const listRef = useRef(null);
  const scrollHeight = useRef(null);
  const scrollTop = useRef(null);
  const scrollUp = useRef(null);
  const messageLength = useRef(0);
  // Tracks an in-progress drag-select gesture. `mode` is decided by the first
  // message pressed (if it was checked we deselect the rest, otherwise select).
  const dragSelectRef = useRef<{ active: boolean; select: boolean }>({
    active: false,
    select: true,
  });

  useEffect(() => {
    const stopDrag = () => {
      dragSelectRef.current.active = false;
    };
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, []);

  const startDragSelect = useCallback(
    (id: number, currentlyChecked: boolean) => {
      const select = !currentlyChecked;
      dragSelectRef.current = { active: true, select };
      if (typeof setMessageSelected === 'function') {
        setMessageSelected(id, select);
      }
    },
    [setMessageSelected],
  );

  const dragSelectEnter = useCallback(
    (id: number) => {
      if (!dragSelectRef.current.active) {
        return;
      }
      if (typeof setMessageSelected === 'function') {
        setMessageSelected(id, dragSelectRef.current.select);
      }
    },
    [setMessageSelected],
  );

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
    if (
      message.recordType === 'ThreadCreatedHint' ||
      message.recordType === 'ThreadAssignedHint' ||
      message.recordType === 'ThreadResolvedHint' ||
      message.recordType === 'ThreadDeletedHint'
    ) {
      return (
        <ThreadHintMessage
          key={message.id}
          assignee={message.assignee}
          time={time || (
            dateTimeFormatter({
              utcTimestamp: message.creationTime || message.lastModifiedTime,
              type: 'long',
            })
          )}
          type={message.recordType}
          myExtensionId={myExtensionId}
          statusReason={statusReason}
        />
      );
    }
    if (message.recordType === 'AliveNote') {
      return (
        <InternalNoteMessage
          key={message.id}
          text={message.text}
          time={time || dateTimeFormatter({
            utcTimestamp: message.creationTime,
            type: 'long',
          })}
          author={message.author}
          onViewNote={onViewNote}
        />
      );
    }
    const loggedState = selectionEnabled ? messageLogStateMap?.[String(message.id)] : undefined;
    const isLogged = !!loggedState;
    const isChecked = !!selectedMessageIds && selectedMessageIds.has(message.id);
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
        messageStatus={message.messageStatus}
        selectionEnabled={selectionEnabled}
        logged={isLogged}
        checked={isChecked}
        onSelectDragStart={() => {
          startDragSelect(message.id, isChecked);
        }}
        onSelectDragEnter={() => {
          dragSelectEnter(message.id);
        }}
        onClickLog={() => {
          if (isLogged && typeof onClickMessageLog === 'function') {
            onClickMessageLog(loggedState.logId);
          }
        }}
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
