import React, { FocusEvent } from 'react';
import {
  MenuItemText,
  Option,
  Select,
  SelectProps,
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

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  name,
  options,
  label,
  hideLabel,
  required,
  disabled,
  readonly,
  placeholder,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
  ...textFieldProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
  const isMultiple = typeof multiple === 'undefined' ? false : !!multiple;
  const emptyValue = isMultiple ? [] : '';
  const isEmpty =
    typeof value === 'undefined' ||
    (isMultiple && value.length < 1) ||
    (!isMultiple && value === emptyValue);
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, isMultiple);
  const getLabel = (index: unknown) => {
    if (typeof index === 'string' && enumOptions?.[Number.parseInt(index, 10)]) {
      return enumOptions[Number.parseInt(index, 10)].label;
    }
    return String(index ?? '');
  };
  const handleBlur = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, optEmptyVal));
  const handleFocus = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, optEmptyVal));
  return (
    <Select
      variant="outlined"
      data-sign={name}
      id={id}
      name={id}
      label={labelValue(label, hideLabel || !label, false)}
      value={!isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue}
      required={required}
      disabled={disabled || readonly}
      focused={autofocus}
      placeholder={placeholder}
      error={rawErrors.length > 0}
      onChange={({ target: { value: nextValue } }: any) => {
        onChange(enumOptionsValueForIndex<S>(nextValue, enumOptions, optEmptyVal));
      }}
      renderValue={(index: unknown) => {
        if (Array.isArray(index)) {
          return index.map(getLabel).join(', ');
        }
        return getLabel(index);
      }}
      onBlur={handleBlur}
      onFocus={handleFocus}
      size="large"
      selectMode={isMultiple ? 'multiple' : 'single'}
      {...(textFieldProps as SelectProps)}
      aria-describedby={ariaDescribedByIds<T>(id)}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: optionValue, label: optionLabel, schema }, index: number) => {
          const isDisabled: boolean = Array.isArray(enumDisabled) && enumDisabled.indexOf(optionValue) !== -1;
          return (
            <Option key={index} value={String(index)} disabled={isDisabled}>
              <MenuItemText primary={optionLabel} info={schema && schema.description} />
            </Option>
          );
        })}
    </Select>
  );
}
