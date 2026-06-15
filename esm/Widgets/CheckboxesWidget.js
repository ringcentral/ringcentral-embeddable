import React from 'react';
import { Checkbox, FormLabel } from '@ringcentral/spring-ui';
import { ariaDescribedByIds, enumOptionsDeselectValue, enumOptionsIsSelected, enumOptionsSelectValue, enumOptionsValueForIndex, labelValue, optionId, } from '@rjsf/utils';
const CHECKBOX_GROUP_LABEL_ROOT_STYLE = {
    marginBottom: 'var(--sui-spacing-2)',
};
export default function CheckboxesWidget({ label, hideLabel, id, disabled, options, value, autofocus, readonly, onChange, onBlur, onFocus, }) {
    const { enumOptions, enumDisabled, inline, emptyValue } = options;
    const checkboxesValues = Array.isArray(value) ? value : [value];
    const containerClassName = inline
        ? 'flex flex-wrap gap-x-4 gap-y-2'
        : 'flex flex-col gap-2';
    const fieldLabel = labelValue(label, hideLabel, false);
    const handleChange = (index) => ({ target: { checked } }) => {
        onChange(checked
            ? enumOptionsSelectValue(index, checkboxesValues, enumOptions)
            : enumOptionsDeselectValue(index, checkboxesValues, enumOptions));
    };
    const handleBlur = ({ target: { value: nextValue } }) => {
        onBlur(id, enumOptionsValueForIndex(nextValue, enumOptions, emptyValue));
    };
    const handleFocus = ({ target: { value: nextValue } }) => {
        onFocus(id, enumOptionsValueForIndex(nextValue, enumOptions, emptyValue));
    };
    return (React.createElement(React.Fragment, null,
        fieldLabel ? (React.createElement(FormLabel, { id: id, label: fieldLabel, rootProps: {
                style: CHECKBOX_GROUP_LABEL_ROOT_STYLE,
            } })) : null,
        React.createElement("div", { id: id, className: containerClassName }, Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
                const checked = enumOptionsIsSelected(option.value, checkboxesValues);
                const itemDisabled = Array.isArray(enumDisabled) &&
                    enumDisabled.indexOf(option.value) !== -1;
                const itemId = optionId(id, index);
                return (React.createElement(FormLabel, { key: index, id: itemId, label: option.label },
                    React.createElement(Checkbox, { checked: checked, disabled: disabled || itemDisabled || readonly, 
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus: autofocus && index === 0, onChange: handleChange(index), onBlur: handleBlur, onFocus: handleFocus, "aria-describedby": ariaDescribedByIds(id), inputProps: {
                            id: itemId,
                            name: id,
                            value: String(index),
                        } })));
            }))));
}
//# sourceMappingURL=CheckboxesWidget.js.map