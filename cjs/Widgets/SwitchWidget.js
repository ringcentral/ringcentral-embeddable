"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SwitchWidget;
const react_1 = __importDefault(require("react"));
const utils_1 = require("@rjsf/utils");
const spring_ui_1 = require("@ringcentral/spring-ui");
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
const switchTransformDefaults = {
    '--tw-translate-y': '0',
    '--tw-rotate': '0',
    '--tw-skew-x': '0',
    '--tw-skew-y': '0',
    '--tw-scale-x': '1',
    '--tw-scale-y': '1',
};
function SwitchWidget(props) {
    var _a;
    const { autofocus, disabled, hideLabel, id, label = '', name, onBlur, onChange, onFocus, options, readonly, schema, uiSchema, value, } = props;
    const required = (0, utils_1.schemaRequiresTrueValue)(schema);
    const description = (_a = options.description) !== null && _a !== void 0 ? _a : schema.description;
    const labelContent = (0, utils_1.labelValue)(label, hideLabel, false);
    const isDisabled = disabled || readonly;
    const checked = typeof value === 'undefined' ? false : Boolean(value);
    const handleBlur = ({ target: { checked: nextChecked } }) => {
        onBlur(id, nextChecked);
    };
    const handleFocus = ({ target: { checked: nextChecked } }) => {
        onFocus(id, nextChecked);
    };
    return (react_1.default.createElement("div", { className: "flex w-full items-center justify-between gap-3" },
        !hideLabel ? (react_1.default.createElement("label", { htmlFor: id, className: "min-w-0 flex-1 cursor-pointer" },
            labelContent ? (react_1.default.createElement(spring_ui_1.Text, { className: "typography-mainText", component: "div" }, labelContent)) : null,
            description ? (react_1.default.createElement(spring_ui_1.Text, { id: (0, utils_1.descriptionId)(id), className: "typography-descriptor", component: "div", style: {
                    color: (uiSchema === null || uiSchema === void 0 ? void 0 : uiSchema['ui:disabled'])
                        ? 'var(--sui-colors-neutral-b3)'
                        : 'var(--sui-colors-neutral-b2)',
                } }, typeof description === 'string' ? (react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: description })) : (description))) : null)) : null,
        react_1.default.createElement(spring_ui_1.Switch, { className: "shrink-0", rootProps: {
                style: switchTransformDefaults,
            }, checked: checked, required: required, disabled: isDisabled, autoFocus: autofocus, onChange: (event) => onChange(event.target.checked), onBlur: handleBlur, onFocus: handleFocus, inputProps: {
                'aria-describedby': (0, utils_1.ariaDescribedByIds)(id),
                'aria-label': hideLabel && label ? label : undefined,
                id,
                name,
            } })));
}
//# sourceMappingURL=SwitchWidget.js.map