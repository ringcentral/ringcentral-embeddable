import React from 'react';
import { withTheme, ThemeProps } from '@rjsf/core';
import { widgets } from './Widgets';
import { templates } from './Templates';
import { fields } from './Fields';
import { Validator } from './validator';

const theme: ThemeProps = { widgets, templates };

const Form = withTheme(theme);
const validator = new Validator();

export const JSONSchemaPage = ({
  schema,
  uiSchema = {},
  formData,
  onFormDataChange,
  onButtonClick,
  hiddenSubmitButton = true,
  onSubmit,
}) => {
  let formUISchema = uiSchema;
  if (hiddenSubmitButton) {
    formUISchema = {
      ...formUISchema,
      'ui:submitButtonOptions': {
        norender: true,
      },
    };
  } else if (formUISchema['submitButtonOptions']) {
    formUISchema = {
      ...formUISchema,
      'ui:submitButtonOptions': {
        ...formUISchema['submitButtonOptions'],
      },
    };
  }
  return (
    <Form
      schema={schema}
      validator={validator}
      formData={formData}
      onChange={(e) => {
        onFormDataChange(e.formData);
      }}
      uiSchema={formUISchema}
      fields={fields}
      onFocus={(name, value) => {
        if (value === '$$clicked') {
          onButtonClick(name);
        }
      }}
      onSubmit={onSubmit}
    />
  );
}
