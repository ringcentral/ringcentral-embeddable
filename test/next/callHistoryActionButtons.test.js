import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { useCallHistoryActionButtons } from '../../next/app/views/CallHistoryView/useCallHistoryActionButtons';

function ActionButtonsHost({
  actions,
  additionalActions,
  call,
  onAction,
  onAdditionalAction,
  onParentClick,
}) {
  const buttons = useCallHistoryActionButtons({
    actions,
    additionalActions,
    call,
    onAction,
    onAdditionalAction,
  });
  return (
    <div onClick={onParentClick}>
      {buttons.map(({ actionType, label, onClick, symbol }) => (
        <button
          data-symbol={symbol}
          key={actionType}
          onClick={onClick}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

describe('call-history action buttons', () => {
  test('maps every legacy call-action icon key to a Spring icon', () => {
    const expectedIcons = {
      addMember: 'InviteMd',
      aiNotes: 'SmartNotesMd',
      apps: 'AppsMd',
      calendar: 'CalendarMd',
      clock: 'CallListMd',
      download: 'DownloadMd',
      edit: 'EditMd',
      newAction: 'PlusMd',
      people: 'ContactsMd',
      phone: 'CallMd',
      read: 'MarkReadMd',
      refresh: 'RefreshMd',
      settings: 'SettingsMd',
      sms: 'Smsmd',
      unread: 'MarkUnreadMd',
      view: 'ViewMd',
      viewLog: 'ArrowRightUpMd',
    };
    render(
      <ActionButtonsHost
        actions={[]}
        additionalActions={Object.keys(expectedIcons).map((icon) => ({
          icon,
          id: icon,
          label: icon,
          type: 'callAction',
        }))}
        call={{ id: 'call-id' }}
        onAction={jest.fn()}
        onAdditionalAction={jest.fn()}
      />,
    );

    Object.entries(expectedIcons).forEach(([label, symbol]) => {
      expect(screen.getByText(label)).toHaveAttribute('data-symbol', symbol);
    });
  });

  test('keeps log actions around standard actions and appends custom actions', () => {
    render(
      <ActionButtonsHost
        actions={[
          { label: 'Edit log', type: 'createLog' },
          { type: 'call' },
          { label: 'View log details', type: 'viewLog' },
        ]}
        additionalActions={[
          {
            icon: 'refresh',
            id: 'reload-crm',
            label: 'Reload CRM',
            type: 'callAction',
          },
          {
            icon: 'unknown-icon',
            id: 'custom-fallback',
            label: 'Custom fallback',
            type: 'callAction',
          },
        ]}
        call={{ id: 'call-id' }}
        onAction={jest.fn()}
        onAdditionalAction={jest.fn()}
      />,
    );

    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual([
      'Edit log',
      'call',
      'View log details',
      'Reload CRM',
      'Custom fallback',
    ]);
    expect(screen.getByText('Edit log')).toHaveAttribute(
      'data-symbol',
      'EditMd',
    );
    expect(screen.getByText('Reload CRM')).toHaveAttribute(
      'data-symbol',
      'RefreshMd',
    );
    expect(screen.getByText('Custom fallback')).toHaveAttribute(
      'data-symbol',
      'AppsMd',
    );
  });

  test('forwards built-in and custom actions without opening the call item', () => {
    const call = { id: 'call-id', sessionId: 'session-id' };
    const onAction = jest.fn();
    const onAdditionalAction = jest.fn();
    const onParentClick = jest.fn();
    render(
      <ActionButtonsHost
        actions={[
          { label: 'Log call', type: 'createLog' },
          { label: 'View log details', type: 'viewLog' },
        ]}
        additionalActions={[
          {
            icon: 'apps',
            id: 'open-case',
            label: 'Open case',
            type: 'callAction',
          },
        ]}
        call={call}
        onAction={onAction}
        onAdditionalAction={onAdditionalAction}
        onParentClick={onParentClick}
      />,
    );

    fireEvent.click(screen.getByText('View log details'));
    fireEvent.click(screen.getByText('Open case'));

    expect(onAction).toHaveBeenCalledWith('viewLog');
    expect(onAdditionalAction).toHaveBeenCalledWith('open-case', call);
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
