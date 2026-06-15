import React from 'react';
import { Checkbox, FormLabel } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, descriptionId, getTemplate, labelValue, schemaRequiresTrueValue, } from '@rjsf/utils';
export default function CheckboxWidget(props) {
    var _a;
    const { schema, id, value, disabled, readonly, label = '', hideLabel, autofocus, onChange, onBlur, onFocus, registry, options, uiSchema, } = props;
    const DescriptionFieldTemplate = getTemplate('DescriptionFieldTemplate', registry, options);
    const required = schemaRequiresTrueValue(schema);
    const description = (_a = options.description) !== null && _a !== void 0 ? _a : schema.description;
    const handleBlur = ({ target: { value: nextValue } }) => {
        onBlur(id, nextValue);
    };
    const handleFocus = ({ target: { value: nextValue } }) => {
        onFocus(id, nextValue);
    };
    return (React.createElement(React.Fragment, null,
        !hideLabel && !!description && (React.createElement(DescriptionFieldTemplate, { id: descriptionId(id), description: description, schema: schema, uiSchema: uiSchema, registry: registry })),
        React.createElement(FormLabel, { id: id, label: labelValue(label, hideLabel, false) },
            React.createElement(Checkbox, { inputProps: {
                    id,
                    name: id,
                }, checked: typeof value === 'undefined' ? false : Boolean(value), required: required, disabled: disabled || readonly, 
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus: autofocus, onChange: (event) => onChange(event.target.checked), onBlur: handleBlur, onFocus: handleFocus, "aria-describedby": ariaDescribedByIds(id) }))));
}
//# sourceMappingURL=CheckboxWidget.js.map