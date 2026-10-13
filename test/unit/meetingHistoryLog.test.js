import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { MeetingItem } from '../../src/app/views/MeetingView/MeetingHistoryView/components/MeetingItem';
import { MeetingHistoryView } from '../../src/app/views/MeetingView/MeetingHistoryView/MeetingHistory.view';

jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  SearchInputToggle: () => null,
}));

jest.mock('../../src/app/services/ThirdParty', () => ({
  ThirdParty: class ThirdParty {},
}));

const meeting = {
  duration: 600,
  hostInfo: { displayName: 'Ada' },
  id: 'meeting-id',
  startTime: '2026-10-13T09:00:00Z',
  topic: 'Weekly sync',
};

function renderItem(props = {}) {
  const onClick = jest.fn();
  render(
    <MeetingItem
      formatDateTime={() => 'Oct 13, 09:00 AM'}
      meeting={meeting}
      onClick={onClick}
      t={(key) => key}
      {...props}
    />,
  );
  return { onClick };
}

function createView(thirdParty) {
  const view = Object.create(MeetingHistoryView.prototype);
  view._genericMeeting = { historyMeetings: [meeting], ready: true };
  view._locale = { currentLocale: 'en-US', ready: true };
  view._thirdParty = thirdParty;
  view.fetching = false;
  view.pageToken = null;
  view.searchText = '';
  return view;
}

describe('MeetingItem log action', () => {
  test('sends the meeting to the logger', () => {
    const onLog = jest.fn();
    renderItem({ logTitle: 'Log to TestService', onLog });

    fireEvent.click(screen.getByRole('button', { name: 'Log to TestService' }));

    expect(onLog).toHaveBeenCalledWith(meeting);
    expect(screen.getByTestId('meetingHistoryItem')).toHaveAttribute(
      'data-hoverable',
      'true',
    );
  });

  test('keeps play beside log for a recorded meeting', () => {
    const { onClick } = renderItem({
      logTitle: 'Log',
      meeting: { ...meeting, hasRecording: true },
      onLog: jest.fn(),
    });

    fireEvent.click(screen.getByRole('button', { name: 'play' }));

    expect(onClick).toHaveBeenCalledWith('meeting-id');
    expect(screen.getByRole('button', { name: 'Log' })).toBeInTheDocument();
  });

  test('has no hover actions without a recording or a logger', () => {
    renderItem();

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('meetingHistoryItem')).toHaveAttribute(
      'data-hoverable',
      'false',
    );
  });
});

describe('MeetingHistoryView meeting logger', () => {
  test('shows the log action with the registered logger title', () => {
    const view = createView({
      meetingLoggerRegistered: true,
      meetingLoggerTitle: 'Log to TestService',
    });

    expect(view.getUIProps()).toMatchObject({
      logTitle: 'Log to TestService',
      showLog: true,
    });
  });

  test('hides the log action without a registered logger', () => {
    expect(
      createView({
        meetingLoggerRegistered: false,
        meetingLoggerTitle: null,
      }).getUIProps(),
    ).toMatchObject({ logTitle: null, showLog: false });
    expect(createView(undefined).getUIProps()).toMatchObject({
      logTitle: null,
      showLog: false,
    });
  });

  test('sends the meeting to the third-party service', async () => {
    const thirdParty = {
      logMeeting: jest.fn(async () => undefined),
      meetingLoggerRegistered: true,
      meetingLoggerTitle: null,
    };
    const view = createView(thirdParty);

    await view.getUIFunctions().onLogMeeting(meeting);

    expect(thirdParty.logMeeting).toHaveBeenCalledWith(meeting);
  });
});
