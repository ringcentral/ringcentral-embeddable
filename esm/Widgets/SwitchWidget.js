import React from 'react';
import { ariaDescribedByIds, descriptionId, labelValue, schemaRequiresTrueValue, } from '@rjsf/utils';
import { Switch, Text } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
const switchTransformDefaults = {
    '--tw-translate-y': '0',
    '--tw-rotate': '0',
    '--tw-skew-x': '0',
    '--tw-skew-y': '0',
    '--tw-scale-x': '1',
    '--tw-scale-y': '1',
};
export default function SwitchWidget(props) {
    var _a;
    const { autofocus, disabled, hideLabel, id, label = '', name, onBlur, onChange, onFocus, options, readonly, schema, uiSchema, value, } = props;
    const required = schemaRequiresTrueValue(schema);
    const description = (_a = options.description) !== null && _a !== void 0 ? _a : schema.description;
    const labelContent = labelValue(label, hideLabel, false);
    const isDisabled = disabled || readonly;
    const checked = typeof value === 'undefined' ? false : Boolean(value);
    const handleBlur = ({ target: { checked: nextChecked } }) => {
        onBlur(id, nextChecked);
    };
    const handleFocus = ({ target: { checked: nextChecked } }) => {
        onFocus(id, nextChecked);
    };
    return (React.createElement("div", { className: "flex w-full items-center justify-between gap-3" },
        !hideLabel ? (React.createElement("label", { htmlFor: id, className: "min-w-0 flex-1 cursor-pointer" },
            labelContent ? (React.createElement(Text, { className: "typography-mainText", component: "div" }, labelContent)) : null,
            description ? (React.createElement(Text, { id: descriptionId(id), className: "typography-descriptor", component: "div", style: {
                    color: (uiSchema === null || uiSchema === void 0 ? void 0 : uiSchema['ui:disabled'])
                        ? 'var(--sui-colors-neutral-b3)'
                        : 'var(--sui-colors-neutral-b2)',
                } }, typeof description === 'string' ? (React.createElement(TextWithMarkdown, { text: description })) : (description))) : null)) : null,
        React.createElement(Switch, { className: "shrink-0", rootProps: {
                style: switchTransformDefaults,
            }, checked: checked, required: required, disabled: isDisabled, autoFocus: autofocus, onChange: (event) => onChange(event.target.checked), onBlur: handleBlur, onFocus: handleFocus, inputProps: {
                'aria-describedby': ariaDescribedByIds(id),
                'aria-label': hideLabel && label ? label : undefined,
                id,
                name,
            } })));
}
//# sourceMappingURL=SwitchWidget.js.map