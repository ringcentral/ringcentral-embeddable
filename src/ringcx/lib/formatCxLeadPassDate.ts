import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

/** RingCX servers report SQL date-times in this zone, as Agent One assumes. */
const SERVER_TIMEZONE = 'America/New_York';

const SQL_DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

interface FormatCxLeadPassDateOptions {
  locale?: string;
  /** For tests; the browser's zone otherwise. */
  timeZone?: string;
}

/**
 * A lead history pass date, `YYYY-MM-DD HH:mm:ss` in server time, as a medium
 * date and short time in the agent's zone and locale. Agent One shows the
 * same (`helpers/timeUtils.ts` `formatPassDate`). A value that does not parse
 * is returned as is.
 */
export function formatCxLeadPassDate(
  passDts: string,
  { locale, timeZone }: FormatCxLeadPassDateOptions = {},
): string {
  if (!dayjs(passDts, SQL_DATE_TIME_FORMAT, true).isValid()) {
    return passDts;
  }
  const date = dayjs.tz(passDts, SQL_DATE_TIME_FORMAT, SERVER_TIMEZONE).toDate();
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(date);
  } catch {
    return passDts;
  }
}
