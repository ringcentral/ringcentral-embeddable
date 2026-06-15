"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RangeWidget;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
function getFormFieldLabelClassName(hasError) {
    const classNames = [
        'sui-form-field-label',
        'sui-form-field-outlined-label',
    ];
    if (hasError) {
        classNames.push('sui-form-field-error-label');
    }
    return classNames.join(' ');
}
function getNumberOption(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value !== 'string' || value.trim() === '') {
        return undefined;
    }
    const numberValue = Number.parseFloat(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
}
function getFocusValue(event) {
    const target = event.target;
    const value = Number.parseFloat(target.value);
    return Number.isFinite(value) ? value : undefined;
}
function RangeWidget(props) {
    var _a;
    const { disabled, hideLabel, id, label, name, onBlur, onChange, onFocus, options, rawErrors = [], readonly, required, schema, value, } = props;
    const rangeOptions = (0, utils_1.rangeSpec)(schema);
    const fieldLabel = (0, utils_1.labelValue)(label, hideLabel || !label, false);
    const labelId = `${id}__label`;
    const hasError = rawErrors.length > 0;
    const step = (_a = getNumberOption(options === null || options === void 0 ? void 0 : options.step)) !== null && _a !== void 0 ? _a : rangeOptions.step;
    const handleChange = (_event, nextValue) => {
        onChange(nextValue !== null && nextValue !== void 0 ? nextValue : options.emptyValue);
    };
    const handleBlur = (event) => {
        onBlur(id, getFocusValue(event));
    };
    const handleFocus = (event) => {
        onFocus(id, getFocusValue(event));
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        fieldLabel ? (react_1.default.createElement("label", { id: labelId, className: getFormFieldLabelClassName(hasError), htmlFor: id },
            fieldLabel,
            required ? ' *' : '')) : null,
        react_1.default.createElement(spring_ui_1.Slider, { "aria-describedby": (0, utils_1.ariaDescribedByIds)(id), "aria-label": fieldLabel ? undefined : label || id, "aria-labelledby": fieldLabel ? labelId : undefined, "data-sign": name, disabled: disabled || readonly, id: id, max: rangeOptions.max, min: rangeOptions.min, name: id, onBlur: handleBlur, onChange: handleChange, onFocus: handleFocus, showColorAtRest: true, step: step, value: value, valueLabelDisplay: "auto" })));
}
//# sourceMappingURL=RangeWidget.js.map