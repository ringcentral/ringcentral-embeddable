import React from 'react';
import { withTheme } from '@rjsf/core';
import { fields } from './Fields/index.js';
import { templates } from './Templates/index.js';
import { widgets } from './Widgets/index.js';
import { Validator } from './validator.js';
import { ActionMenu } from './components/ActionMenu.js';
import { TextWithMarkdown } from './components/TextWithMarkdown.js';
const theme = { widgets, templates };
const Form = withTheme(theme);
const validator = new Validator();
export { ActionMenu, TextWithMarkdown };
export function JSONSchemaPage({ schema, uiSchema = {}, formData, onFormDataChange, onButtonClick, hiddenSubmitButton = true, onSubmit, }) {
    let formUISchema = uiSchema;
    if (hiddenSubmitButton) {
        formUISchema = Object.assign(Object.assign({}, formUISchema), { 'ui:submitButtonOptions': {
                norender: true,
            } });
    }
    else if (formUISchema.submitButtonOptions) {
        formUISchema = Object.assign(Object.assign({}, formUISchema), { 'ui:submitButtonOptions': Object.assign({}, formUISchema.submitButtonOptions) });
    }
    return (React.createElement(Form, { schema: schema, validator: validator, formData: formData, onChange: (event) => {
            onFormDataChange(event.formData);
        }, uiSchema: formUISchema, fields: fields, onFocus: (name, value) => {
            if (value === '$$clicked') {
                onButtonClick === null || onButtonClick === void 0 ? void 0 : onButtonClick(name);
            }
        }, onSubmit: onSubmit }));
}
//# sourceMappingURL=index.js.map