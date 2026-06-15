var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { getTemplate, getUiOptions, } from '@rjsf/utils';
import React from 'react';
function joinClassNames(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
export default function ArrayFieldTemplate(props) {
    const { canAdd, className, disabled, idSchema, uiSchema, items, onAddClick, readonly, registry, required, schema, title, } = props;
    const uiOptions = getUiOptions(uiSchema);
    const ArrayFieldDescriptionTemplate = getTemplate('ArrayFieldDescriptionTemplate', registry, uiOptions);
    const ArrayFieldItemTemplate = getTemplate('ArrayFieldItemTemplate', registry, uiOptions);
    const ArrayFieldTitleTemplate = getTemplate('ArrayFieldTitleTemplate', registry, uiOptions);
    const { ButtonTemplates: { AddButton }, } = registry.templates;
    const hasItems = items.length > 0;
    return (React.createElement("div", { className: joinClassNames('w-full min-w-0', className) },
        React.createElement(ArrayFieldTitleTemplate, { idSchema: idSchema, title: uiOptions.title || title, schema: schema, uiSchema: uiSchema, required: required, registry: registry }),
        React.createElement(ArrayFieldDescriptionTemplate, { idSchema: idSchema, description: uiOptions.description || schema.description, schema: schema, uiSchema: uiSchema, registry: registry }),
        hasItems ? (React.createElement("div", { className: "mt-3 flex w-full min-w-0 flex-col gap-3" }, items.map((_a) => {
            var { key } = _a, itemProps = __rest(_a, ["key"]);
            return (React.createElement(ArrayFieldItemTemplate, Object.assign({ key: key }, itemProps)));
        }))) : null,
        canAdd ? (React.createElement("div", { className: joinClassNames('flex w-full justify-end', hasItems ? 'mt-2' : 'mt-3') },
            React.createElement(AddButton, { className: "array-item-add shrink-0", onClick: onAddClick, disabled: disabled || readonly, uiSchema: uiSchema, registry: registry }))) : null));
}
//# sourceMappingURL=ArrayFieldTemplate.js.map