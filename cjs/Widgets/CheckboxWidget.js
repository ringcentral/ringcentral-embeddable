"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CheckboxWidget;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
function CheckboxWidget(props) {
    var _a;
    const { schema, id, value, disabled, readonly, label = '', hideLabel, autofocus, onChange, onBlur, onFocus, registry, options, uiSchema, } = props;
    const DescriptionFieldTemplate = (0, utils_1.getTemplate)('DescriptionFieldTemplate', registry, options);
    const required = (0, utils_1.schemaRequiresTrueValue)(schema);
    const description = (_a = options.description) !== null && _a !== void 0 ? _a : schema.description;
    const handleBlur = ({ target: { value: nextValue } }) => {
        onBlur(id, nextValue);
    };
    const handleFocus = ({ target: { value: nextValue } }) => {
        onFocus(id, nextValue);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        !hideLabel && !!description && (react_1.default.createElement(DescriptionFieldTemplate, { id: (0, utils_1.descriptionId)(id), description: description, schema: schema, uiSchema: uiSchema, registry: registry })),
        react_1.default.createElement(spring_ui_1.FormLabel, { id: id, label: (0, utils_1.labelValue)(label, hideLabel, false) },
            react_1.default.createElement(spring_ui_1.Checkbox, { inputProps: {
                    id,
                    name: id,
                }, checked: typeof value === 'undefined' ? false : Boolean(value), required: required, disabled: disabled || readonly, 
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus: autofocus, onChange: (event) => onChange(event.target.checked), onBlur: handleBlur, onFocus: handleFocus, "aria-describedby": (0, utils_1.ariaDescribedByIds)(id) }))));
}
//# sourceMappingURL=CheckboxWidget.js.map