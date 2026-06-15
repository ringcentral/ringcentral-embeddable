import { TimePicker } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, labelValue, } from '@rjsf/utils';
import React from 'react';
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
function padTimePart(value) {
    return String(value).padStart(2, '0');
}
function parseTimeValue(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
    if (!match) {
        return null;
    }
    const [, hours, minutes] = match;
    const hourValue = Number.parseInt(hours, 10);
    const minuteValue = Number.parseInt(minutes, 10);
    if (hourValue > 23 || minuteValue > 59) {
        return null;
    }
    return hourValue * ONE_HOUR + minuteValue * ONE_MINUTE;
}
function formatTimeValue(value) {
    if (value === null) {
        return undefined;
    }
    const totalMinutes = Math.floor(value / ONE_MINUTE);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${padTimePart(hours)}:${padTimePart(minutes)}:00`;
}
export default function TimeWidget(props) {
    const { autofocus, disabled, hideLabel, id, label, name, onBlur, onChange, onFocus, rawErrors = [], readonly, required, value, } = props;
    const timeValue = parseTimeValue(value);
    const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
    const currentValue = formatTimeValue(timeValue);
    return (React.createElement(TimePicker, { "data-sign": name, id: id, label: labelValue(label, hideLabel || !label, false), value: timeValue, variant: "outlined", size: "large", fullWidth: true, autoFocus: autofocus, required: required, disabled: disabled || readonly, error: Boolean(errorMessage), helperText: errorMessage, onChange: (nextTime) => onChange(formatTimeValue(nextTime)), onBlur: () => onBlur(id, currentValue), onFocus: () => onFocus(id, currentValue), inputProps: { 'aria-describedby': ariaDescribedByIds(id) } }));
}
//# sourceMappingURL=TimeWidget.js.map