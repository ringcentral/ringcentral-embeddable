import React, { ChangeEvent, FocusEvent } from 'react';
import { Checkbox, FormLabel } from '@ringcentral/spring-ui';
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

const CHECKBOX_GROUP_LABEL_ROOT_STYLE: React.CSSProperties = {
  marginBottom: 'var(--sui-spacing-2)',
};

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
  const containerClassName = inline
    ? 'flex flex-wrap gap-x-4 gap-y-2'
    : 'flex flex-col gap-2';
  const fieldLabel = labelValue(label, hideLabel, false);

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
      {fieldLabel ? (
        <FormLabel
          id={id}
          label={fieldLabel}
          rootProps={{
            style: CHECKBOX_GROUP_LABEL_ROOT_STYLE,
          }}
        />
      ) : null}
      <div id={id} className={containerClassName}>
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
      </div>
    </>
  );
}
