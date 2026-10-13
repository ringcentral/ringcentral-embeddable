import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  AppsMd,
  CalendarMd,
  CallMd,
  ClockMd,
} from '@ringcentral/spring-icon';

import { ContactActivities } from '../../src/app/views/ContactDetailsView/ContactActivities';
import { PhoneActionButtons } from '../../src/app/views/ContactDetailsView/PhoneActionButtons';
import { toAdditionalPhoneActions } from '../../src/app/views/ContactDetailsView/toAdditionalPhoneActions';

function createAction(id) {
  return {
    id,
    title: `title-${id}`,
    symbol: AppsMd,
    disabled: false,
    onClick: jest.fn(),
  };
}

describe('toAdditionalPhoneActions', () => {
  test('maps the 3.x icon names and falls back to the apps icon', () => {
    const onClick = jest.fn();
    const actions = toAdditionalPhoneActions({
      actions: [
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'history', label: 'History', icon: 'clock' },
        { id: 'dial', icon: 'call' },
        { id: 'custom', label: 'Custom', icon: 'https://host/icon.png' },
      ],
      disabled: true,
      onClick,
    });

    expect(actions.map(({ id, title, symbol, disabled }) => ({
      id,
      title,
      symbol,
      disabled,
    }))).toEqual([
      { id: 'schedule', title: 'Schedule', symbol: CalendarMd, disabled: true },
      { id: 'history', title: 'History', symbol: ClockMd, disabled: true },
      { id: 'dial', title: 'dial', symbol: CallMd, disabled: true },
      { id: 'custom', title: 'Custom', symbol: AppsMd, disabled: true },
    ]);
    actions[1].onClick();
    expect(onClick).toHaveBeenCalledWith('history');
  });
});

describe('PhoneActionButtons', () => {
  test('shows up to three actions inline', () => {
    const actions = ['call', 'text', 'schedule'].map(createAction);
    render(<PhoneActionButtons actions={actions} moreTitle="More" />);

    fireEvent.click(document.querySelector('[data-sign="phoneAction-schedule"]'));

    expect(actions[2].onClick).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-sign="phoneActionMore"]')).toBeNull();
  });

  test('moves the rest into a menu when there are more than three', () => {
    const actions = ['call', 'text', 'schedule', 'history'].map(createAction);
    render(<PhoneActionButtons actions={actions} moreTitle="More" />);

    expect(
      document.querySelector('button[data-sign="phoneAction-schedule"]'),
    ).toBeNull();
    fireEvent.click(document.querySelector('[data-sign="phoneActionMore"]'));
    fireEvent.click(screen.getByText('title-history'));

    expect(actions[3].onClick).toHaveBeenCalledTimes(1);
  });

  test('renders nothing without actions', () => {
    const { container } = render(
      <PhoneActionButtons actions={[]} moreTitle="More" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ContactActivities', () => {
  function renderActivities(props) {
    const handlers = {
      loadActivities: jest.fn(),
      openActivity: jest.fn(),
      formatTime: jest.fn(() => 'formatted-time'),
    };
    render(
      <ContactActivities
        activities={[]}
        loaded
        {...handlers}
        {...props}
      />,
    );
    return handlers;
  }

  test('loads the activities when the tab opens and shows a spinner', () => {
    const { loadActivities } = renderActivities({ loaded: false });

    expect(loadActivities).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector('[data-sign="activitiesLoading"]'),
    ).not.toBeNull();
  });

  test('shows an empty state when the service returns none', () => {
    renderActivities({ activities: [] });

    expect(screen.getByText('noActivities')).toBeInTheDocument();
  });

  test('lists the activities and opens one on click', () => {
    const activity = { id: '1', subject: 'Follow-up call', time: 1760000000000 };
    const { openActivity, formatTime } = renderActivities({
      activities: [activity, { id: '2', subject: 'No time' }],
    });

    expect(screen.getByText('formatted-time')).toBeInTheDocument();
    expect(formatTime).toHaveBeenCalledWith(1760000000000);
    fireEvent.click(screen.getByText('Follow-up call'));

    expect(openActivity).toHaveBeenCalledWith(activity);
  });
});
