import getMeetingDate from '../../src/components/UpcomingMeetingList/getMeetingDate';

describe('getMeetingDate', () => {
  it('interprets a timestamp without an offset as UTC when its timezone is UTC', () => {
    const date = getMeetingDate('2026-08-07T10:00:00.0000000', 'UTC');
    expect(date.toISOString()).toBe('2026-08-07T10:00:00.000Z');
  });

  it('preserves an explicit timezone offset', () => {
    const date = getMeetingDate('2026-08-07T10:00:00+08:00', 'UTC');
    expect(date.toISOString()).toBe('2026-08-07T02:00:00.000Z');
  });

  it('preserves existing behavior when the source timezone is unavailable', () => {
    const date = getMeetingDate('2026-08-07T10:00:00');
    expect(date.getHours()).toBe(10);
  });
});
