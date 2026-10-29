import React from 'react';
import { configure, fireEvent, render, screen } from '@testing-library/react';

// Elements are found by their data-sign.
configure({ testIdAttribute: 'data-sign' });

jest.mock('@ringcentral/spring-ui', () => {
  const ReactActual = jest.requireActual('react');
  return {
    ...jest.requireActual('../mocks/springUiMock'),
    Checkbox: ({ checked, disabled, inputProps, onChange }) =>
      ReactActual.createElement('input', {
        type: 'checkbox',
        checked,
        disabled,
        onChange,
        ...inputProps,
      }),
    Drawer: ({ open, children, bodyProps }) =>
      open ? ReactActual.createElement('div', bodyProps, children) : null,
  };
});

jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  SingleFilter: () => null,
}));

jest.mock('../../src/app/views/TeamMessagingView/components/ChatAvatar', () => ({
  PersonAvatar: () => null,
}));

jest.mock('../../src/app/views/TeamMessagingView/components/PostMarkdown', () => ({
  PostMarkdown: ({ text }) => text,
}));

const {
  TasksDrawer,
} = require('../../src/app/views/TeamMessagingView/components/tasks/TasksDrawer');
const {
  HeaderMoreMenu,
} = require('../../src/app/views/TeamMessagingView/components/HeaderMoreMenu');

function renderTask(overrides = {}) {
  const taskActions = {
    getTask: jest.fn(),
    getMembers: jest.fn(() => []),
    toggleTask: jest.fn(),
    openTask: jest.fn(),
  };
  render(
    React.createElement(TasksDrawer, {
      open: true,
      container: () => null,
      onClose: jest.fn(),
      filter: 'Open',
      onFilterChange: jest.fn(),
      tasks: [],
      isLoading: false,
      isTaskMissing: false,
      taskActions,
      formatTime: () => '10/31/2026',
      getMemberName: () => '',
      onOpenTask: jest.fn(),
      task: {
        id: 'task-1',
        subject: 'Ship it',
        status: 'Pending',
        completenessCondition: 'Simple',
        ...overrides,
      },
    }),
  );
  return { taskActions, checkbox: screen.getByTestId('toggleTaskCheckbox') };
}

describe('Task details', () => {
  test('completes a pending task with its checkbox', () => {
    const { taskActions, checkbox } = renderTask();

    expect(checkbox.checked).toBe(false);
    expect(screen.queryByRole('button', { name: /complete/i })).toBeNull();

    fireEvent.click(checkbox);

    expect(taskActions.toggleTask).toHaveBeenCalledWith('task-1', true);
  });

  test('reopens a completed task, whose name is struck through', () => {
    const { taskActions, checkbox } = renderTask({ status: 'Completed' });

    expect(checkbox.checked).toBe(true);
    expect(screen.getByText('Ship it').className).toContain('line-through');

    fireEvent.click(checkbox);

    expect(taskActions.toggleTask).toHaveBeenCalledWith('task-1', false);
  });

  test('cannot complete a percentage task', () => {
    const { checkbox } = renderTask({
      completenessCondition: 'Percentage',
      completenessPercentage: 50,
    });

    expect(checkbox.disabled).toBe(true);
  });
});

describe('HeaderMoreMenu', () => {
  test('runs an action and closes the menu', () => {
    const onEdit = jest.fn();
    render(
      React.createElement(HeaderMoreMenu, {
        dataSign: 'drawerHeader',
        actions: [
          { key: 'edit', symbol: 'EditMd', label: 'Edit', onClick: onEdit },
          { key: 'delete', symbol: 'TrashMd', label: 'Delete', onClick: jest.fn() },
        ],
      }),
    );

    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByTestId('drawerHeaderMoreButton'));
    expect(
      screen.getAllByRole('menuitem').map((item) => item.dataset.sign),
    ).toEqual(['drawerHeaderMenu-edit', 'drawerHeaderMenu-delete']);

    fireEvent.click(screen.getByTestId('drawerHeaderMenu-edit'));

    expect(onEdit).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
