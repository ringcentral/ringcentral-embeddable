import React, { ChangeEvent, FocusEvent } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  labelValue,
} from '@rjsf/utils';
import {
  RcTextarea,
  styled,
} from '@ringcentral/juno';

const StyledTextarea = styled(RcTextarea)`
  .RcTextFieldInput-input {
    font-size: 1rem;
  }
`;

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    options,
    id,
    label,
    hideLabel,
    placeholder,
    required,
    readonly,
    disabled,
    autofocus,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    value,
    InputLabelProps,
    rawErrors = [],
  } = props;
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) => onFocus(id, value);

  let rows: string | number = 2;
  if (typeof options.rows === 'string' || typeof options.rows === 'number') {
    rows = options.rows;
  }
  return (
    <StyledTextarea
      id={id}
      name={id}
      minRows={rows}
      label={labelValue(label, hideLabel || !label, false)}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      fullWidth
      value={value ? value : ''}
      error={rawErrors.length > 0}
      onChange={onChangeOverride || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      placeholder={placeholder}
      InputLabelProps={InputLabelProps}
    />
  );
}
