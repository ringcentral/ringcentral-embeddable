import React from 'react';
import { FormLabel, Radio, RadioGroup, Tab, TabContext, Tabs, } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, enumOptionsIndexForValue, enumOptionsValueForIndex, labelValue, } from '@rjsf/utils';
const RADIO_GROUP_LABEL_ROOT_STYLE = {
    marginBottom: 'var(--sui-spacing-2)',
};
function getHexColorValue(color) {
    if (typeof color !== 'string') {
        return undefined;
    }
    const hexColor = color.trim();
    const shortHexColorMatch = /^#([0-9a-f]{3})$/i.exec(hexColor);
    const longHexColorMatch = /^#([0-9a-f]{6})$/i.exec(hexColor);
    const hexValue = shortHexColorMatch
        ? shortHexColorMatch[1].replace(/[0-9a-f]/gi, (value) => value + value)
        : longHexColorMatch === null || longHexColorMatch === void 0 ? void 0 : longHexColorMatch[1];
    if (!hexValue) {
        return undefined;
    }
    const red = Number.parseInt(hexValue.slice(0, 2), 16);
    const green = Number.parseInt(hexValue.slice(2, 4), 16);
    const blue = Number.parseInt(hexValue.slice(4, 6), 16);
    return {
        color: hexColor,
        channels: `${red}, ${green}, ${blue}`,
    };
}
function getRadioOptionColorStyle(option) {
    const optionSchema = option.schema;
    const colorValue = getHexColorValue(optionSchema === null || optionSchema === void 0 ? void 0 : optionSchema.color);
    if (!colorValue) {
        return undefined;
    }
    return {
        '--s-primary-f': colorValue.channels,
        '--s-primary-f-high-contrast': colorValue.channels,
        '--s-primary-f-opacity': '1',
        '--s-primary-f-high-contrast-opacity': '1',
        borderColor: colorValue.color,
    };
}
export default function RadioWidget({ id, options, value, required, disabled, readonly, label, hideLabel, onChange, onBlur, onFocus, uiSchema = {}, }) {
    const { enumOptions, enumDisabled, emptyValue } = options;
    const rawSelectedIndex = enumOptionsIndexForValue(value, enumOptions);
    const selectedIndex = Array.isArray(rawSelectedIndex)
        ? rawSelectedIndex[0]
        : rawSelectedIndex;
    const selectedValue = selectedIndex !== null && selectedIndex !== void 0 ? selectedIndex : null;
    const fieldLabel = labelValue(label, hideLabel, false);
    const handleChange = (nextValue) => {
        onChange(enumOptionsValueForIndex(String(nextValue), enumOptions, emptyValue));
    };
    const handleTabChange = (_event, nextValue) => {
        handleChange(nextValue);
    };
    const handleBlur = ({ target: { value: nextValue } }) => onBlur(id, enumOptionsValueForIndex(nextValue, enumOptions, emptyValue));
    const handleFocus = ({ target: { value: nextValue } }) => onFocus(id, enumOptionsValueForIndex(nextValue, enumOptions, emptyValue));
    if (uiSchema['ui:tab']) {
        return (React.createElement(TabContext, { value: selectedValue, onChange: handleTabChange },
            React.createElement(Tabs, { variant: "standard", size: "medium" }, Array.isArray(enumOptions) &&
                enumOptions.map((option, index) => {
                    const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
                    return (React.createElement(Tab, { key: index, id: `${id}__tab-${index}`, label: option.label, value: String(index), disabled: disabled || itemDisabled || readonly }));
                }))));
    }
    return (React.createElement(React.Fragment, null,
        fieldLabel ? (React.createElement(FormLabel, { id: id, label: required ? `${fieldLabel} *` : fieldLabel, rootProps: {
                style: RADIO_GROUP_LABEL_ROOT_STYLE,
            } })) : null,
        React.createElement(RadioGroup, { id: id, name: id, value: selectedIndex, row: !!options.inline, onChange: (event) => handleChange(event.target.value), onBlur: handleBlur, onFocus: handleFocus, "aria-describedby": ariaDescribedByIds(id), style: { flexDirection: uiSchema['ui:itemDirection'] } }, Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
                const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
                const showValueLabel = typeof uiSchema['ui:valueLabel'] === 'undefined' ? true : uiSchema['ui:valueLabel'];
                const radioColorStyle = getRadioOptionColorStyle(option);
                return (React.createElement(FormLabel, { key: index, label: showValueLabel ? option.label : undefined, value: String(index), disabled: disabled || itemDisabled || readonly },
                    React.createElement(Radio, { name: id, rootProps: radioColorStyle
                            ? {
                                style: radioColorStyle,
                            }
                            : undefined })));
            }))));
}
//# sourceMappingURL=RadioWidget.js.map