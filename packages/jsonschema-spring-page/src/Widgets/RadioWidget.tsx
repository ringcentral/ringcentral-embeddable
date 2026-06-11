import React, { FocusEvent } from 'react';
import {
  FormLabel,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
} from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  hideLabel,
  onChange,
  onBlur,
  onFocus,
  uiSchema = {},
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions) ?? null;
  const handleChange = (nextValue: unknown) => {
    onChange(enumOptionsValueForIndex<S>(String(nextValue), enumOptions, emptyValue));
  };
  const handleBlur = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  const handleFocus = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  if (uiSchema['ui:tab']) {
    return (
      <Tabs
        variant="standard"
        size="medium"
        value={selectedIndex === null ? false : String(selectedIndex)}
        onChange={(_: unknown, nextValue: unknown) => handleChange(nextValue)}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            return (
              <Tab
                key={index}
                label={option.label}
                value={String(index)}
                disabled={disabled || itemDisabled || readonly}
              />
            );
          })}
      </Tabs>
    );
  }
  return (
    <>
      {labelValue(<FormLabel htmlFor={id} required={required}>{label || undefined}</FormLabel>, hideLabel)}
      <RadioGroup
        id={id}
        name={id}
        value={selectedIndex === null ? undefined : String(selectedIndex)}
        row={!!options.inline}
        onChange={(event: any) => handleChange(event.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
        style={{ flexDirection: uiSchema['ui:itemDirection'] }}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const showValueLabel = typeof uiSchema['ui:valueLabel'] === 'undefined' ? true : uiSchema['ui:valueLabel'];
            return (
              <FormLabel
                key={index}
                label={showValueLabel ? option.label : undefined}
                value={String(index)}
                disabled={disabled || itemDisabled || readonly}
              >
                <Radio name={id} />
              </FormLabel>
            );
          })}
      </RadioGroup>
    </>
  );
}
