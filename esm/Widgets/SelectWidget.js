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
import React from 'react';
import { MenuItemText, Option, Select, } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, enumOptionsIndexForValue, enumOptionsValueForIndex, labelValue, } from '@rjsf/utils';
export default function SelectWidget(_a) {
    var { id, name, options, label, hideLabel, required, disabled, readonly, placeholder, value, multiple, autofocus, onChange, onBlur, onFocus, rawErrors = [] } = _a, textFieldProps = __rest(_a, ["id", "name", "options", "label", "hideLabel", "required", "disabled", "readonly", "placeholder", "value", "multiple", "autofocus", "onChange", "onBlur", "onFocus", "rawErrors"]);
    const { enumOptions, enumDisabled, emptyValue: optEmptyVal } = options;
    const isMultiple = typeof multiple === 'undefined' ? false : !!multiple;
    const emptyValue = isMultiple ? [] : '';
    const isEmpty = typeof value === 'undefined' ||
        (isMultiple && value.length < 1) ||
        (!isMultiple && value === emptyValue);
    const selectedIndexes = enumOptionsIndexForValue(value, enumOptions, isMultiple);
    const getLabel = (index) => {
        if (typeof index === 'string' && (enumOptions === null || enumOptions === void 0 ? void 0 : enumOptions[Number.parseInt(index, 10)])) {
            return enumOptions[Number.parseInt(index, 10)].label;
        }
        return String(index !== null && index !== void 0 ? index : '');
    };
    const handleBlur = ({ target: { value: nextValue } }) => onBlur(id, enumOptionsValueForIndex(nextValue, enumOptions, optEmptyVal));
    const handleFocus = ({ target: { value: nextValue } }) => onFocus(id, enumOptionsValueForIndex(nextValue, enumOptions, optEmptyVal));
    return (React.createElement(Select, Object.assign({ variant: "outlined", "data-sign": name, id: id, name: id, label: labelValue(label, hideLabel || !label, false), value: !isEmpty && typeof selectedIndexes !== 'undefined' ? selectedIndexes : emptyValue, required: required, disabled: disabled || readonly, focused: autofocus, placeholder: placeholder, error: rawErrors.length > 0, onChange: ({ target: { value: nextValue } }) => {
            onChange(enumOptionsValueForIndex(nextValue, enumOptions, optEmptyVal));
        }, renderValue: (index) => {
            if (Array.isArray(index)) {
                return index.map(getLabel).join(', ');
            }
            return getLabel(index);
        }, onBlur: handleBlur, onFocus: handleFocus, size: "large", selectMode: isMultiple ? 'multiple' : 'single' }, textFieldProps, { "aria-describedby": ariaDescribedByIds(id) }), Array.isArray(enumOptions) &&
        enumOptions.map(({ value: optionValue, label: optionLabel, schema }, index) => {
            const isDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(optionValue) !== -1;
            return (React.createElement(Option, { key: index, value: String(index), disabled: isDisabled },
                React.createElement(MenuItemText, { primary: optionLabel, info: schema && schema.description })));
        })));
}
//# sourceMappingURL=SelectWidget.js.map