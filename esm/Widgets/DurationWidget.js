import React from 'react';
import { ariaDescribedByIds, labelValue, } from '@rjsf/utils';
import { FormLabel, Text, TextField, } from '@ringcentral/spring-ui';
const DURATION_REGEX = /^P(?=\d|T\d)(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?)?$/i;
function isFilled(value) {
    return value.trim() !== '';
}
function normalizePart(value) {
    const trimmedValue = value.trim();
    if (!isFilled(trimmedValue) || !/^\d+$/.test(trimmedValue)) {
        return null;
    }
    const parsedValue = Number.parseInt(trimmedValue, 10);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return null;
    }
    return parsedValue;
}
function parseDurationValue(value) {
    if (!value) {
        return { hours: '', minutes: '' };
    }
    const match = value.match(DURATION_REGEX);
    if (!match) {
        return { hours: '', minutes: '' };
    }
    const [, days, hours, minutes] = match;
    const parsedDays = Number.parseInt(days !== null && days !== void 0 ? days : '0', 10);
    const parsedHours = Number.parseInt(hours !== null && hours !== void 0 ? hours : '0', 10);
    const parsedMinutes = Number.parseInt(minutes !== null && minutes !== void 0 ? minutes : '0', 10);
    const totalHours = parsedDays * 24 + parsedHours;
    return {
        hours: days !== undefined || hours !== undefined ? `${totalHours}` : '',
        minutes: minutes !== undefined ? `${parsedMinutes}` : '',
    };
}
function buildDurationValue(hoursValue, minutesValue) {
    const normalizedHours = normalizePart(hoursValue);
    const normalizedMinutes = normalizePart(minutesValue);
    if (normalizedHours === null && normalizedMinutes === null) {
        return undefined;
    }
    const totalMinutes = (normalizedHours !== null && normalizedHours !== void 0 ? normalizedHours : 0) * 60 + (normalizedMinutes !== null && normalizedMinutes !== void 0 ? normalizedMinutes : 0);
    const displayHours = Math.floor(totalMinutes / 60);
    const displayMinutes = totalMinutes % 60;
    const durationParts = [];
    if (displayHours > 0) {
        durationParts.push(`${displayHours}H`);
    }
    if (displayMinutes > 0 || durationParts.length === 0) {
        durationParts.push(`${displayMinutes}M`);
    }
    return `PT${durationParts.join('')}`;
}
export default function DurationWidget(props) {
    var _a;
    const { id, label, hideLabel, required, disabled, readonly, value, onChange, onBlur, onFocus, options, rawErrors = [], } = props;
    const { hours, minutes } = parseDurationValue(typeof value === 'string' ? value : undefined);
    const minuteStep = Math.max(Number.parseInt(String((_a = options === null || options === void 0 ? void 0 : options.minuteStep) !== null && _a !== void 0 ? _a : 1), 10) || 1, 1);
    const hoursLabel = typeof (options === null || options === void 0 ? void 0 : options.hoursLabel) === 'string' ? options.hoursLabel : 'Hours';
    const minutesLabel = typeof (options === null || options === void 0 ? void 0 : options.minutesLabel) === 'string' ? options.minutesLabel : 'Minutes';
    const hoursUnitLabel = typeof (options === null || options === void 0 ? void 0 : options.hoursUnitLabel) === 'string' ? options.hoursUnitLabel : 'hour';
    const minutesUnitLabel = typeof (options === null || options === void 0 ? void 0 : options.minutesUnitLabel) === 'string' ? options.minutesUnitLabel : 'min';
    const isDisabled = disabled || readonly;
    const describedBy = ariaDescribedByIds(id);
    const emitChange = (nextHours, nextMinutes) => {
        onChange(buildDurationValue(nextHours, nextMinutes));
    };
    const emitBlur = (nextHours, nextMinutes) => {
        onBlur(id, buildDurationValue(nextHours, nextMinutes));
    };
    const emitFocus = (nextHours, nextMinutes) => {
        onFocus(id, buildDurationValue(nextHours, nextMinutes));
    };
    return (React.createElement(React.Fragment, null,
        labelValue(React.createElement(FormLabel, { htmlFor: `${id}__hours`, label: label || undefined }), hideLabel),
        React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 12 } },
            React.createElement("span", { style: { flex: '1 1 140px', minWidth: 0 } },
                React.createElement(TextField, { id: `${id}__hours`, type: "number", size: "large", value: hours, placeholder: "0", fullWidth: true, disabled: isDisabled, required: required, error: rawErrors.length > 0, onChange: ({ target: { value: nextHours } }) => emitChange(nextHours, minutes), onBlur: ({ target: { value: nextHours } }) => emitBlur(nextHours, minutes), onFocus: ({ target: { value: nextHours } }) => emitFocus(nextHours, minutes), inputProps: { min: 0, step: 1, 'aria-label': hoursLabel }, endAdornment: React.createElement(Text, { className: "typography-descriptor" }, hoursUnitLabel), "aria-describedby": describedBy, clearBtn: false })),
            React.createElement("span", { style: { flex: '1 1 140px', minWidth: 0 } },
                React.createElement(TextField, { id: `${id}__minutes`, type: "number", size: "large", value: minutes, placeholder: "0", fullWidth: true, disabled: isDisabled, required: required, clearBtn: false, error: rawErrors.length > 0, onChange: ({ target: { value: nextMinutes } }) => emitChange(hours, nextMinutes), onBlur: ({ target: { value: nextMinutes } }) => emitBlur(hours, nextMinutes), onFocus: ({ target: { value: nextMinutes } }) => emitFocus(hours, nextMinutes), inputProps: { min: 0, step: minuteStep, 'aria-label': minutesLabel }, endAdornment: React.createElement(Text, { className: "typography-descriptor" }, minutesUnitLabel), "aria-describedby": describedBy })))));
}
//# sourceMappingURL=DurationWidget.js.map