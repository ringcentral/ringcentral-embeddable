import React, { useState } from 'react';
import { canExpand, descriptionId, getTemplate, getUiOptions, titleId, } from '@rjsf/utils';
export default function ObjectFieldTemplate(props) {
    const { description, title, properties, required, disabled, readonly, uiSchema = {}, idSchema, schema, formData, onAddClick, registry, } = props;
    const uiOptions = getUiOptions(uiSchema);
    const TitleFieldTemplate = getTemplate('TitleFieldTemplate', registry, uiOptions);
    const DescriptionFieldTemplate = getTemplate('DescriptionFieldTemplate', registry, uiOptions);
    const { ButtonTemplates: { AddButton }, } = registry.templates;
    const isCollapsible = uiOptions.collapsible || false;
    const [isExpanded, setIsExpanded] = useState(isCollapsible ? false : true);
    return (React.createElement(React.Fragment, null,
        title ? (React.createElement(TitleFieldTemplate, { id: titleId(idSchema), title: title, required: required, schema: schema, uiSchema: uiSchema, registry: registry, extended: isExpanded, onClick: () => {
                if (isCollapsible) {
                    setIsExpanded(!isExpanded);
                }
            } })) : null,
        description ? (React.createElement(DescriptionFieldTemplate, { id: descriptionId(idSchema), description: description, schema: schema, uiSchema: uiSchema, registry: registry, style: { marginTop: -4 } })) : null,
        isExpanded ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: title ? 10 : 0 } },
            properties.map((element) => {
                if (element.hidden) {
                    return element.content;
                }
                const fieldUiSchema = (uiSchema === null || uiSchema === void 0 ? void 0 : uiSchema[element.name]) || {};
                return (React.createElement("div", { key: element.name, style: {
                        marginBottom: (fieldUiSchema === null || fieldUiSchema === void 0 ? void 0 : fieldUiSchema['ui:collapsible']) ? 0 : 10,
                        marginLeft: (fieldUiSchema === null || fieldUiSchema === void 0 ? void 0 : fieldUiSchema['ui:bulletedList']) ? 16 : undefined,
                    } }, element.content));
            }),
            canExpand(schema, uiSchema, formData) ? (React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end' } },
                React.createElement(AddButton, { className: "object-property-expand", onClick: onAddClick(schema), disabled: disabled || readonly, uiSchema: uiSchema, registry: registry }))) : null)) : null));
}
//# sourceMappingURL=ObjectFieldTemplate.js.map