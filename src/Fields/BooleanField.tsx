import React from 'react';
import isObject from 'lodash/isObject';
import {
  EnumOptionsType,
  FieldProps,
  FormContextType,
  getUiOptions,
  getWidget,
  optionsList,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

export default function BooleanField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    formData,
    hideError,
    idSchema,
    name,
    onBlur,
    onChange,
    onFocus,
    rawErrors,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;
  const { formContext, globalUiOptions, translateString, widgets } = registry;
  const {
    label: displayLabel = true,
    title: uiTitle,
    widget = 'switch',
    ...options
  } = getUiOptions<T, S, F>(uiSchema, globalUiOptions);
  const Widget = getWidget<T, S, F>(schema, widget, widgets);
  const yes = translateString(TranslatableString.YesLabel);
  const no = translateString(TranslatableString.NoLabel);
  let enumOptions: EnumOptionsType<S>[] | undefined;
  const label = uiTitle ?? schema.title ?? title ?? name;
  if (Array.isArray(schema.oneOf)) {
    enumOptions = optionsList<S, T, F>(
      {
        oneOf: schema.oneOf
          .map((option): S | undefined => {
            if (!isObject(option)) {
              return undefined;
            }
            const schemaOption = option as S & { const?: boolean; title?: string };
            return {
              ...schemaOption,
              title: schemaOption.title || (schemaOption.const === true ? yes : no),
            } as S;
          })
          .filter((option): option is S => Boolean(option)),
      } as unknown as S,
      uiSchema,
    );
  } else {
    const schemaWithEnumNames = schema as S & { enumNames?: string[] };
    const enums = schema.enum ?? [true, false];
    if (
      !schemaWithEnumNames.enumNames &&
      enums.length === 2 &&
      enums.every((enumValue: unknown) => typeof enumValue === 'boolean')
    ) {
      enumOptions = [
        {
          label: enums[0] ? yes : no,
          value: enums[0],
        },
        {
          label: enums[1] ? yes : no,
          value: enums[1],
        },
      ];
    } else {
      enumOptions = optionsList<S, T, F>(
        {
          enum: enums,
          enumNames: schemaWithEnumNames.enumNames,
        } as unknown as S,
        uiSchema,
      );
    }
  }
  return (
    <Widget
      autofocus={autofocus}
      disabled={disabled}
      formContext={formContext}
      hideError={hideError}
      hideLabel={!displayLabel}
      id={idSchema.$id}
      label={label}
      name={name}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      options={{ ...options, enumOptions }}
      rawErrors={rawErrors}
      readonly={readonly}
      registry={registry}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      value={formData}
    />
  );
}
