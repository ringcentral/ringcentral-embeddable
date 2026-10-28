// The keypad on the RingCX call page. It overlays the call page only, so with
// the app expanded the side column stays usable, and opening it leaves the
// call page behind it where it was.

import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Like the Spring UI Drawer (a Modal on a Portal), the drawer goes to
// `document.body` unless asked to render in place.
jest.mock('@ringcentral/spring-ui', () => {
  const { createPortal } = jest.requireActual('react-dom');
  return {
    ...jest.requireActual('@ringcentral/spring-ui'),
    Drawer: ({ open, disablePortal, children, 'data-sign': dataSign }) => {
      if (!open) {
        return null;
      }
      const drawer = <div data-sign={dataSign}>{children}</div>;
      return disablePortal ? drawer : createPortal(drawer, globalThis.document.body);
    },
    DialTextField: ({ inputRef, value, 'data-sign': dataSign }) => (
      <div data-sign={dataSign}>
        <input ref={inputRef} value={value} readOnly />
      </div>
    ),
    DialPad: () => null,
  };
});

import { DialpadPanel } from '../../src/ringcx/components/DialpadPanel/DialpadPanel';

const byDataSign = (dataSign) =>
  document.querySelector(`[data-sign="${dataSign}"]`);

function renderPanel(props = {}) {
  render(
    <div data-sign="callPage">
      <DialpadPanel
        isOpen
        value=""
        onToggle={jest.fn()}
        onChange={jest.fn()}
        {...props}
      />
    </div>,
  );
}

describe('DialpadPanel', () => {
  let focusSpy;

  beforeEach(() => {
    focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
  });

  afterEach(() => {
    focusSpy.mockRestore();
  });

  test('opens inside the page that hosts it', () => {
    renderPanel();

    const keypad = byDataSign('dialpadPanel');
    expect(keypad).not.toBeNull();
    expect(byDataSign('callPage')).toContainElement(keypad);
  });

  test('focuses the keypad field without scrolling the page behind it', async () => {
    renderPanel();

    const input = byDataSign('keypadTextField').querySelector('input');
    await waitFor(() => expect(input).toHaveFocus());
    const inputFocusArgs = focusSpy.mock.calls.filter(
      (_args, index) => focusSpy.mock.contexts[index] === input,
    );
    expect(inputFocusArgs).toEqual([[{ preventScroll: true }]]);
  });

  test('renders nothing while closed', () => {
    renderPanel({ isOpen: false });

    expect(byDataSign('dialpadPanel')).toBeNull();
  });
});
