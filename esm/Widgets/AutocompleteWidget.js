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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, MenuItemText, SuggestionListItem, } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, labelValue, } from '@rjsf/utils';
export default function AutocompleteWidget({ id, label, hideLabel, placeholder, required, disabled, readonly, value, options, onChange, rawErrors = [], multiple, }) {
    const [autocompleteValue, setAutocompleteValue] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const isAutocompleteUpdating = useRef(false);
    const { enumOptions = [], placeholder: optionsPlaceholder } = options;
    const resolvedPlaceholder = placeholder !== null && placeholder !== void 0 ? placeholder : optionsPlaceholder;
    const autocompleteOptions = useMemo(() => (Array.isArray(enumOptions)
        ? enumOptions.map((option) => ({
            id: option.value,
            label: option.label,
            schema: option.schema,
            value: option.value,
        }))
        : []), [enumOptions]);
    useEffect(() => {
        if (Array.isArray(value)) {
            const nextValue = [];
            let nextInputValue = '';
            value.forEach((itemValue) => {
                const found = enumOptions.find((option) => option.value === itemValue);
                if (!found) {
                    nextInputValue = itemValue;
                    return;
                }
                nextValue.push({
                    id: found.value,
                    label: found.label,
                    schema: found.schema,
                    value: found.value,
                });
            });
            setAutocompleteValue(nextValue);
            setInputValue(nextInputValue);
            return;
        }
        const found = enumOptions.find((option) => option.value === value);
        if (found) {
            setAutocompleteValue([{
                    id: found.value,
                    label: found.label,
                    schema: found.schema,
                    value: found.value,
                }]);
            setInputValue('');
            return;
        }
        setAutocompleteValue([]);
        setInputValue(value || '');
    }, [value, enumOptions]);
    return (React.createElement(Autocomplete, { id: id, label: labelValue(label, hideLabel || !label, false), placeholder: resolvedPlaceholder, disabled: disabled || readonly, required: required, multiple: multiple, toggleButton: autocompleteOptions.length > 0, variant: "tags", options: autocompleteOptions.filter((option) => {
            if (!inputValue) {
                return true;
            }
            return (option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                option.value.toLowerCase().includes(inputValue.toLowerCase()));
        }), value: autocompleteValue, inputValue: inputValue, fullWidth: true, error: rawErrors.length > 0, onInputChange: (nextInputValue) => {
            setInputValue(nextInputValue);
            if (!isAutocompleteUpdating.current) {
                if (!multiple) {
                    onChange(nextInputValue);
                }
                else {
                    onChange(autocompleteValue.map((item) => item.value).concat(nextInputValue));
                }
            }
            isAutocompleteUpdating.current = false;
        }, onChange: (nextItems) => {
            isAutocompleteUpdating.current = true;
            const nextValue = Array.isArray(nextItems) ? nextItems : [];
            setAutocompleteValue(nextValue);
            if (!multiple) {
                onChange(nextValue.length > 0 ? nextValue[0].value : '');
                return;
            }
            onChange(nextValue.map((item) => item.value));
        }, onBlur: () => {
            if (!multiple) {
                onChange(autocompleteValue.length > 0 ? autocompleteValue[0].value : inputValue);
                return;
            }
            onChange(autocompleteValue.map((item) => item.value));
        }, renderOption: (item, state) => {
            const _a = item, { key, id: itemId, label: itemLabel, value: itemValue, schema: _schema } = _a, itemProps = __rest(_a, ["key", "id", "label", "value", "schema"]);
            return (React.createElement(SuggestionListItem, Object.assign({}, itemProps, { id: String(itemId !== null && itemId !== void 0 ? itemId : itemValue), key: key !== null && key !== void 0 ? key : `${itemId}-${state.index}`, highlighted: state.highlighted }),
                React.createElement(MenuItemText, { primary: itemLabel, info: itemValue })));
        }, "aria-describedby": ariaDescribedByIds(id) }));
}
//# sourceMappingURL=AutocompleteWidget.js.map