import React from 'react';
import { withTheme, ThemeProps } from '@rjsf/core';
import { widgets } from './Widgets';
import { templates } from './Templates';
import { fields } from './Fields';
import { Validator } from './validator';
import { TextWithMarkdown } from './components/TextWithMarkdown';
import { ActionMenu } from './components/ActionMenu';

const theme: ThemeProps = { widgets, templates };

const Form = withTheme(theme);
const validator = new Validator();

// A `const` inside `oneOf` describes a selectable option, not a preset value.
// Letting it become a default makes the form report a change as soon as it
// mounts, so pages that navigate on selection would jump to their first option.
const defaultFormStateBehavior = { constAsDefaults: 'never' } as const;

export { TextWithMarkdown, ActionMenu };
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
      experimental_defaultFormStateBehavior={defaultFormStateBehavior}
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
