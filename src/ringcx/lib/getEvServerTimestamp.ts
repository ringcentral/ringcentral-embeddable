import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const EV_SERVER_TIMEZONE = 'America/New_York';

/** Parse an offset-less EV server date-time as a timestamp in its source zone. */
export function getEvServerTimestamp(
  dateTime: string,
  timezoneName = EV_SERVER_TIMEZONE,
): number {
  return dayjs.tz(dateTime, timezoneName).valueOf();
}
