import { DatePicker } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, labelValue, } from '@rjsf/utils';
import React from 'react';
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
export default function DateWidget(props) {
    const { autofocus, disabled, hideLabel, id, label, name, onBlur, onChange, onFocus, placeholder, rawErrors = [], readonly, required, value, } = props;
    const dateValue = parseDateValue(value);
    const errorMessage = rawErrors.length > 0 ? rawErrors[0] : undefined;
    const currentValue = formatDateValue(dateValue);
    return (React.createElement(DatePicker, { "data-sign": name, id: id, label: labelValue(label, hideLabel || !label, false), value: dateValue, placeholder: placeholder, variant: "outlined", size: "large", fullWidth: true, autoFocus: autofocus, required: required, disabled: disabled || readonly, error: Boolean(errorMessage), helperText: errorMessage, onChange: (nextDate) => onChange(formatDateValue(nextDate)), onBlur: () => onBlur(id, currentValue), onFocus: () => onFocus(id, currentValue), inputProps: { 'aria-describedby': ariaDescribedByIds(id) } }));
}
//# sourceMappingURL=DateWidget.js.map