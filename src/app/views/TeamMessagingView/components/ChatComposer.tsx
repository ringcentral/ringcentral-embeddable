import { MessageInput } from '@ringcentral-integration/next-widgets/components/MessageInput';
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

const NO_ATTACHMENTS: never[] = [];

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
 * button inside the text field. Typing "@" suggests chat members.
 */
export function ChatComposer({
  members,
  draft,
  saveDraft,
  sendText,
  sendFile,
}: {
  members: readonly TeamMessagingMember[];
  draft: string;
  saveDraft: (text: string) => void;
  sendText: (text: string) => Promise<boolean>;
  sendFile: (file: File) => Promise<void>;
}): React.ReactElement {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);
  const [text, setText] = useState(draft);
  const [mentions, setMentions] = useState<ComposerMention[]>([]);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
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
  const handleSend = async (value: string): Promise<void> => {
    const rawMentions = mentions;
    if (!value.trim()) {
      return;
    }
    setText('');
    setMentions([]);
    setMentionState(null);
    const sent = await sendText(serializeMentions(value, rawMentions));
    if (!sent) {
      // Restore the message, as the legacy app did.
      setText(value);
      setMentions(rawMentions);
    }
  };
  return (
    <div
      className="relative flex-none border-t border-neutral-b4"
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
        attachments={NO_ATTACHMENTS}
        acceptFileTypes={ACCEPT_ANY_FILE}
        maxLength={MAX_TEXT_LENGTH}
        sendDisabled={!text.trim()}
        onChange={handleChange}
        onSend={(value) => void handleSend(value)}
        onAddAttachment={(files) => {
          files.forEach((file) => void sendFile(file));
        }}
        onRemoveAttachment={() => undefined}
      />
    </div>
  );
}
