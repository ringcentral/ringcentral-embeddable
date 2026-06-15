"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DateWidget;
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
const react_1 = __importDefault(require("react"));
function padDatePart(value) {
    return String(value).padStart(2, '0');
}
function parseDateValue(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }
    const [, year, month, day] = match;
    const date = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10));
    return Number.isNaN(date.getTime()) ? null : date;
}
function formatDateValue(value) {
    if (!value) {
        return undefined;
    }
    const year = value.getFullYear();
    const month = padDatePart(value.getMonth() + 1);
    const day = padDatePart(value.getDate());
    return `${year}-${month}-${day}`;
}
function DateWidget(props) {
    const { autofocus, disabled, hideLabel, id, label, name, onBlur, onChange, onFocus, placeholder, rawErrors = [], readonly, required, value, } = props;
    const dateValue = parseDateValue(value);
    const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
    const currentValue = formatDateValue(dateValue);
    return (react_1.default.createElement(spring_ui_1.DatePicker, { "data-sign": name, id: id, label: (0, utils_1.labelValue)(label, hideLabel || !label, false), value: dateValue, placeholder: placeholder, variant: "outlined", size: "large", fullWidth: true, autoFocus: autofocus, required: required, disabled: disabled || readonly, error: Boolean(errorMessage), helperText: errorMessage, onChange: (nextDate) => onChange(formatDateValue(nextDate)), onBlur: () => onBlur(id, currentValue), onFocus: () => onFocus(id, currentValue), inputProps: { 'aria-describedby': (0, utils_1.ariaDescribedByIds)(id) } }));
}
//# sourceMappingURL=DateWidget.js.map