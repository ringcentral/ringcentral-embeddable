/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { GlipTextInput } from '../../src/components/GlipChatPanel/GlipTextInput';

const mockEditors = [];

jest.mock('quill', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
  },
}));

jest.mock('quill-mention', () => ({
  Mention: function Mention() {},
  MentionBlot: function MentionBlot() {},
}));

jest.mock('@ringcentral/juno/foundation', () => {
  const React = require('react');
  const createComponent = (tag) => React.forwardRef((props, ref) => (
    React.createElement(tag, { ...props, ref }, props.children)
  ));
  const styled = {
    div: () => createComponent('div'),
  };
  return {
    createGlobalStyle: () => function MockGlobalStyle() {
      return <span data-sign="mention-list-style" data-testid="mention-list-style" />;
    },
    palette2: jest.fn(() => '#000'),
    setOpacity: jest.fn((value, opacity) => `${value}-${opacity}`),
    shadows: jest.fn(() => 'none'),
    styled,
  };
});

jest.mock('../../src/components/GlipChatPanel/ReactQuill', () => {
  const React = require('react');
  return {
    ReactQuill: React.forwardRef((props, ref) => {
      const [sourceResult, setSourceResult] = React.useState('');
      const editor = React.useMemo(() => ({
        getSelection: jest.fn(() => ({ index: 2, length: 0 })),
        insertText: jest.fn(),
      }), []);
      React.useImperativeHandle(ref, () => ({
        getEditor: () => editor,
      }));
      React.useEffect(() => {
        mockEditors.push(editor);
      }, [editor]);
      const mentionDelta = {
        ops: [
          { insert: 'Hello ' },
          {
            insert: {
              mention: {
                id: 'grace@example.com',
              },
            },
          },
          { insert: '\n' },
        ],
      };
      return (
        <div
          data-readonly={props.readOnly ? 'true' : 'false'}
          data-sign="react-quill"
          data-testid="react-quill"
        >
          <span data-sign="quill-value" data-testid="quill-value">
            {JSON.stringify(props.value)}
          </span>
          <span data-sign="quill-placeholder" data-testid="quill-placeholder">
            {props.placeholder}
          </span>
          <span data-sign="source-result" data-testid="source-result">
            {sourceResult}
          </span>
          <button
            type="button"
            onClick={() => props.onChange('', {}, 'user', {
              getContents: () => mentionDelta,
            })}
          >
            trigger-change
          </button>
          <button
            type="button"
            onClick={() => props.modules.mention.source('', (items, term) => {
              setSourceResult(JSON.stringify({ items, term }));
            })}
          >
            source-empty
          </button>
          <button
            type="button"
            onClick={() => props.modules.mention.source('gra', (items, term) => {
              setSourceResult(JSON.stringify({ items, term }));
            })}
          >
            source-search
          </button>
        </div>
      );
    }),
  };
});

describe('GlipTextInput', () => {
  beforeEach(() => {
    mockEditors.length = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('converts mention text to deltas, filters mention suggestions, and emits text with mentions', () => {
    const onChange = jest.fn();
    const ref = React.createRef();
    render(
      <GlipTextInput
        disabled
        onChange={onChange}
        placeholder="Reply"
        ref={ref}
        suggestions={[
          {
            email: 'grace@example.com',
            firstName: 'Grace',
            lastName: 'Hopper',
          },
          {
            email: 'ada@example.com',
            firstName: 'Ada',
          },
        ]}
        value="Hi @[grace@example.com]"
      />,
    );

    expect(screen.getByTestId('quill-placeholder').textContent).toBe('Reply');
    expect(screen.getByTestId('react-quill').dataset.readonly).toBe('true');
    expect(screen.getByTestId('quill-value').textContent).toContain('"mention"');
    expect(screen.getByTestId('quill-value').textContent).toContain('Grace Hopper');

    fireEvent.click(screen.getByRole('button', { name: 'source-empty' }));
    expect(screen.getByTestId('source-result').textContent).toContain('Grace Hopper');
    expect(screen.getByTestId('source-result').textContent).toContain('Ada');

    fireEvent.click(screen.getByRole('button', { name: 'source-search' }));
    expect(screen.getByTestId('source-result').textContent).toContain('Grace Hopper');
    expect(screen.getByTestId('source-result').textContent).not.toContain('Ada');

    fireEvent.click(screen.getByRole('button', { name: 'trigger-change' }));
    expect(onChange).toHaveBeenCalledWith(
      'Hello @[grace@example.com]\n',
      [{
        id: 'grace@example.com',
        mention: '@[grace@example.com]',
      }],
    );

    ref.current.insertText(1, '!');
    expect(mockEditors[0].insertText).toHaveBeenCalledWith(1, '!');
    expect(ref.current.getSelection()).toEqual({ index: 2, length: 0 });
  });

  it('keeps plain text deltas, updates from props, and removes stale mention list markup on unmount', () => {
    const onChange = jest.fn();
    const mentionList = document.createElement('div');
    mentionList.className = 'ql-mention-list-container';
    document.body.appendChild(mentionList);
    const { rerender, unmount } = render(
      <GlipTextInput
        onChange={onChange}
        suggestions={[]}
        value="Plain text"
      />,
    );

    expect(screen.getByTestId('quill-value').textContent).toContain('Plain text\\n');
    rerender(
      <GlipTextInput
        onChange={onChange}
        suggestions={[]}
        value=""
      />,
    );
    expect(screen.getByTestId('quill-value').textContent).toContain('"\\n"');
    unmount();
    expect(document.querySelector('.ql-mention-list-container')).toBeNull();
  });
});
