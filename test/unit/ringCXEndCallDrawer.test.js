// Ending a RingCX call with more than one party: a bottom drawer on the call
// page with one button per way to end it. It overlays the call page only, so
// with the app expanded the side column stays usable.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

// Like the Spring UI Drawer (a Modal on a Portal), the drawer goes to
// `document.body` unless asked to render in place, and `bodyProps` lands on
// its dialog element.
jest.mock('@ringcentral/spring-ui', () => {
  const { createPortal } = jest.requireActual('react-dom');
  return {
    ...jest.requireActual('@ringcentral/spring-ui'),
    Drawer: ({
      open,
      disablePortal,
      bodyProps,
      children,
      'data-sign': dataSign,
    }) => {
      if (!open) {
        return null;
      }
      const drawer = (
        <div data-sign={dataSign}>
          <div role="dialog" {...bodyProps}>
            {children}
          </div>
        </div>
      );
      return disablePortal
        ? drawer
        : createPortal(drawer, globalThis.document.body);
    },
    Button: ({ children, variant, color, onClick, 'data-sign': dataSign }) => (
      <button
        type="button"
        data-variant={variant}
        data-color={color}
        data-sign={dataSign}
        onClick={onClick}
      >
        {children}
      </button>
    ),
  };
});

import { EndCallDrawer } from '../../src/ringcx/components/EndCallDrawer/EndCallDrawer';

const OPTIONS = [
  { id: 'justMe', label: 'Leave call', appearance: 'primary' },
  { id: 'everyone', label: 'End call for everyone', appearance: 'danger' },
  {
    id: 'cancelTransfer:leg-3',
    label: 'Cancel transfer',
    description: '(650) 844-6685',
    appearance: 'neutral',
  },
];

const byDataSign = (dataSign) =>
  document.querySelector(`[data-sign="${dataSign}"]`);

function renderDrawer(props = {}) {
  const onClose = jest.fn();
  const onConfirm = jest.fn();
  render(
    <div data-sign="callPage">
      <EndCallDrawer
        open
        options={OPTIONS}
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />
    </div>,
  );
  return { onClose, onConfirm };
}

describe('EndCallDrawer', () => {
  test('opens inside the page that hosts it', () => {
    renderDrawer();

    const drawer = byDataSign('endCallDrawer');
    expect(drawer).not.toBeNull();
    expect(byDataSign('callPage')).toContainElement(drawer);
  });

  test('names the dialog for screen readers without a visible title', () => {
    renderDrawer();

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'endCall');
    expect(screen.queryByText('endCall')).toBeNull();
  });

  test('offers one button per option, in the given order', () => {
    renderDrawer();

    const optionButtons = Array.from(
      document.querySelectorAll('[data-sign^="endCallOption-"]'),
    );
    expect(optionButtons.map((button) => button.textContent)).toEqual([
      'Leave call',
      'End call for everyone',
      'Cancel transfer (650) 844-6685',
    ]);
  });

  test.each([
    ['primary', 'contained', 'danger', 'justMe'],
    ['danger', 'outlined', 'danger', 'everyone'],
    ['neutral', 'outlined', 'neutral', 'cancelTransfer:leg-3'],
  ])('shows a %s option as a %s %s button', (_appearance, variant, color, id) => {
    renderDrawer();

    const button = byDataSign(`endCallOption-${id}`);
    expect(button).toHaveAttribute('data-variant', variant);
    expect(button).toHaveAttribute('data-color', color);
  });

  test('ends the call the way of the option clicked', () => {
    const { onConfirm, onClose } = renderDrawer();

    fireEvent.click(byDataSign('endCallOption-cancelTransfer:leg-3'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('cancelTransfer:leg-3');
    expect(onClose).not.toHaveBeenCalled();
  });

  test('closes without ending the call on Cancel', () => {
    const { onConfirm, onClose } = renderDrawer();

    fireEvent.click(byDataSign('endCallCancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('renders nothing while closed', () => {
    renderDrawer({ open: false });

    expect(byDataSign('endCallDrawer')).toBeNull();
  });
});
