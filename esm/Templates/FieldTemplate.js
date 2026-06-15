import React from 'react';
import { Text } from '@ringcentral/spring-ui';
import { getTemplate, getUiOptions, } from '@rjsf/utils';
const descriptionInWidgetNames = new Set([
    'checkbox',
    'switch',
    'toggle',
    'CheckboxWidget',
    'SwitchWidget',
]);
function isDescriptionRenderedInWidget(widget) {
    return typeof widget === 'string' && descriptionInWidgetNames.has(widget);
}
export default function FieldTemplate(props) {
    const { id, children, classNames, style, disabled, displayLabel, hidden, label, onDropPropertyClick, onKeyChange, readonly, required, errors, help, description, rawDescription, schema, uiSchema, registry, } = props;
    const uiOptions = getUiOptions(uiSchema);
    const WrapIfAdditionalTemplate = getTemplate('WrapIfAdditionalTemplate', registry, uiOptions);
    const isDefaultBooleanWidget = schema.type === 'boolean' && !uiOptions.widget;
    const shouldShowDescription = displayLabel &&
        rawDescription &&
        !isDefaultBooleanWidget &&
        !isDescriptionRenderedInWidget(uiOptions.widget);
    if (hidden) {
        return React.createElement("div", { style: { display: 'none' } }, children);
    }
    return (React.createElement(WrapIfAdditionalTemplate, { classNames: classNames, style: style, disabled: disabled, id: id, label: label, onDropPropertyClick: onDropPropertyClick, onKeyChange: onKeyChange, readonly: readonly, required: required, schema: schema, uiSchema: uiSchema, registry: registry },
        React.createElement("div", { className: "w-full" },
            children,
            shouldShowDescription ? (React.createElement(Text, { className: "typography-mainText" }, description)) : null,
            errors,
            help)));
}
//# sourceMappingURL=FieldTemplate.js.map