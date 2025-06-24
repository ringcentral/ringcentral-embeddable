import React, { ChangeEvent, FocusEvent, ReactNode } from 'react';
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

  const _onChange = (event: ChangeEvent<{ name?: string; value: unknown }>, child: React.ReactNode) => {
    const value = event.target.value as string;
    onChange(enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
  };
  const _onBlur = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
  };
  const _onFocus = (event: FocusEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, optEmptyVal));
  };
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
      renderValue={(index: unknown) => {
        console.log('index', index);
        if (typeof index === 'string' && enumOptions[Number.parseInt(index, 10)]) {
          return enumOptions[Number.parseInt(index, 10)].label;
        }
        if (Array.isArray(index)) {
          return index.map((i) => {
            if (typeof i === 'string' && enumOptions[Number.parseInt(i, 10)]) {
              return enumOptions[Number.parseInt(i, 10)].label;
            }
            return i;
          }).join(', ');
        }
        return index;
      }}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value, label, schema }, i: number) => {
          const disabled: boolean = Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1;
          return (
            <MenuItem key={i} value={String(i)} disabled={disabled}>
              <ListItemText
                primary={label}
                secondary={schema && schema.description}
                secondaryTypographyProps={{
                  title: schema && schema.description,
                }}
                primaryTypographyProps={{
                  title: label,
                }}
              />
            </MenuItem>
          );
        })}
    </Select>
  );
}
