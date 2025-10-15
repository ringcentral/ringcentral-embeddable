import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  multiple,
}: WidgetProps<T, S, F>) {
  const [downshiftValue, setDownshiftValue] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const downshiftUpdated = useRef(false);
  const { enumOptions = [] } = options;

  const dsOptions = useMemo(
    () => (Array.isArray(enumOptions)
      ? enumOptions.map((opt: any) => ({
          id: opt.value,
          label: opt.label,
          value: opt.value,
          schema: opt.schema,
        }))
      : []),
    [enumOptions]
  );

  useEffect(() => {
    if (Array.isArray(value)) {
      const newDownshiftValue: any[] = [];
      let newInputValue = '';
      value.forEach((v) => {
        const found = enumOptions.find((s: any) => s.value === v);
        if (!found) {
          newInputValue = v as any;
          return;
        }
        newDownshiftValue.push({
          id: found.value,
          label: found.label,
          value: found.value,
          schema: found.schema,
        });
      });

      const needsDownshiftUpdate =
        newDownshiftValue.length !== (downshiftValue as any[]).length ||
        newDownshiftValue.some((item, idx) => {
          const cur = (downshiftValue as any[])[idx];
          return !cur || cur.value !== item.value;
        });

      if (needsDownshiftUpdate) {
        setDownshiftValue(newDownshiftValue);
      }
      if (newInputValue !== '' && inputValue !== newInputValue) {
        setInputValue(newInputValue);
      }
      return;
    }

    const found = enumOptions.find((s: any) => s.value === value);
    if (found) {
      const next = [{
        id: found.value,
        label: found.label,
        value: found.value,
        schema: found.schema,
      }];
      const needsDownshiftUpdate =
        (downshiftValue as any[]).length !== 1 ||
        !(downshiftValue as any[])[0] ||
        (downshiftValue as any[])[0].value !== found.value;
      if (needsDownshiftUpdate) {
        setDownshiftValue(next);
      }
      if (inputValue !== '') {
        setInputValue('');
      }
    } else {
      if (inputValue !== (value as any)) {
        setInputValue(value as any);
      }
      if ((downshiftValue as any[]).length !== 0) {
        setDownshiftValue([]);
      }
    }
  }, [value, enumOptions]);
  console.log('id', id, 'name', label, 'multiple', multiple);
  return (
    <RcDownshift
      id={id}
      name={id}
      label={labelValue(label, hideLabel || !label, false)}
      placeholder={placeholder}
      disabled={disabled || readonly}
      required={required}
      multiple={multiple}
      toggleButton={dsOptions.length > 0}
      variant="tags"
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
          if (!multiple) {
            onChange(val);
          } else {
            onChange(downshiftValue.map((item) => item.value).concat(val));
          }
        }
        downshiftUpdated.current = false;
      }}
      onChange={(newItems) => {
        downshiftUpdated.current = true;
        setDownshiftValue(newItems);
        if (!multiple) {
          if (newItems.length > 0) {
            onChange(newItems[0].value);
          } else {
            onChange('');
          }
        } else {
          onChange(newItems.map((item) => item.value));
        }
      }}
      onBlur={() => {
        if (!multiple) {
          if (downshiftValue.length > 0) {
            onChange(downshiftValue[0].value);
          } else {
            onChange(inputValue);
          }
        } else {
          onChange(downshiftValue.map((item) => item.value));
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



