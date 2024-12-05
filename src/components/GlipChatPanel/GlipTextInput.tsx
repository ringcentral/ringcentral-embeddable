import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  styled,
  palette2,
  setOpacity,
  shadows,
  createGlobalStyle,
} from '@ringcentral/juno/foundation';
import ReactQuill, { Quill } from 'react-quill';
import QuillMention from 'quill-mention';

import 'react-quill/dist/quill.snow.css';
import 'quill-mention/dist/quill.mention.css';

Quill.register('modules/mentions', QuillMention);

const mentionMatchRegExp = /@\[[^\]]+\]/;

const QuillEditorWrapper = styled.div`
  flex: 1;

  .ql-container {
    font-family: Lato, Helvetica, Arial, sans-serif;
    color: ${palette2('neutral', 'f06')};
    font-size: 0.88rem;

    &.ql-snow {
      border: none;
    }

    .ql-clipboard {
      display: none;
    }
  }

  .ql-editor {
    background: ${palette2('neutral', 'b01')};
    border-radius: 4px;
    min-height: 35px;
    height: 35px;
    overflow-y: auto;

    p {
      margin: 0;
    }

    &.ql-blank::before {
      color: ${setOpacity(palette2('neutral', 'f06'), '64')};
      font-style: normal;
    }

    .mention {
      background-color: ${palette2('interactive', 'b01')};
      padding: 2px;
    }
  }
`;

const MentionListStyle = createGlobalStyle`
  body {
    .ql-mention-list-container {
      font-family: Lato, Helvetica, Arial, sans-serif;
      color: ${palette2('neutral', 'f06')};
      background-color: ${palette2('neutral', 'b01')};
      box-shadow: ${shadows('8')};
      border-radius: 4px;
      outline: 0;
      border: none;
    
      .ql-mention-list {
        padding: 0;
        margin: 0;
      }

      .ql-mention-list-item {
        outline: none;
        box-sizing: border-box;
        height: auto;
        min-height: 32px;
        min-width: 112px;
        padding: 4px;
        font-size: 0.9375rem;
        font-weight: 400;
        font-family: Lato, Helvetica, Arial, sans-serif;
        line-height: 22px;
        color: ${palette2('neutral', 'f06')};

        &.selected {
          background-color: ${setOpacity(palette2('neutral', 'f04'), '12')};
        }
      }
    }
  }
`;

function getTextFromDelta(delta) {
  const text = delta.ops.reduce((text, op) => {
    if (typeof op.insert === 'string') {
      return `${text}${op.insert}`;
    }
    if (typeof op.insert === 'object' && op.insert.mention) {
      return `${text}${op.insert.mention.value}`;
    }
    return text;
  }, '');
  return text.trimEnd();
}

function getDeltaFromText(text, suggestions) {
  if (!text) {
    return { ops: [{ insert: '\n' }] };
  }
  let currentText = text;
  if (currentText[currentText.length - 1] !== '\n') {
    currentText += '\n';
  }
  if (!mentionMatchRegExp.test(currentText)) {
    return { ops: [{ insert: currentText }] };
  }
  const delta = { ops: [] };
  let matchResult = currentText.match(mentionMatchRegExp);
  let mentionIndex = 0;
  while(matchResult) {
    const previousText = currentText.slice(0, currentText.match(mentionMatchRegExp).index);
    delta.ops.push({ insert: previousText });
    const mentionText = matchResult[0];
    const mentionId = mentionText.slice(2, -1);
    const mentionItem = suggestions.find(suggestion => suggestion.email === mentionId);
    if (!mentionItem) {
      delta.ops.push({ insert: mentionText });
    } else {
      const mentionObject = {
        id: mentionId,
        value: `[${mentionItem.email}]`,
        denotationChar: '',
        index: `${mentionIndex}`,
      };
      delta.ops.push({ insert: '@' });
      delta.ops.push({ insert: { mention: mentionObject }});
      mentionIndex += 1;
    }
    currentText = currentText.slice(matchResult.index + mentionText.length);
    matchResult = currentText.match(mentionMatchRegExp);
  }
  if (!matchResult) {
    delta.ops.push({ insert: currentText });
  }
  return delta;
}

type Suggestion = {
  email?: string;
  firstName: string;
  lastName?: string;
}

export function GlipTextInput({
  value = '',
  onChange,
  suggestions,
  placeholder,
  disabled,
  className,
  editorRef,
}: {
  value?: string;
  onChange: (string, mentions) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  editorRef?: any;
}) {
  const [deltaValue, setDeltaValue] = useState(getDeltaFromText(value, suggestions));
  const suggestionsRef = useRef(suggestions);
  const changedRef = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (changedRef.current) {
      changedRef.current = false;
      return;
    }
    setDeltaValue(getDeltaFromText(value, suggestions));
  }, [value, suggestions]);

  useEffect(() => {
    if (inputRef.current) {
      if (editorRef) {
        editorRef.current = inputRef.current.getEditor();
      }
    }
  }, []);

  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const modules = useMemo(() => ({
    toolbar: false,
    mention: {
      allowedChars: /^[a-zA-Z0-9_\s]*$/,
      mentionDenotationChars: ["@"],
      showDenotationChar: false,
      positioningStrategy: 'fixed',
      source: function(searchTerm, renderList) {
        const options = suggestionsRef.current.map((item) => ({
          id: item.email,
          value: `${item.firstName}${item.lastName ? ` ${item.lastName}` : ''}`,
        }));
        if (searchTerm.length === 0) {
          renderList(options, searchTerm);
        } else {
          const matches = options.filter((suggestion) => {
            return suggestion.value.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1;
          });
          renderList(matches, searchTerm);
        }
      },
      onSelect: function (item, insertItem) {
        insertItem({
          id: item.id,
          value: `[${item.id}]`,
          denotationChar: '@'
        }, true);
      },
    }
  }), []);

  useEffect(() => {
    return () => {
      // clear mention list if exists
      const mentionList = document.querySelector('.ql-mention-list-container');
      if (mentionList) {
        mentionList.remove();
      }
    };
  }, []);

  return (
    <QuillEditorWrapper className={className}>
      <MentionListStyle />
      <ReactQuill
        theme="snow"
        value={deltaValue}
        ref={inputRef}
        onChange={(content, delta, source, editor) => {
          const newDelta = editor.getContents();
          setDeltaValue(newDelta);
          const newValue = getTextFromDelta(newDelta);
          const mentions = [];
          newDelta.ops.forEach((op) => {
            if (typeof op.insert === 'object' && op.insert.mention) {
              mentions.push({
                id: op.insert.mention.id,
                mention: `@${op.insert.mention.value}`
              });
            }
          });
          if (newValue !== value) {
            changedRef.current = true;
            onChange(newValue, mentions);
          }
        }}
        placeholder={placeholder}
        modules={modules}
        readOnly={disabled}
      />
    </QuillEditorWrapper>
  );
}