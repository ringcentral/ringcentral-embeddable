import React from 'react';
import { ThemeProps, withTheme } from '@rjsf/core';
import { fields } from './Fields';
import { templates } from './Templates';
import { widgets } from './Widgets';
import { Validator } from './validator';
import { ActionMenu } from './components/ActionMenu';
import { TextWithMarkdown } from './components/TextWithMarkdown';

const theme: ThemeProps = { widgets, templates };
const Form = withTheme(theme);
const validator = new Validator();

export { ActionMenu, TextWithMarkdown };

export type JSONSchemaPageProps = {
  formData?: any;
  hiddenSubmitButton?: boolean;
  onButtonClick?: (name: string) => void;
  onFormDataChange: (formData: any) => void;
  onSubmit?: (data: any) => void;
  schema: any;
  uiSchema?: any;
};

export function JSONSchemaPage({
  schema,
  uiSchema = {},
  formData,
  onFormDataChange,
  onButtonClick,
  hiddenSubmitButton = true,
  onSubmit,
}: JSONSchemaPageProps) {
  let formUISchema = uiSchema;
  if (hiddenSubmitButton) {
    formUISchema = {
      ...formUISchema,
      'ui:submitButtonOptions': {
        norender: true,
      },
    };
  } else if (formUISchema.submitButtonOptions) {
    formUISchema = {
      ...formUISchema,
      'ui:submitButtonOptions': {
        ...formUISchema.submitButtonOptions,
      },
    };
  }
  return (
    <Form
      schema={schema}
      validator={validator}
      formData={formData}
      onChange={(event) => {
        onFormDataChange(event.formData);
      }}
      uiSchema={formUISchema}
      fields={fields}
      onFocus={(name, value) => {
        if (value === '$$clicked') {
          onButtonClick?.(name);
        }
      }}
      onSubmit={onSubmit}
    />
  );
}
