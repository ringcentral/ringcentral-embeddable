import { TextField, TextFieldProps } from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  BaseInputTemplateProps,
  examplesId,
  FormContextType,
  getInputProps,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import React, { ChangeEvent, FocusEvent } from 'react';

export default function BaseInputTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: BaseInputTemplateProps<T, S, F>) {
  const {
    id,
    name,
    placeholder,
    required,
    readonly,
    disabled,
    type,
    label,
    hideLabel,
    hideError,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    rawErrors = [],
    formContext,
    registry,
    InputLabelProps,
    ...textFieldProps
  } = props;
  const inputType = type || 'text';
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const { step, min, max, ...rest } = inputProps;
  const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
  const handleChange = ({ target: { value: inputValue } }: ChangeEvent<HTMLInputElement>) => {
    onChange(inputValue);
  };
  const handleBlur = ({ target: { value: inputValue } }: FocusEvent<HTMLInputElement>) => {
    onBlur(id, inputValue);
  };
  const handleFocus = ({ target: { value: inputValue } }: FocusEvent<HTMLInputElement>) => {
    onFocus(id, inputValue);
  };
  return (
    <>
      <TextField
        data-sign={name}
        id={id}
        placeholder={placeholder}
        label={labelValue(label || undefined, hideLabel, false)}
        fullWidth
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        inputProps={{
          step,
          min,
          max,
          ...(schema.examples ? { list: examplesId<T>(id) } : undefined),
        }}
        {...rest}
        value={value || value === 0 ? value : ''}
        error={Boolean(errorMessage)}
        helperText={errorMessage}
        onChange={onChangeOverride || handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...(textFieldProps as TextFieldProps)}
        type={inputType}
        aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      />
      {Array.isArray(schema.examples) ? (
        <datalist id={examplesId<T>(id)}>
          {(schema.examples as string[])
            .concat(
              schema.default && !schema.examples.includes(schema.default)
                ? ([schema.default] as string[])
                : [],
            )
            .map((example: string) => {
              return <option key={example} value={example} />;
            })}
        </datalist>
      ) : null}
    </>
  );
}
