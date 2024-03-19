import React, { ChangeEvent, FocusEvent } from 'react';
import {
  RcMenuItem as MenuItem,
  RcSelect as Select,
  RcTextFieldProps as TextFieldProps,
  RcListItemText as ListItemText,
} from '@ringcentral/juno';

import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  schema,
  id,
  name, // remove this from textFieldProps
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
  registry,
  uiSchema,
  hideError,
  formContext,
  ...textFieldProps
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;

  multiple = typeof multiple === 'undefined' ? false : !!multiple;

  const emptyValue = multiple ? [] : '';
  const isEmpty = typeof value === 'undefined' || (multiple && value.length < 1) || (!multiple && value === emptyValue);

  const _onChange = ({ target: { value } }: ChangeEvent<{ value: string }>) =>
    onChange(enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
  const selectedIndexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);

  return (
    <Select
      id={id}
      name={id}
      label={labelValue(label, hideLabel || !label, false)}
      value={!isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      placeholder={placeholder}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      {...(textFieldProps as TextFieldProps)}
      multiple={multiple}
      aria-describedby={ariaDescribedByIds<T>(id)}
      fullWidth
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value, label, schema }, i: number) => {
          const disabled: boolean = Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1;
          return (
            <MenuItem key={i} value={String(i)} disabled={disabled}>
              <ListItemText
                primary={label}
                secondary={schema && schema.description}
              />
            </MenuItem>
          );
        })}
    </Select>
  );
}
