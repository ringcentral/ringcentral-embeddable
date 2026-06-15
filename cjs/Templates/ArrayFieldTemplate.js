"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArrayFieldTemplate;
const utils_1 = require("@rjsf/utils");
const react_1 = __importDefault(require("react"));
function joinClassNames(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
function ArrayFieldTemplate(props) {
    const { canAdd, className, disabled, idSchema, uiSchema, items, onAddClick, readonly, registry, required, schema, title, } = props;
    const uiOptions = (0, utils_1.getUiOptions)(uiSchema);
    const ArrayFieldDescriptionTemplate = (0, utils_1.getTemplate)('ArrayFieldDescriptionTemplate', registry, uiOptions);
    const ArrayFieldItemTemplate = (0, utils_1.getTemplate)('ArrayFieldItemTemplate', registry, uiOptions);
    const ArrayFieldTitleTemplate = (0, utils_1.getTemplate)('ArrayFieldTitleTemplate', registry, uiOptions);
    const { ButtonTemplates: { AddButton }, } = registry.templates;
    const hasItems = items.length > 0;
    return (react_1.default.createElement("div", { className: joinClassNames('w-full min-w-0', className) },
        react_1.default.createElement(ArrayFieldTitleTemplate, { idSchema: idSchema, title: uiOptions.title || title, schema: schema, uiSchema: uiSchema, required: required, registry: registry }),
        react_1.default.createElement(ArrayFieldDescriptionTemplate, { idSchema: idSchema, description: uiOptions.description || schema.description, schema: schema, uiSchema: uiSchema, registry: registry }),
        hasItems ? (react_1.default.createElement("div", { className: "mt-3 flex w-full min-w-0 flex-col gap-3" }, items.map((_a) => {
            var { key } = _a, itemProps = __rest(_a, ["key"]);
            return (react_1.default.createElement(ArrayFieldItemTemplate, Object.assign({ key: key }, itemProps)));
        }))) : null,
        canAdd ? (react_1.default.createElement("div", { className: joinClassNames('flex w-full justify-end', hasItems ? 'mt-2' : 'mt-3') },
            react_1.default.createElement(AddButton, { className: "array-item-add shrink-0", onClick: onAddClick, disabled: disabled || readonly, uiSchema: uiSchema, registry: registry }))) : null));
}
//# sourceMappingURL=ArrayFieldTemplate.js.map