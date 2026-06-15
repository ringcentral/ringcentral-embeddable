import React, { ComponentType, CSSProperties, useState } from 'react';
import {
  canExpand,
  DescriptionFieldProps,
  descriptionId,
  FormContextType,
  getTemplate,
  getUiOptions,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  TitleFieldProps,
  titleId,
} from '@rjsf/utils';

type DescriptionTemplateProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = DescriptionFieldProps<T, S, F> & {
  style?: CSSProperties;
};

type TitleTemplateProps<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> = TitleFieldProps<T, S, F> & {
  extended?: boolean;
  onClick?: () => void;
};

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema = {},
    idSchema,
    schema,
    formData,
    onAddClick,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions,
  ) as ComponentType<TitleTemplateProps<T, S, F>>;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions,
  ) as ComponentType<DescriptionTemplateProps<T, S, F>>;
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const isCollapsible = uiOptions.collapsible || false;
  const [isExpanded, setIsExpanded] = useState<boolean>(isCollapsible ? false : true);
  return (
    <>
      {title ? (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          extended={isExpanded}
          onClick={() => {
            if (isCollapsible) {
              setIsExpanded(!isExpanded);
            }
          }}
        />
      ) : null}
      {description ? (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          style={{ marginTop: -4 }}
        />
      ) : null}
      {isExpanded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: title ? 10 : 0 }}>
          {properties.map((element) => {
            if (element.hidden) {
              return element.content;
            }
            const fieldUiSchema = uiSchema?.[element.name] || {};
            return (
              <div
                key={element.name}
                style={{
                  marginBottom: fieldUiSchema?.['ui:collapsible'] ? 0 : 10,
                  marginLeft: fieldUiSchema?.['ui:bulletedList'] ? 16 : undefined,
                }}
              >
                {element.content}
              </div>
            );
          })}
          {canExpand<T, S, F>(schema, uiSchema, formData) ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <AddButton
                className="object-property-expand"
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
