import React, { FocusEvent } from 'react';
import { Slider } from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  rangeSpec,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

function getFormFieldLabelClassName(hasError: boolean): string {
  const classNames = [
    'sui-form-field-label',
    'sui-form-field-outlined-label',
  ];
  if (hasError) {
    classNames.push('sui-form-field-error-label');
  }
  return classNames.join(' ');
}

function getNumberOption(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const numberValue = Number.parseFloat(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getFocusValue(event: FocusEvent<HTMLSpanElement>): number | undefined {
  const target = event.target as HTMLInputElement;
  const value = Number.parseFloat(target.value);
  return Number.isFinite(value) ? value : undefined;
}

export default function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    disabled,
    hideLabel,
    id,
    label,
    name,
    onBlur,
    onChange,
    onFocus,
    options,
    rawErrors = [],
    readonly,
    required,
    schema,
    value,
  } = props;
  const rangeOptions = rangeSpec<S>(schema);
  const fieldLabel = labelValue(label, hideLabel || !label, false);
  const labelId = `${id}__label`;
  const hasError = rawErrors.length > 0;
  const step = getNumberOption(options?.step) ?? rangeOptions.step;
  const handleChange = (_event: Event, nextValue: number) => {
    onChange(nextValue ?? options.emptyValue);
  };
  const handleBlur = (event: FocusEvent<HTMLSpanElement>) => {
    onBlur(id, getFocusValue(event));
  };
  const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
    onFocus(id, getFocusValue(event));
  };
  return (
    <>
      {fieldLabel ? (
        <label
          id={labelId}
          className={getFormFieldLabelClassName(hasError)}
          htmlFor={id}
        >
          {fieldLabel}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <Slider<number>
        aria-describedby={ariaDescribedByIds<T>(id)}
        aria-label={fieldLabel ? undefined : label || id}
        aria-labelledby={fieldLabel ? labelId : undefined}
        data-sign={name}
        disabled={disabled || readonly}
        id={id}
        max={rangeOptions.max}
        min={rangeOptions.min}
        name={id}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        showColorAtRest
        step={step}
        value={value as number | undefined}
        valueLabelDisplay="auto"
      />
    </>
  );
}
