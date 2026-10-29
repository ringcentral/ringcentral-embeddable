import { MessageInput } from '@ringcentral-integration/next-widgets/components/MessageInput';
import type { FileItem } from '@ringcentral-integration/next-widgets/components/MessageInput/FileAttacher';
import { ListItem, ListItemText } from '@ringcentral/spring-ui';
import React, {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { TeamMessagingMember } from '../../../services/TeamMessaging';
import { getPersonName } from '../../../services/TeamMessaging';
import {
  type ComposerMention,
  getMentionQuery,
  insertMention,
  serializeMentions,
} from '../mentionText';
import { PersonAvatar } from './ChatAvatar';

const MAX_SUGGESTIONS = 8;

/** The Team Messaging API accepts posts of up to 10000 characters. */
const MAX_TEXT_LENGTH = 10000;

/** Any file type can be shared in a chat. */
const ACCEPT_ANY_FILE = '*/*';

type MentionState = { query: string; start: number; caret: number };

/** A member whose profile has loaded, so it has a name to match and show. */
function hasProfile(member: TeamMessagingMember): boolean {
  return !!(member.firstName || member.lastName || member.email);
}

function filterSuggestions(
  members: readonly TeamMessagingMember[],
  query: string,
): TeamMessagingMember[] {
  const search = query.toLowerCase();
  return members
    .filter(
      (member) =>
        !member.isMe &&
        hasProfile(member) &&
        getPersonName(member).toLowerCase().includes(search),
    )
    .slice(0, MAX_SUGGESTIONS);
}

let fileItemCount = 0;

function toFileItem(file: File): FileItem {
  fileItemCount += 1;
  return {
    id: `${Date.now()}-${fileItemCount}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  };
}

/** Keeps the draft in the chat view when the composer unmounts. */
function useDraftSaver(text: string, saveDraft: (text: string) => void): void {
  const textRef = useRef(text);
  textRef.current = text;
  useEffect(() => () => saveDraft(textRef.current), [saveDraft]);
}

function MentionSuggestions({
  suggestions,
  activeIndex,
  onPick,
}: {
  suggestions: TeamMessagingMember[];
  activeIndex: number;
  onPick: (member: TeamMessagingMember) => void;
}): React.ReactElement {
  return (
    <div
      className="absolute bottom-full left-3 right-3 z-10 max-h-56 overflow-y-auto rounded border border-neutral-b4 bg-neutral-base shadow-lg"
      data-sign="mentionSuggestions"
    >
      {suggestions.map((member, index) => (
        <ListItem
          key={member.id}
          size="small"
          clickable
          hoverable
          highlighted={index === activeIndex}
          data-sign="mentionSuggestion"
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(member);
          }}
        >
          <PersonAvatar member={member} size="xsmall" />
          <ListItemText primary={getPersonName(member)} />
        </ListItem>
      ))}
    </div>
  );
}

/**
 * The chat composer, the same input as SMS: attach, emoji, and the send
 * button inside the text field. Attached files wait in the input and go out
 * with the text as one post. Typing "@" suggests chat members.
 */
export function ChatComposer({
  members,
  draft,
  saveDraft,
  sendMessage,
  canAttach,
  toolbar,
}: {
  members: readonly TeamMessagingMember[];
  draft: string;
  saveDraft: (text: string) => void;
  sendMessage: (text: string, files: File[]) => Promise<boolean>;
  canAttach: (file: File) => boolean;
  /** More buttons after attach and emoji, such as "Create task". */
  toolbar?: React.ReactNode;
}): React.ReactElement {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);
  const [text, setText] = useState(draft);
  const [mentions, setMentions] = useState<ComposerMention[]>([]);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  useDraftSaver(text, saveDraft);
  const suggestions = mentionState
    ? filterSuggestions(members, mentionState.query)
    : [];
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input && caretRef.current !== null) {
      input.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  });
  const handleChange = (value: string): void => {
    setText(value);
    const caret = inputRef.current?.selectionStart ?? value.length;
    const query = getMentionQuery(value, caret);
    setMentionState(query ? { ...query, caret } : null);
    setActiveIndex(0);
  };
  const pickMention = (member: TeamMessagingMember): void => {
    if (!mentionState) {
      return;
    }
    const name = getPersonName(member);
    const result = insertMention({ text, ...mentionState, name });
    caretRef.current = result.caret;
    setText(result.text);
    setMentions((items) => [...items, { id: member.id, name }]);
    setMentionState(null);
    inputRef.current?.focus();
  };
  // Runs before the input's own keys, so Enter picks a suggestion instead of
  // sending while the suggestions are open.
  const handleKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (suggestions.length === 0) {
      return;
    }
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step) {
      setActiveIndex(
        (index) => (index + step + suggestions.length) % suggestions.length,
      );
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      pickMention(suggestions[activeIndex] ?? suggestions[0]);
    } else if (event.key === 'Escape') {
      setMentionState(null);
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };
  const addAttachments = (files: File[]): void => {
    const accepted = files.filter(canAttach).map(toFileItem);
    if (accepted.length > 0) {
      setAttachments((items) => [...items, ...accepted]);
    }
  };
  const removeAttachment = (item: FileItem): void => {
    setAttachments((items) => items.filter(({ id }) => id !== item.id));
  };
  const handleSend = async (value: string): Promise<void> => {
    const rawMentions = mentions;
    const rawAttachments = attachments;
    if (!value.trim() && rawAttachments.length === 0) {
      return;
    }
    setText('');
    setMentions([]);
    setMentionState(null);
    setAttachments([]);
    const sent = await sendMessage(
      value.trim() ? serializeMentions(value, rawMentions) : '',
      rawAttachments.map(({ file }) => file),
    );
    if (!sent) {
      // Restore the message, as the legacy app did.
      setText(value);
      setMentions(rawMentions);
      setAttachments(rawAttachments);
    }
  };
  return (
    <div
      // Attachments are compact chips sized to their names, several to a row,
      // instead of the SMS input's full-width rows.
      className="relative flex-none border-t border-neutral-b4 [&_[data-sign=file-info]]:h-8 [&_[data-sign=file-info]]:gap-1 [&_[data-sign=file-info]]:w-auto [&_[data-sign=file-info]]:max-w-full [&_[data-sign=file-info]]:py-1 [&_[data-sign=file-info]]:pl-2 [&_[data-sign=file-info]]:pr-1.5"
      data-sign="chatComposer"
      onKeyDownCapture={handleKeyDownCapture}
    >
      {suggestions.length > 0 ? (
        <MentionSuggestions
          suggestions={suggestions}
          activeIndex={activeIndex}
          onPick={pickMention}
        />
      ) : null}
      <MessageInput
        inputText={text}
        inputRef={inputRef}
        attachments={attachments}
        acceptFileTypes={ACCEPT_ANY_FILE}
        maxLength={MAX_TEXT_LENGTH}
        sendDisabled={!text.trim() && attachments.length === 0}
        onChange={handleChange}
        onSend={(value) => void handleSend(value)}
        onAddAttachment={addAttachments}
        onRemoveAttachment={removeAttachment}
        toolbar={toolbar}
      />
    </div>
  );
}
