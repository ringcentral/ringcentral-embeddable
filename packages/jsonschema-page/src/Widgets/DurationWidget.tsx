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
  RcBox as Box,
  RcFormLabel as FormLabel,
  RcTextField as TextField,
  RcTypography as Typography,
  styled,
} from '@ringcentral/juno';

const StyledFormLabel = styled(FormLabel)`
  font-size: 0.75rem;
`;

const StyledUnitAdornment = styled(Typography)`
  padding-right: 8px;
`;

const DURATION_REGEX = /^P(?=\d|T\d)(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?)?$/i;

type DurationParts = {
  hours: string;
  minutes: string;
};

function isFilled(value: string) {
  return value.trim() !== '';
}

function normalizePart(value: string) {
  const trimmedValue = value.trim();
  if (!isFilled(trimmedValue)) {
    return null;
  }

  if (!/^\d+$/.test(trimmedValue)) {
    return null;
  }

  const parsed = Number.parseInt(trimmedValue, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseDurationValue(value?: string): DurationParts {
  if (!value) {
    return {
      hours: '',
      minutes: '',
    };
  }

  const match = value.match(DURATION_REGEX);
  if (!match) {
    return {
      hours: '',
      minutes: '',
    };
  }

  const [, days, hours, minutes] = match;
  const parsedDays = Number.parseInt(days ?? '0', 10);
  const parsedHours = Number.parseInt(hours ?? '0', 10);
  const parsedMinutes = Number.parseInt(minutes ?? '0', 10);
  const totalHours = parsedDays * 24 + parsedHours;
  const hasHourValue = days !== undefined || hours !== undefined;
  const hasMinuteValue = minutes !== undefined;

  return {
    hours: hasHourValue ? `${totalHours}` : '',
    minutes: hasMinuteValue ? `${parsedMinutes}` : '',
  };
}

function buildDurationValue(hoursValue: string, minutesValue: string) {
  const normalizedHours = normalizePart(hoursValue);
  const normalizedMinutes = normalizePart(minutesValue);
  const hasHours = normalizedHours !== null;
  const hasMinutes = normalizedMinutes !== null;

  if (!hasHours && !hasMinutes) {
    return undefined;
  }

  const totalMinutes = (normalizedHours ?? 0) * 60 + (normalizedMinutes ?? 0);
  const displayHours = Math.floor(totalMinutes / 60);
  const displayMinutes = totalMinutes % 60;

  const durationParts = [];
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
  F extends FormContextType = any
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

  const handleBlur = (nextHours: string, nextMinutes: string) => {
    onBlur(id, buildDurationValue(nextHours, nextMinutes));
  };

  const handleFocus = (nextHours: string, nextMinutes: string) => {
    onFocus(id, buildDurationValue(nextHours, nextMinutes));
  };

  return (
    <>
      {labelValue(
        <StyledFormLabel required={required} htmlFor={`${id}__hours`}>
          {label || undefined}
        </StyledFormLabel>,
        hideLabel
      )}
      <Box display="flex" flexDirection="row" gap={2} flexWrap="wrap">
        <TextField
          id={`${id}__hours`}
          name={`${id}__hours`}
          label={undefined}
          type="number"
          value={hours}
          placeholder="0"
          disabled={isDisabled}
          required={required}
          error={rawErrors.length > 0}
          onChange={({ target: { value: nextHours } }) => {
            emitChange(nextHours, minutes);
          }}
          onBlur={({ target: { value: nextHours } }) => {
            handleBlur(nextHours, minutes);
          }}
          onFocus={({ target: { value: nextHours } }) => {
            handleFocus(nextHours, minutes);
          }}
          inputProps={{
            min: 0,
            step: 1,
            'aria-label': hoursLabel,
          }}
          InputProps={{
            endAdornment: (
              <StyledUnitAdornment variant="caption1" color="neutral.f05">
                {hoursUnitLabel}
              </StyledUnitAdornment>
            ),
          }}
          aria-describedby={describedBy}
          clearBtn={false}
        />
        <TextField
          id={`${id}__minutes`}
          name={`${id}__minutes`}
          label={undefined}
          type="number"
          value={minutes}
          placeholder="0"
          disabled={isDisabled}
          required={required}
          clearBtn={false}
          error={rawErrors.length > 0}
          onChange={({ target: { value: nextMinutes } }) => {
            emitChange(hours, nextMinutes);
          }}
          onBlur={({ target: { value: nextMinutes } }) => {
            handleBlur(hours, nextMinutes);
          }}
          onFocus={({ target: { value: nextMinutes } }) => {
            handleFocus(hours, nextMinutes);
          }}
          inputProps={{
            min: 0,
            step: minuteStep,
            'aria-label': minutesLabel,
          }}
          InputProps={{
            endAdornment: (
              <StyledUnitAdornment variant="caption1" color="neutral.f05">
                {minutesUnitLabel}
              </StyledUnitAdornment>
            ),
          }}
          aria-describedby={describedBy}
        />
      </Box>
    </>
  );
}
