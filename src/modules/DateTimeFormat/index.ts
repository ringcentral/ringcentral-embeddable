import { DateTimeFormat as DateTimeFormatBase } from '@ringcentral-integration/commons/modules/DateTimeFormat';
import { Module } from '@ringcentral-integration/commons/lib/di';
import getIntlDateTimeFormatter, {
  DEFAULT_DATE_TIME_OPTIONS,
  DEFAULT_TIME_OPTIONS,
  DEFAULT_DATE_OPTIONS,
} from '@ringcentral-integration/commons/lib/getIntlDateTimeFormatter';

// detect if enable 24-hour format (cross-browser)
function isUserLocale24Hour() {
  try {
    const { hour12 } = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions();
    if (typeof hour12 === 'boolean') {
      return hour12 === false;
    }
  } catch (e) {
    // ignore and use fallback
  }
  try {
    const formatted = new Intl.DateTimeFormat(navigator.language, { hour: 'numeric' }).format(new Date());
    return !/\s?(AM|PM)/i.test(formatted);
  } catch (e) {
    // ignore and use fallback
  }
  return true;
}

@Module({
  name: 'NewDateTimeFormat',
  deps: []
})
export class DateTimeFormat extends DateTimeFormatBase {
  private _defaultFormatter: any;
  constructor(deps) {
    super(deps);
    const hour12 = !isUserLocale24Hour();
    this._defaultFormatter = getIntlDateTimeFormatter({
      dateTimeOptions: {
        ...DEFAULT_DATE_TIME_OPTIONS,
        hour12,
      },
      dateOptions: DEFAULT_DATE_OPTIONS,
      timeOptions: {
        ...DEFAULT_TIME_OPTIONS,
        hour12,
      },
    });
  }
}