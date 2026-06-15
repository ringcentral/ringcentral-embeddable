"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DateTimeWidget;
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
const react_1 = __importDefault(require("react"));
function parseDateTimeValue(value) {
    if (typeof value !== 'string' || value.trim() === '') {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
function formatDateTimeValue(value) {
    return value ? value.toJSON() : undefined;
}
function mergeDateValue(currentValue, nextDate) {
    if (!nextDate) {
        return null;
    }
    const nextValue = currentValue ? new Date(currentValue) : new Date(nextDate);
    nextValue.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    return nextValue;
}
function mergeTimeValue(currentValue, nextTime) {
    if (!nextTime) {
        return null;
    }
    const nextValue = currentValue ? new Date(currentValue) : new Date();
    nextValue.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
    return nextValue;
}
function getStringOption(value, fallback) {
    return typeof value === 'string' ? value : fallback;
}
function DateTimeWidget(props) {
    const { autofocus, disabled, hideLabel, id, label, name, onBlur, onChange, onFocus, options, placeholder, rawErrors = [], readonly, required, value, } = props;
    const dateTimeValue = parseDateTimeValue(value);
    const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
    const isDisabled = disabled || readonly;
    const currentValue = formatDateTimeValue(dateTimeValue);
    const describedBy = (0, utils_1.ariaDescribedByIds)(id);
    const timeLabel = getStringOption(options === null || options === void 0 ? void 0 : options.timeLabel, 'Time');
    return (react_1.default.createElement("div", { style: { alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 12 } },
        react_1.default.createElement("span", { style: { flex: '1 1 160px', minWidth: 0 } },
            react_1.default.createElement(spring_ui_1.DatePicker, { "data-sign": name, id: `${id}__date`, label: (0, utils_1.labelValue)(label, hideLabel || !label, false), value: dateTimeValue, placeholder: placeholder, variant: "outlined", size: "large", fullWidth: true, autoFocus: autofocus, required: required, disabled: isDisabled, error: Boolean(errorMessage), helperText: errorMessage, onChange: (nextDate) => {
                    onChange(formatDateTimeValue(mergeDateValue(dateTimeValue, nextDate)));
                }, onBlur: () => onBlur(id, currentValue), onFocus: () => onFocus(id, currentValue), inputProps: { 'aria-describedby': describedBy } })),
        react_1.default.createElement("span", { style: { flex: '1 1 160px', minWidth: 0 } },
            react_1.default.createElement(spring_ui_1.TimePicker, { "data-sign": `${name}-time`, id: `${id}__time`, label: undefined, value: dateTimeValue, dateMode: true, variant: "outlined", size: "large", fullWidth: true, required: required, disabled: isDisabled, error: Boolean(errorMessage), onChange: (nextTime) => {
                    onChange(formatDateTimeValue(mergeTimeValue(dateTimeValue, nextTime)));
                }, onBlur: () => onBlur(id, currentValue), onFocus: () => onFocus(id, currentValue), inputProps: {
                    'aria-describedby': describedBy,
                    'aria-label': timeLabel,
                } }))));
}
//# sourceMappingURL=DateTimeWidget.js.map