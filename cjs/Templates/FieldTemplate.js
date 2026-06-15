"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FieldTemplate;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
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
function FieldTemplate(props) {
    const { id, children, classNames, style, disabled, displayLabel, hidden, label, onDropPropertyClick, onKeyChange, readonly, required, errors, help, description, rawDescription, schema, uiSchema, registry, } = props;
    const uiOptions = (0, utils_1.getUiOptions)(uiSchema);
    const WrapIfAdditionalTemplate = (0, utils_1.getTemplate)('WrapIfAdditionalTemplate', registry, uiOptions);
    const isDefaultBooleanWidget = schema.type === 'boolean' && !uiOptions.widget;
    const shouldShowDescription = displayLabel &&
        rawDescription &&
        !isDefaultBooleanWidget &&
        !isDescriptionRenderedInWidget(uiOptions.widget);
    if (hidden) {
        return react_1.default.createElement("div", { style: { display: 'none' } }, children);
    }
    return (react_1.default.createElement(WrapIfAdditionalTemplate, { classNames: classNames, style: style, disabled: disabled, id: id, label: label, onDropPropertyClick: onDropPropertyClick, onKeyChange: onKeyChange, readonly: readonly, required: required, schema: schema, uiSchema: uiSchema, registry: registry },
        react_1.default.createElement("div", { className: "w-full" },
            children,
            shouldShowDescription ? (react_1.default.createElement(spring_ui_1.Text, { className: "typography-mainText" }, description)) : null,
            errors,
            help)));
}
//# sourceMappingURL=FieldTemplate.js.map