import React from 'react';
import validator from '@rjsf/validator-ajv8';
import { withTheme, ThemeProps } from '@rjsf/core';
import { widgets } from './Widgets';
import { templates } from './Templates';
import { fields } from './Fields';

const theme: ThemeProps = { widgets, templates };

const Form = withTheme(theme);

export const CustomizedForm = ({
  schema,
  uiSchema = {},
  formData,
  onFormDataChange,
}) => {
  return (
    <Form
      schema={schema}
      validator={validator}
      formData={formData}
      onChange={(e) => {
        onFormDataChange(e.formData);
      }}
      uiSchema={{
        ...uiSchema,
        "ui:submitButtonOptions": {
          norender: true,
        },
      }}
      fields={fields}
    />
  );
}
