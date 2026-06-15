import { DatePicker, TimePicker } from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import React from 'react';

function parseDateTimeValue(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTimeValue(value: Date | null): string | undefined {
  return value ? value.toJSON() : undefined;
}

function mergeDateValue(currentValue: Date | null, nextDate: Date | null): Date | null {
  if (!nextDate) {
    return null;
  }
  const nextValue = currentValue ? new Date(currentValue) : new Date(nextDate);
  nextValue.setFullYear(
    nextDate.getFullYear(),
    nextDate.getMonth(),
    nextDate.getDate(),
  );
  return nextValue;
}

function mergeTimeValue(currentValue: Date | null, nextTime: Date | null): Date | null {
  if (!nextTime) {
    return null;
  }
  const nextValue = currentValue ? new Date(currentValue) : new Date();
  nextValue.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
  return nextValue;
}

function getStringOption(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    hideLabel,
    id,
    label,
    name,
    onBlur,
    onChange,
    onFocus,
    options,
    placeholder,
    rawErrors = [],
    readonly,
    required,
    value,
  } = props;
  const dateTimeValue = parseDateTimeValue(value);
  const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
  const isDisabled = disabled || readonly;
  const currentValue = formatDateTimeValue(dateTimeValue);
  const describedBy = ariaDescribedByIds<T>(id);
  const timeLabel = getStringOption(options?.timeLabel, 'Time');
  return (
    <div style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ flex: '1 1 160px', minWidth: 0 }}>
        <DatePicker
          data-sign={name}
          id={`${id}__date`}
          label={labelValue(label, hideLabel || !label, false)}
          value={dateTimeValue}
          placeholder={placeholder}
          variant="outlined"
          size="large"
          fullWidth
          autoFocus={autofocus}
          required={required}
          disabled={isDisabled}
          error={Boolean(errorMessage)}
          helperText={errorMessage}
          onChange={(nextDate) => {
            onChange(formatDateTimeValue(mergeDateValue(dateTimeValue, nextDate)));
          }}
          onBlur={() => onBlur(id, currentValue)}
          onFocus={() => onFocus(id, currentValue)}
          inputProps={{ 'aria-describedby': describedBy }}
        />
      </span>
      <span style={{ flex: '1 1 160px', minWidth: 0 }}>
        <TimePicker
          data-sign={`${name}-time`}
          id={`${id}__time`}
          label={undefined}
          value={dateTimeValue}
          dateMode
          variant="outlined"
          size="large"
          fullWidth
          required={required}
          disabled={isDisabled}
          error={Boolean(errorMessage)}
          onChange={(nextTime) => {
            onChange(formatDateTimeValue(mergeTimeValue(dateTimeValue, nextTime)));
          }}
          onBlur={() => onBlur(id, currentValue)}
          onFocus={() => onFocus(id, currentValue)}
          inputProps={{
            'aria-describedby': describedBy,
            'aria-label': timeLabel,
          }}
        />
      </span>
    </div>
  );
}
