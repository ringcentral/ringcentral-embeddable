/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ReactQuill } from '../../src/components/GlipChatPanel/ReactQuill';

const mockQuillInstances = [];

jest.mock('quill', () => {
  class MockQuill {
    constructor(element, config) {
      this.clipboard = {
        convert: jest.fn(({ text }) => ({
          ops: [{ insert: text || '' }],
        })),
      };
      this.config = config;
      this.contents = { ops: [{ insert: '\n' }] };
      this.handlers = {};
      this.root = element;
      this.root.innerHTML = '';
      this.scroll = {
        domNode: element,
      };
      this.selection = null;
      this.setContents = jest.fn((contents) => {
        this.contents = contents;
      });
      this.setSelection = jest.fn((selection) => {
        this.selection = selection;
      });
      mockQuillInstances.push(this);
    }

    getBounds() {
      return { left: 1, top: 2 };
    }

    getContents() {
      return this.contents;
    }

    getLength() {
      return 10;
    }

    getSelection() {
      return this.selection;
    }

    getText() {
      return 'editor text';
    }

    off(eventName) {
      delete this.handlers[eventName];
    }

    on(eventName, handler) {
      this.handlers[eventName] = handler;
    }

    emit(eventName, ...args) {
      this.handlers[eventName](...args);
    }
  }

  return {
    __esModule: true,
    default: MockQuill,
  };
});

describe('ReactQuill', () => {
  beforeEach(() => {
    mockQuillInstances.length = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates a Quill editor, forwards text and selection changes, and exposes the editor ref', async () => {
    const onBlur = jest.fn();
    const onChange = jest.fn();
    const onChangeSelection = jest.fn();
    const onFocus = jest.fn();
    const onKeyDown = jest.fn();
    const ref = React.createRef();

    const { container, rerender } = render(
      <ReactQuill
        className="custom-editor"
        defaultValue="hello"
        formats={['bold']}
        id="editor"
        modules={{ toolbar: false }}
        onBlur={onBlur}
        onChange={onChange}
        onChangeSelection={onChangeSelection}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder="Write"
        ref={ref}
        tabIndex={5}
        theme="snow"
      />,
    );

    await waitFor(() => {
      expect(mockQuillInstances).toHaveLength(1);
    });
    const editor = mockQuillInstances[0];
    expect(ref.current.getEditor()).toBe(editor);
    expect(editor.config).toMatchObject({
      formats: ['bold'],
      modules: { toolbar: false },
      placeholder: 'Write',
      readOnly: false,
      tabIndex: 5,
      theme: 'snow',
    });
    expect(editor.scroll.domNode.tabIndex).toBe(5);
    expect(editor.setContents).toHaveBeenCalledWith({
      ops: [{ insert: 'hello' }],
    });

    fireEvent.keyDown(container.firstChild, {
      key: 'Enter',
    });
    expect(onKeyDown).toHaveBeenCalled();

    act(() => {
      editor.root.innerHTML = '<p>changed</p>';
      editor.contents = { ops: [{ insert: 'changed' }] };
      editor.emit(
        'editor-change',
        'text-change',
        { ops: [{ insert: 'changed' }] },
        {},
        'user',
      );
    });
    expect(onChange).toHaveBeenCalledWith(
      '<p>changed</p>',
      { ops: [{ insert: 'changed' }] },
      'user',
      expect.objectContaining({
        getHTML: expect.any(Function),
      }),
    );

    act(() => {
      editor.emit(
        'editor-change',
        'selection-change',
        { index: 1, length: 0 },
        null,
        'user',
      );
    });
    expect(onChangeSelection).toHaveBeenCalledWith(
      { index: 1, length: 0 },
      'user',
      expect.any(Object),
    );
    expect(onFocus).toHaveBeenCalledWith(
      { index: 1, length: 0 },
      'user',
      expect.any(Object),
    );

    act(() => {
      editor.emit(
        'editor-change',
        'selection-change',
        null,
        { index: 1, length: 0 },
        'user',
      );
    });
    expect(onBlur).not.toHaveBeenCalled();

    rerender(
      <ReactQuill
        modules={{ toolbar: false }}
        onChange={onChange}
        ref={ref}
        value={{ ops: [{ insert: 'controlled' }] }}
      />,
    );
    expect(editor.setContents).toHaveBeenCalledWith({
      ops: [{ insert: 'controlled' }],
    });

    rerender(
      <ReactQuill
        modules={{ toolbar: true }}
        onChange={onChange}
        ref={ref}
        value={{ ops: [{ insert: 'controlled' }] }}
      />,
    );
    await waitFor(() => {
      expect(mockQuillInstances).toHaveLength(3);
    });
    expect(mockQuillInstances[2].config.modules).toEqual({ toolbar: true });
  });

  it('renders preserve-whitespace, custom children, and key handlers', async () => {
    const onKeyPress = jest.fn();
    const onKeyUp = jest.fn();
    const { container, rerender } = render(
      <ReactQuill
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
        preserveWhitespace
      />,
    );

    await waitFor(() => {
      expect(mockQuillInstances).toHaveLength(1);
    });
    expect(container.querySelector('pre')).toBeTruthy();
    fireEvent.keyPress(container.firstChild, { charCode: 97, key: 'a' });
    fireEvent.keyUp(container.firstChild, { key: 'a' });
    expect(onKeyPress).toHaveBeenCalled();
    expect(onKeyUp).toHaveBeenCalled();

    rerender(
      <ReactQuill>
        <section data-sign="custom-editor" data-testid="custom-editor" />
      </ReactQuill>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('custom-editor')).toBeTruthy();
    });
  });
});
