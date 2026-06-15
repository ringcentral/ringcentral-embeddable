import React from 'react';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  FormLabel,
  Text,
  TextField,
} from '@ringcentral/spring-ui';

const DURATION_REGEX = /^P(?=\d|T\d)(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?)?$/i;

type DurationParts = {
  hours: string;
  minutes: string;
};

function isFilled(value: string): boolean {
  return value.trim() !== '';
}

function normalizePart(value: string): number | null {
  const trimmedValue = value.trim();
  if (!isFilled(trimmedValue) || !/^\d+$/.test(trimmedValue)) {
    return null;
  }
  const parsedValue = Number.parseInt(trimmedValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }
  return parsedValue;
}

function parseDurationValue(value?: string): DurationParts {
  if (!value) {
    return { hours: '', minutes: '' };
  }
  const match = value.match(DURATION_REGEX);
  if (!match) {
    return { hours: '', minutes: '' };
  }
  const [, days, hours, minutes] = match;
  const parsedDays = Number.parseInt(days ?? '0', 10);
  const parsedHours = Number.parseInt(hours ?? '0', 10);
  const parsedMinutes = Number.parseInt(minutes ?? '0', 10);
  const totalHours = parsedDays * 24 + parsedHours;
  return {
    hours: days !== undefined || hours !== undefined ? `${totalHours}` : '',
    minutes: minutes !== undefined ? `${parsedMinutes}` : '',
  };
}

function buildDurationValue(hoursValue: string, minutesValue: string): string | undefined {
  const normalizedHours = normalizePart(hoursValue);
  const normalizedMinutes = normalizePart(minutesValue);
  if (normalizedHours === null && normalizedMinutes === null) {
    return undefined;
  }
  const totalMinutes = (normalizedHours ?? 0) * 60 + (normalizedMinutes ?? 0);
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;
  const durationParts: string[] = [];
  if (displayHours > 0) {
    durationParts.push(`${displayHours}H`);
  }
  if (displayMinutes > 0 || durationParts.length === 0) {
    durationParts.push(`${displayMinutes}M`);
  }
  return `PT${durationParts.join('')}`;
}

export default function DurationWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    label,
    hideLabel,
    required,
    disabled,
    readonly,
    value,
    onChange,
    onBlur,
    onFocus,
    options,
    rawErrors = [],
  } = props;
  const { hours, minutes } = parseDurationValue(typeof value === 'string' ? value : undefined);
  const minuteStep = Math.max(Number.parseInt(String(options?.minuteStep ?? 1), 10) || 1, 1);
  const hoursLabel = typeof options?.hoursLabel === 'string' ? options.hoursLabel : 'Hours';
  const minutesLabel = typeof options?.minutesLabel === 'string' ? options.minutesLabel : 'Minutes';
  const hoursUnitLabel = typeof options?.hoursUnitLabel === 'string' ? options.hoursUnitLabel : 'hour';
  const minutesUnitLabel = typeof options?.minutesUnitLabel === 'string' ? options.minutesUnitLabel : 'min';
  const isDisabled = disabled || readonly;
  const describedBy = ariaDescribedByIds<T>(id);
  const emitChange = (nextHours: string, nextMinutes: string) => {
    onChange(buildDurationValue(nextHours, nextMinutes));
  };
  const emitBlur = (nextHours: string, nextMinutes: string) => {
    onBlur(id, buildDurationValue(nextHours, nextMinutes));
  };
  const emitFocus = (nextHours: string, nextMinutes: string) => {
    onFocus(id, buildDurationValue(nextHours, nextMinutes));
  };
  return (
    <>
      {labelValue(
        <FormLabel htmlFor={`${id}__hours`} label={label || undefined} />,
        hideLabel,
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ flex: '1 1 140px', minWidth: 0 }}>
          <TextField
            id={`${id}__hours`}
            type="number"
            size="large"
            value={hours}
            placeholder="0"
            fullWidth
            disabled={isDisabled}
            required={required}
            error={rawErrors.length > 0}
            onChange={({ target: { value: nextHours } }) => emitChange(nextHours, minutes)}
            onBlur={({ target: { value: nextHours } }) => emitBlur(nextHours, minutes)}
            onFocus={({ target: { value: nextHours } }) => emitFocus(nextHours, minutes)}
            inputProps={{ min: 0, step: 1, 'aria-label': hoursLabel }}
            endAdornment={<Text className="typography-descriptor">{hoursUnitLabel}</Text>}
            aria-describedby={describedBy}
            clearBtn={false}
          />
        </span>
        <span style={{ flex: '1 1 140px', minWidth: 0 }}>
          <TextField
            id={`${id}__minutes`}
            type="number"
            size="large"
            value={minutes}
            placeholder="0"
            fullWidth
            disabled={isDisabled}
            required={required}
            clearBtn={false}
            error={rawErrors.length > 0}
            onChange={({ target: { value: nextMinutes } }) => emitChange(hours, nextMinutes)}
            onBlur={({ target: { value: nextMinutes } }) => emitBlur(hours, nextMinutes)}
            onFocus={({ target: { value: nextMinutes } }) => emitFocus(hours, nextMinutes)}
            inputProps={{ min: 0, step: minuteStep, 'aria-label': minutesLabel }}
            endAdornment={<Text className="typography-descriptor">{minutesUnitLabel}</Text>}
            aria-describedby={describedBy}
          />
        </span>
      </div>
    </>
  );
}
