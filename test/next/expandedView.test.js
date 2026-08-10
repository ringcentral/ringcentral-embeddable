import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ExpandedView } from '../../next/app/views/ExpandedView/Expanded.view';

jest.mock(
  '@ringcentral-integration/micro-core/src/app/components',
  () => ({
    ExpandedLayoutPopper: ({ children, expanded }) => (
      <div data-sign="expandedLayout" data-expanded={expanded}>
        {children}
      </div>
    ),
  }),
);

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: ({ children, onBackClick }) => (
    <header>
      {onBackClick && <button onClick={onBackClick}>Back</button>}
      {children}
    </header>
  ),
}));

function createRoot() {
  return {
    expanded: false,
    setExpanded: jest.fn(function setExpanded(expanded) {
      this.expanded = expanded;
    }),
  };
}

function createExpandedComponent(view) {
  return function ExpandedViewComponent() {
    return view.component();
  };
}

describe('ExpandedView', () => {
  test('opens as an overlay with a back button without expanding the layout', () => {
    const root = createRoot();
    const view = new ExpandedView(root);
    const handle = view.create({
      id: 'overlay',
      view: () => <div>Overlay content</div>,
    });

    view.open(handle, { expand: false });
    const Component = createExpandedComponent(view);
    render(<Component />);

    expect(root.setExpanded).not.toHaveBeenCalled();
    expect(screen.getByTestId('expandedLayout')).toHaveAttribute(
      'data-expanded',
      'false',
    );
    expect(screen.getByText('Overlay content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(view.isOpen).toBe(false);
  });

  test('preserves an already expanded side panel when expansion is optional', () => {
    const root = createRoot();
    root.expanded = true;
    const view = new ExpandedView(root);
    const handle = view.create({ id: 'side-panel', view: () => null });

    view.open(handle, { expand: false });

    expect(root.expanded).toBe(true);
    expect(root.setExpanded).not.toHaveBeenCalled();
  });

  test('releases active content without collapsing the expanded layout', () => {
    const root = createRoot();
    root.expanded = true;
    const view = new ExpandedView(root);
    const onClose = jest.fn();
    const handle = view.create({
      id: 'side-widget',
      onClose,
      view: () => null,
    });
    view.open(handle, { expand: false });

    view.close(undefined, { collapseLayout: false });

    expect(view.isOpen).toBe(false);
    expect(root.expanded).toBe(true);
    expect(root.setExpanded).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('allows embedded content to own the compact overlay header', () => {
    const root = createRoot();
    const view = new ExpandedView(root);
    const handle = view.create({
      id: 'self-headed-overlay',
      showOverlayHeader: false,
      view: () => <div>Self-headed content</div>,
    });

    view.open(handle, { expand: false });
    const Component = createExpandedComponent(view);
    render(<Component />);

    expect(screen.getByText('Self-headed content')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(document.querySelector('header')).toBeNull();
  });

  test('switches between registered content while already expanded', () => {
    const root = createRoot();
    const view = new ExpandedView(root);
    const firstOnDeactivate = jest.fn();
    const first = view.create({
      id: 'first',
      view: () => <div>First content</div>,
      onDeactivate: firstOnDeactivate,
    });
    const second = view.create({
      id: 'second',
      view: () => <div>Second content</div>,
    });

    view.open(first);
    const Component = createExpandedComponent(view);
    const rendered = render(<Component />);
    expect(screen.getByText('First content')).toBeInTheDocument();

    view.open(second);
    rendered.rerender(<Component />);

    expect(screen.queryByText('First content')).toBeNull();
    expect(screen.getByText('Second content')).toBeInTheDocument();
    expect(firstOnDeactivate).toHaveBeenCalledTimes(1);
    expect(view.activeContentId).toBe('second');
    expect(root.expanded).toBe(true);
  });

  test('ignores a stale close result and closes the active content', () => {
    const root = createRoot();
    const view = new ExpandedView(root);
    const firstOnClose = jest.fn();
    const secondOnClose = jest.fn();
    const first = view.create({
      id: 'first',
      view: () => null,
      onClose: firstOnClose,
    });
    const second = view.create({
      id: 'second',
      view: () => null,
      onClose: secondOnClose,
    });

    const firstOpenResult = view.open(first);
    const secondOpenResult = view.open(second);
    firstOpenResult.close();

    expect(view.activeContentId).toBe('second');
    expect(root.expanded).toBe(true);
    expect(firstOnClose).not.toHaveBeenCalled();

    secondOpenResult.close();
    expect(view.activeContentId).toBeNull();
    expect(view.isOpen).toBe(false);
    expect(root.expanded).toBe(false);
    expect(secondOnClose).toHaveBeenCalledTimes(1);
  });

  test('resolves synchronized content ids through each client registry', () => {
    const root = createRoot();
    const view = new ExpandedView(root);
    view.create({
      id: 'side-widget',
      view: () => <div>Local side widget</div>,
    });

    view.activeContentId = 'side-widget';
    view.isOpen = true;
    root.expanded = true;
    const Component = createExpandedComponent(view);
    render(<Component />);

    expect(screen.getByText('Local side widget')).toBeInTheDocument();
    expect(screen.getByTestId('expandedLayout')).toHaveAttribute(
      'data-expanded',
      'true',
    );
  });

  test('rejects duplicate content ids without replacing the registered handle', () => {
    const root = createRoot();
    const view = new ExpandedView(root);
    const first = view.create({
      id: 'side-widget',
      view: () => null,
    });

    expect(() =>
      view.create({
        id: 'side-widget',
        view: () => null,
      }),
    ).toThrow('Expanded content id is already registered');
    expect(() => view.open(first)).not.toThrow();
  });
});
