import { Textarea } from '@ringcentral/spring-ui';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import React, {
  ChangeEvent,
  FocusEvent,
  FocusEventHandler,
  useMemo,
} from 'react';

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    name,
    value,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    options,
  } = props;
  const handleChange = ({ target: { value: nextValue } }: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(nextValue);
  };
  const handleBlur: FocusEventHandler<HTMLTextAreaElement | HTMLInputElement> = ({
    target: { value: nextValue },
  }: FocusEvent<HTMLTextAreaElement>) => {
    onBlur(id, nextValue);
  };
  const handleFocus: FocusEventHandler<HTMLTextAreaElement | HTMLInputElement> = ({
    target: { value: nextValue },
  }: FocusEvent<HTMLTextAreaElement>) => {
    onFocus(id, nextValue);
  };
  const inputProps = useMemo(
    () => ({
      'data-sign': name,
      ...props.inputProps,
    }),
    [name, props.inputProps],
  );
  return (
    <Textarea
      {...props}
      inputProps={inputProps}
      onChange={onChangeOverride || handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      value={value ?? ''}
      minRows={4}
      maxRows={12}
      rows={options.rows}
      fullWidth
      defaultValue={props.defaultValue as string}
      clearBtn={false}
      variant="outlined"
      size="large"
    />
  );
}
