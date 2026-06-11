import React, { ChangeEvent, FocusEvent } from 'react';
import { Block, Checkbox, FormLabel } from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  FormContextType,
  labelValue,
  optionId,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  label,
  hideLabel,
  id,
  disabled,
  options,
  value,
  autofocus,
  readonly,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleChange =
    (index: number) =>
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
      onChange(
        checked
          ? enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions)
          : enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions),
      );
    };

  const handleBlur = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) => {
    onBlur(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  };
  const handleFocus = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) => {
    onFocus(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  };

  return (
    <>
      {labelValue(
        <FormLabel id={id} label={label || undefined} />,
        hideLabel,
      )}
      <Block id={id} row={!!inline}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index: number) => {
            const checked = enumOptionsIsSelected<S>(
              option.value,
              checkboxesValues,
            );
            const itemDisabled =
              Array.isArray(enumDisabled) &&
              enumDisabled.indexOf(option.value) !== -1;
            const itemId = optionId(id, index);

            return (
              <FormLabel key={index} id={itemId} label={option.label}>
                <Checkbox
                  checked={checked}
                  disabled={disabled || itemDisabled || readonly}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus={autofocus && index === 0}
                  onChange={handleChange(index)}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  aria-describedby={ariaDescribedByIds<T>(id)}
                  inputProps={{
                    id: itemId,
                    name: id,
                    value: String(index),
                  }}
                />
              </FormLabel>
            );
          })}
      </Block>
    </>
  );
}
