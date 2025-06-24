import React, { useState } from 'react';
import { RcGrid as Grid, RcDivider as Divider } from '@ringcentral/juno';
import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId,
} from '@rjsf/utils';

export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
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
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  const gridStyle: {
    paddingLeft?: string;
    marginTop: string;
  } = { marginTop: '10px' };
  if (title) {
    gridStyle.paddingLeft = '16px';
  }
  const collapsible = uiOptions.collapsible || false;
  const [extended, setExtended] = useState<boolean>(collapsible ? false : true);
  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
          extended={extended}
          onClick={() => {
            if (!collapsible) {
              return;
            }
            setExtended(!extended);
          }}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {
        extended && (
          <Grid container={true} spacing={2} style={gridStyle}>
            {properties.map((element, index) => {
              // Remove the <Grid> if the inner element is hidden as the <Grid>
              // itself would otherwise still take up space.
              if (element.hidden) {
                return element.content;
              }
              const uiSchemaProperty = uiSchema?.[element.name] || {};
              const style = uiSchemaProperty?.['ui:bulletedList'] ? {
                marginLeft: '16px',
              } : {
                marginBottom: '10px'
              };
              return (
                <Grid item={true} xs={12} key={index} style={style}>
                  {element.content}
                </Grid>
              );
            })}
            {canExpand<T, S, F>(schema, uiSchema, formData) && (
              <Grid container justifyContent='flex-end'>
                <Grid item={true}>
                  <AddButton
                    className='object-property-expand'
                    onClick={onAddClick(schema)}
                    disabled={disabled || readonly}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </Grid>
              </Grid>
            )}
          </Grid>
        )
      }
      {
        collapsible && (<Divider />)
      }
    </>
  );
}