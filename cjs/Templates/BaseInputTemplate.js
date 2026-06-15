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
exports.default = BaseInputTemplate;
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
const react_1 = __importDefault(require("react"));
const nativeTextFieldTypes = [
    'date',
    'datetime-local',
    'email',
    'number',
    'password',
    'search',
    'tel',
    'text',
    'time',
    'url',
];
function getDefaultInputType(schema, type) {
    const isNumericSchema = schema.type === 'number' || schema.type === 'integer';
    if (isNumericSchema && type === 'text') {
        return undefined;
    }
    return type;
}
function getTextFieldType(type) {
    if (nativeTextFieldTypes.includes(type)) {
        return type;
    }
    return 'text';
}
function BaseInputTemplate(props) {
    const { id, name, placeholder, required, readonly, disabled, type, label, hideLabel, hideError, value, onChange, onChangeOverride, onBlur, onFocus, autofocus, options, schema, uiSchema, rawErrors = [], formContext, registry, InputLabelProps } = props, textFieldProps = __rest(props, ["id", "name", "placeholder", "required", "readonly", "disabled", "type", "label", "hideLabel", "hideError", "value", "onChange", "onChangeOverride", "onBlur", "onFocus", "autofocus", "options", "schema", "uiSchema", "rawErrors", "formContext", "registry", "InputLabelProps"]);
    const inputProps = (0, utils_1.getInputProps)(schema, getDefaultInputType(schema, type), options);
    const { step, min, max, type: inputType } = inputProps, rest = __rest(inputProps, ["step", "min", "max", "type"]);
    const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
    const handleChange = ({ target: { value: inputValue } }) => {
        onChange(inputValue);
    };
    const handleBlur = ({ target: { value: inputValue } }) => {
        onBlur(id, inputValue);
    };
    const handleFocus = ({ target: { value: inputValue } }) => {
        onFocus(id, inputValue);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(spring_ui_1.TextField, Object.assign({ "data-sign": name, id: id, placeholder: placeholder, label: (0, utils_1.labelValue)(label || undefined, hideLabel, false), fullWidth: true, 
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus: autofocus, required: required, disabled: disabled || readonly, inputProps: Object.assign({ step,
                min,
                max }, (schema.examples ? { list: (0, utils_1.examplesId)(id) } : undefined)) }, rest, { value: value || value === 0 ? value : '', error: Boolean(errorMessage), helperText: errorMessage, onChange: onChangeOverride || handleChange, onBlur: handleBlur, onFocus: handleFocus }, textFieldProps, { size: "large", type: getTextFieldType(inputType), "aria-describedby": (0, utils_1.ariaDescribedByIds)(id, !!schema.examples) })),
        Array.isArray(schema.examples) ? (react_1.default.createElement("datalist", { id: (0, utils_1.examplesId)(id) }, schema.examples
            .concat(schema.default && !schema.examples.includes(schema.default)
            ? [schema.default]
            : [])
            .map((example) => {
            return react_1.default.createElement("option", { key: example, value: example });
        }))) : null));
}
//# sourceMappingURL=BaseInputTemplate.js.map