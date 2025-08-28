import React, { useState, useEffect, useRef } from 'react';
import {
  RcDownshift,
  RcMenuItem as MenuItem,
  RcListItemText as ListItemText,
} from '@ringcentral/juno';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function AutocompleteWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  label,
  hideLabel,
  placeholder,
  required,
  disabled,
  readonly,
  value,
  options,
  onChange,
  rawErrors = [],
}: WidgetProps<T, S, F>) {
  const [downshiftValue, setDownshiftValue] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const downshiftUpdated = useRef(false);
  const { enumOptions = [] } = options;

  const dsOptions = Array.isArray(enumOptions)
    ? enumOptions.map((opt: any) => ({
        id: opt.value,
        label: opt.label,
        value: opt.value,
        schema: opt.schema,
      }))
    : [];

  useEffect(() => {
    const item = enumOptions.find(s => s.value === value);
    if (item) {
      setDownshiftValue([{
        id: item.value,
        label: item.label,
        value: item.value,
        schema: item.schema,
      }]);
      setInputValue('');
    } else {
      setInputValue(value);
    }
  }, [value, enumOptions]);

  return (
    <RcDownshift
      id={id}
      name={id}
      label={labelValue(label, hideLabel || !label, false)}
      placeholder={placeholder}
      disabled={disabled || readonly}
      required={required}
      multiple={false}
      toggleButton={dsOptions.length > 0}
      options={dsOptions.filter((opt: any) => {
        if (!inputValue) {
          return true;
        }
        if (
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          opt.value.toLowerCase().includes(inputValue.toLowerCase())
        ) {
          return true;
        }
        return false;
      })}
      value={downshiftValue}
      inputValue={inputValue}
      fullWidth
      error={rawErrors.length > 0}
      onInputChange={(val: string) => {
        setInputValue(val);
        if (!downshiftUpdated.current) {
          onChange(val);
        }
        downshiftUpdated.current = false;
      }}
      onChange={(newItems) => {
        downshiftUpdated.current = true;
        setDownshiftValue(newItems);
        if (newItems.length > 0) {
          onChange(newItems[0].value);
        } else {
          onChange('');
        }
      }}
      onBlur={() => {
        if (downshiftValue.length > 0) {
          onChange(downshiftValue[0].value);
        } else {
          onChange(inputValue);
        }
      }}
      renderOption={(item: any, state: any) => (
        <MenuItem
          id={item.value}
          key={`${item.id}-${state.index}`}
          focused={state.highlighted}
          onClick={item.onClick}
        >
          <ListItemText
            primary={item.label}
            secondary={item.value}
          />
        </MenuItem>
      )}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}


