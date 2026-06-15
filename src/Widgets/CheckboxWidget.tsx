import React, { FocusEvent } from 'react';
import { Checkbox, FormLabel } from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  descriptionId,
  FormContextType,
  getTemplate,
  labelValue,
  RJSFSchema,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    value,
    disabled,
    readonly,
    label = '',
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    registry,
    options,
    uiSchema,
  } = props;
  const DescriptionFieldTemplate = getTemplate<
    'DescriptionFieldTemplate',
    T,
    S,
    F
  >('DescriptionFieldTemplate', registry, options);
  const required = schemaRequiresTrueValue<S>(schema);
  const description = options.description ?? schema.description;

  const handleBlur = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) => {
    onBlur(id, nextValue);
  };
  const handleFocus = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) => {
    onFocus(id, nextValue);
  };

  return (
    <>
      {!hideLabel && !!description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <FormLabel id={id} label={labelValue(label, hideLabel, false)}>
        <Checkbox
          inputProps={{
            id,
            name: id,
          }}
          checked={typeof value === 'undefined' ? false : Boolean(value)}
          required={required}
          disabled={disabled || readonly}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autofocus}
          onChange={(event) => onChange(event.target.checked)}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-describedby={ariaDescribedByIds<T>(id)}
        />
      </FormLabel>
    </>
  );
}
