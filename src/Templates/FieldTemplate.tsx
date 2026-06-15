import React from 'react';
import { Text } from '@ringcentral/spring-ui';
import {
  FieldTemplateProps,
  FormContextType,
  getTemplate,
  getUiOptions,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

const descriptionInWidgetNames = new Set([
  'checkbox',
  'switch',
  'toggle',
  'CheckboxWidget',
  'SwitchWidget',
]);

function isDescriptionRenderedInWidget(widget: unknown): boolean {
  return typeof widget === 'string' && descriptionInWidgetNames.has(widget);
}

export default function FieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: FieldTemplateProps<T, S, F>) {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    hidden,
    label,
    onDropPropertyClick,
    onKeyChange,
    readonly,
    required,
    errors,
    help,
    description,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const WrapIfAdditionalTemplate = getTemplate<
    'WrapIfAdditionalTemplate',
    T,
    S,
    F
  >('WrapIfAdditionalTemplate', registry, uiOptions);
  const isDefaultBooleanWidget = schema.type === 'boolean' && !uiOptions.widget;
  const shouldShowDescription =
    displayLabel &&
    rawDescription &&
    !isDefaultBooleanWidget &&
    !isDescriptionRenderedInWidget(uiOptions.widget);
  if (hidden) {
    return <div style={{ display: 'none' }}>{children}</div>;
  }
  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      onDropPropertyClick={onDropPropertyClick}
      onKeyChange={onKeyChange}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <div className="w-full">
        {children}
        {shouldShowDescription ? (
          <Text className="typography-mainText">{description}</Text>
        ) : null}
        {errors}
        {help}
      </div>
    </WrapIfAdditionalTemplate>
  );
}
