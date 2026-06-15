import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  MenuItemText,
  SuggestionListItem,
  type AutocompleteRenderOptionState,
  type SuggestionListItemData,
} from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

type AutocompleteItem = SuggestionListItemData & {
  id: string;
  label: string;
  schema?: any;
  value: string;
};

type AutocompleteRenderOption = AutocompleteItem &
  React.ComponentProps<typeof SuggestionListItem> & {
    key?: React.Key;
  };

export default function AutocompleteWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
  const [autocompleteValue, setAutocompleteValue] = useState<AutocompleteItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const isAutocompleteUpdating = useRef(false);
  const { enumOptions = [], placeholder: optionsPlaceholder } = options as {
    enumOptions?: any[];
    placeholder?: string;
  };
  const resolvedPlaceholder = placeholder ?? optionsPlaceholder;
  const autocompleteOptions = useMemo(
    () => (Array.isArray(enumOptions)
      ? enumOptions.map((option: any) => ({
          id: option.value,
          label: option.label,
          schema: option.schema,
          value: option.value,
        }))
      : []),
    [enumOptions],
  );
  useEffect(() => {
    if (Array.isArray(value)) {
      const nextValue: AutocompleteItem[] = [];
      let nextInputValue = '';
      value.forEach((itemValue) => {
        const found = enumOptions.find((option: any) => option.value === itemValue);
        if (!found) {
          nextInputValue = itemValue as string;
          return;
        }
        nextValue.push({
          id: found.value,
          label: found.label,
          schema: found.schema,
          value: found.value,
        });
      });
      setAutocompleteValue(nextValue);
      setInputValue(nextInputValue);
      return;
    }
    const found = enumOptions.find((option: any) => option.value === value);
    if (found) {
      setAutocompleteValue([{
        id: found.value,
        label: found.label,
        schema: found.schema,
        value: found.value,
      }]);
      setInputValue('');
      return;
    }
    setAutocompleteValue([]);
    setInputValue((value as string) || '');
  }, [value, enumOptions]);
  return (
    <Autocomplete
      id={id}
      label={labelValue(label, hideLabel || !label, false)}
      placeholder={resolvedPlaceholder}
      disabled={disabled || readonly}
      required={required}
      multiple={multiple}
      toggleButton={autocompleteOptions.length > 0}
      variant="tags"
      options={autocompleteOptions.filter((option) => {
        if (!inputValue) {
          return true;
        }
        return (
          option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
          option.value.toLowerCase().includes(inputValue.toLowerCase())
        );
      })}
      value={autocompleteValue}
      inputValue={inputValue}
      fullWidth
      error={rawErrors.length > 0}
      onInputChange={(nextInputValue: string) => {
        setInputValue(nextInputValue);
        if (!isAutocompleteUpdating.current) {
          if (!multiple) {
            onChange(nextInputValue);
          } else {
            onChange(autocompleteValue.map((item) => item.value).concat(nextInputValue));
          }
        }
        isAutocompleteUpdating.current = false;
      }}
      onChange={(nextItems: AutocompleteItem[]) => {
        isAutocompleteUpdating.current = true;
        const nextValue = Array.isArray(nextItems) ? nextItems : [];
        setAutocompleteValue(nextValue);
        if (!multiple) {
          onChange(nextValue.length > 0 ? nextValue[0].value : '');
          return;
        }
        onChange(nextValue.map((item) => item.value));
      }}
      onBlur={() => {
        if (!multiple) {
          onChange(autocompleteValue.length > 0 ? autocompleteValue[0].value : inputValue);
          return;
        }
        onChange(autocompleteValue.map((item) => item.value));
      }}
      renderOption={(
        item: AutocompleteItem,
        state: AutocompleteRenderOptionState,
      ) => {
        const {
          key,
          id: itemId,
          label: itemLabel,
          value: itemValue,
          schema: _schema,
          ...itemProps
        } = item as AutocompleteRenderOption;
        return (
          <SuggestionListItem
            {...itemProps}
            id={String(itemId ?? itemValue)}
            key={key ?? `${itemId}-${state.index}`}
            highlighted={state.highlighted}
          >
            <MenuItemText primary={itemLabel} info={itemValue} />
          </SuggestionListItem>
        );
      }}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
