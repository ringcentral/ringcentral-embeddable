// Refactor from https://github.com/zenoamaro/react-quill
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  cloneElement,
  Children,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { CSSProperties, ReactElement, ReactInstance, EventHandler, FC, RefObject } from 'react';
import ReactDOM from 'react-dom';
import Quill from 'quill';
import isEqual from 'lodash/isEqual';

import type {
  QuillOptions,
  Delta,
  Range,
  Bounds,
} from "quill";

export type Sources = "api" | "user" | "silent";

export interface QuillOptionsStatic extends QuillOptions {
  tabIndex?: number,
}

export type Value = string | Delta;

export interface ReactQuillProps {
  bounds?: string | HTMLElement,
  children?: ReactElement<any>,
  className?: string,
  defaultValue?: Value,
  formats?: string[],
  id?: string,
  modules?: Record<string, unknown>,
  onChange?(
    value: string,
    delta: Delta,
    source: Sources,
    editor: UnprivilegedEditor,
  ): void,
  onChangeSelection?(
    selection: Range,
    source: Sources,
    editor: UnprivilegedEditor,
  ): void,
  onFocus?(
    selection: Range,
    source: Sources,
    editor: UnprivilegedEditor,
  ): void,
  onBlur?(
    previousSelection: Range,
    source: Sources,
    editor: UnprivilegedEditor,
  ): void,
  onKeyDown?: EventHandler<any>,
  onKeyPress?: EventHandler<any>,
  onKeyUp?: EventHandler<any>,
  placeholder?: string,
  preserveWhitespace?: boolean,
  readOnly?: boolean,
  style?: CSSProperties,
  tabIndex?: number,
  theme?: string,
  value?: Value,
}

export interface UnprivilegedEditor {
  getLength(): number;
  getText(index?: number, length?: number): string;
  getHTML(): string;
  getBounds(index: number, length?: number): Bounds;
  getSelection(focus?: boolean): Range;
  getContents(index?: number, length?: number): Delta;
}

export const ReactQuill: FC<ReactQuillProps> = forwardRef((props, ref) => {
  const {
    theme = 'snow', 
    modules = {}, 
    readOnly = false,
    children,
    preserveWhitespace,
    bounds,
    formats,
    placeholder,
    tabIndex,
    id,
    style,
    className,
    onKeyPress,
    onKeyDown,
    onKeyUp,
  } = props;

  // State and refs to replace class component state
  const [generation, setGeneration] = useState(0);
  const [value, setValue] = useState<Value>(props.value ?? props.defaultValue ?? '');
  const [selection, setSelection] = useState<Range|null>(null);

  const editorRef = useRef<Quill | null>(null);
  const editingAreaRef = useRef<ReactInstance | null>(null);
  const unprivilegedEditorRef = useRef<UnprivilegedEditor | null>(null);
  const lastDeltaChangeSetRef = useRef<Delta | null>(null);
  const dirtyPropsRef = useRef({
    modules,
    formats,
    bounds,
    theme,
    children
  });
  const regenerationSnapshotRef = useRef<{
    delta: Delta,
    selection: Range | null,
  } | null>(null);

  // Dirty and clean props lists (same as class component)
  const dirtyProps: (keyof ReactQuillProps)[] = [
    'modules', 'formats', 'bounds', 'theme', 'children'
  ];

  const cleanProps: (keyof ReactQuillProps)[] = [
    'id', 'className', 'style', 'placeholder', 'tabIndex',
    'onChange', 'onChangeSelection', 'onFocus', 'onBlur',
    'onKeyPress', 'onKeyDown', 'onKeyUp'
  ];

  // Utility functions (mostly ported from class component methods)
  // const isControlled = useCallback(() => 'value' in props, [props]);
  
  const isDelta = useCallback((val: any): boolean => {
    return val && val.ops;
  }, []);

  const isEqualValue = useCallback((val1: any, val2: any): boolean => {
    if (isDelta(val1) && isDelta(val2)) {
      return isEqual(val1.ops, val2.ops);
    }
    return isEqual(val1, val2);
  }, [isDelta]);

  const makeUnprivilegedEditor = useCallback((editor: Quill): UnprivilegedEditor => {
    return {
      getHTML: () => editor.root.innerHTML,
      getLength: editor.getLength.bind(editor),
      getText: editor.getText.bind(editor),
      getContents: editor.getContents.bind(editor),
      getSelection: editor.getSelection.bind(editor),
      getBounds: editor.getBounds.bind(editor),
    };
  }, []);

  const getEditorConfig = useCallback((): QuillOptionsStatic => ({
    bounds,
    formats,
    modules,
    placeholder,
    readOnly,
    tabIndex,
    theme,
  }), [bounds, formats, modules, placeholder, readOnly, tabIndex, theme]);

  // Editor lifecycle methods
  const createEditor = useCallback((element: HTMLElement, config: QuillOptionsStatic) => {
    const editor = new Quill(element, config);
    if (config.tabIndex != null) {
      if (editor.scroll.domNode) {
        (editor.scroll.domNode as HTMLElement).tabIndex = config.tabIndex;
      }
    }
    return editor;
  }, []);

  const setEditorContents = useCallback((editor: Quill, content: Value) => {
    setValue(content);
    const currentSelection = selection;
    
    if (typeof content === 'string') {
      editor.setContents(editor.clipboard.convert({
        text: content,
      }));
    } else {
      editor.setContents(content);
    }

    // Use setTimeout to set selection in next tick
    setTimeout(() => {
      if (currentSelection) {
        const length = editor.getLength();
        const safeIndex = Math.max(0, Math.min(currentSelection.index, length - 1));
        const safeLength = Math.max(0, Math.min(currentSelection.length, (length - 1) - safeIndex));
        
        editor.setSelection({
          index: safeIndex,
          length: safeLength
        });
      }
    });
  }, [selection]);

  // Event Handlers
  const onEditorChangeText = useCallback((
    editorValue: string,
    delta: Delta,
    source: Sources,
    editor: UnprivilegedEditor
  ) => {
    if (!editorRef.current) return;

    const nextContents = isDelta(value)
      ? editor.getContents()
      : editor.getHTML();

    if (!isEqualValue(nextContents, value)) {
      lastDeltaChangeSetRef.current = delta;
      setValue(nextContents);
      props.onChange?.(editorValue, delta, source, editor);
    }
  }, [value, props.onChange, isDelta, isEqualValue]);

  const onEditorChangeSelection = useCallback((
    nextSelection: Range,
    source: Sources,
    editor: UnprivilegedEditor
  ) => {
    if (!editorRef.current) return;

    const currentSelection = selection;
    const hasGainedFocus = !currentSelection && nextSelection;
    const hasLostFocus = currentSelection && !nextSelection;

    if (isEqual(nextSelection, currentSelection)) return;

    setSelection(nextSelection);
    props.onChangeSelection?.(nextSelection, source, editor);

    if (hasGainedFocus) {
      props.onFocus?.(nextSelection, source, editor);
    } else if (hasLostFocus) {
      props.onBlur?.(currentSelection, source, editor);
    }
  }, [selection, props.onChangeSelection, props.onFocus, props.onBlur]);

  const onEditorChange = useCallback((
    eventName: 'text-change' | 'selection-change',
    rangeOrDelta: Range | Delta,
    oldRangeOrDelta: Range | Delta,
    source: Sources
  ) => {
    if (eventName === 'text-change') {
      onEditorChangeText(
        editorRef.current!.root.innerHTML,
        rangeOrDelta as Delta,
        source,
        unprivilegedEditorRef.current!
      );
    } else if (eventName === 'selection-change') {
      onEditorChangeSelection(
        rangeOrDelta as Range,
        source,
        unprivilegedEditorRef.current!
      );
    }
  }, [onEditorChangeText, onEditorChangeSelection]);

  // Component lifecycle simulation
  useEffect(() => {
    // Create editor
    const editingArea = ReactDOM.findDOMNode(editingAreaRef.current) as HTMLElement;
    const editorConfig = getEditorConfig();
    const editor = createEditor(editingArea, editorConfig);
    
    editorRef.current = editor;
    unprivilegedEditorRef.current = makeUnprivilegedEditor(editor);

    // Hook editor events
    editor.on('editor-change', onEditorChange);
    
    // Set initial contents
    setEditorContents(editor, value);

    // Cleanup
    return () => {
      editor.off('editor-change', onEditorChange);
      editorRef.current = null;
      unprivilegedEditorRef.current = null;
    };
  }, [generation]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    const editor = editorRef.current;
    const editorValue = editor.getContents();
    if (!isEqual(props.value, editorValue)) {
      setEditorContents(editor, props.value);
    }
  }, [props.value]);

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current,
  }));

  // Handle prop changes that require regeneration
  useEffect(() => {
    const requireRegeneration = dirtyProps.some((prop) => 
      !isEqual(props[prop], dirtyPropsRef.current[prop])
    );
    dirtyPropsRef.current = {
      modules, formats, bounds, theme, children,
    };

    if (requireRegeneration) {
      if (editorRef.current) {
        const delta = editorRef.current.getContents();
        const currentSelection = editorRef.current.getSelection();
        
        regenerationSnapshotRef.current = { delta, selection: currentSelection };
        setGeneration(prev => prev + 1);
      }
    }
  }, [modules, formats, bounds, theme, children]);

  // Render editing area
  const renderEditingArea = () => {
    const properties = {
      key: generation,
      ref: (instance: ReactInstance | null) => {
        editingAreaRef.current = instance;
      },
    };

    if (Children.count(children)) {
      return cloneElement(
        Children.only(children)!,
        properties
      );
    }

    return preserveWhitespace ?
      <pre {...properties}/> :
      <div {...properties}/>;
  };

  return (
    <div
      id={id}
      style={style}
      key={generation}
      className={`quill ${className ?? ''}`}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      {renderEditingArea()}
    </div>
  );
});
