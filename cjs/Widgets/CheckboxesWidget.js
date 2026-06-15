"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CheckboxesWidget;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
const CHECKBOX_GROUP_LABEL_ROOT_STYLE = {
    marginBottom: 'var(--sui-spacing-2)',
};
function CheckboxesWidget({ label, hideLabel, id, disabled, options, value, autofocus, readonly, onChange, onBlur, onFocus, }) {
    const { enumOptions, enumDisabled, inline, emptyValue } = options;
    const checkboxesValues = Array.isArray(value) ? value : [value];
    const containerClassName = inline
        ? 'flex flex-wrap gap-x-4 gap-y-2'
        : 'flex flex-col gap-2';
    const fieldLabel = (0, utils_1.labelValue)(label, hideLabel, false);
    const handleChange = (index) => ({ target: { checked } }) => {
        onChange(checked
            ? (0, utils_1.enumOptionsSelectValue)(index, checkboxesValues, enumOptions)
            : (0, utils_1.enumOptionsDeselectValue)(index, checkboxesValues, enumOptions));
    };
    const handleBlur = ({ target: { value: nextValue } }) => {
        onBlur(id, (0, utils_1.enumOptionsValueForIndex)(nextValue, enumOptions, emptyValue));
    };
    const handleFocus = ({ target: { value: nextValue } }) => {
        onFocus(id, (0, utils_1.enumOptionsValueForIndex)(nextValue, enumOptions, emptyValue));
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        fieldLabel ? (react_1.default.createElement(spring_ui_1.FormLabel, { id: id, label: fieldLabel, rootProps: {
                style: CHECKBOX_GROUP_LABEL_ROOT_STYLE,
            } })) : null,
        react_1.default.createElement("div", { id: id, className: containerClassName }, Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
                const checked = (0, utils_1.enumOptionsIsSelected)(option.value, checkboxesValues);
                const itemDisabled = Array.isArray(enumDisabled) &&
                    enumDisabled.indexOf(option.value) !== -1;
                const itemId = (0, utils_1.optionId)(id, index);
                return (react_1.default.createElement(spring_ui_1.FormLabel, { key: index, id: itemId, label: option.label },
                    react_1.default.createElement(spring_ui_1.Checkbox, { checked: checked, disabled: disabled || itemDisabled || readonly, 
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus: autofocus && index === 0, onChange: handleChange(index), onBlur: handleBlur, onFocus: handleFocus, "aria-describedby": (0, utils_1.ariaDescribedByIds)(id), inputProps: {
                            id: itemId,
                            name: id,
                            value: String(index),
                        } })));
            }))));
}
//# sourceMappingURL=CheckboxesWidget.js.map