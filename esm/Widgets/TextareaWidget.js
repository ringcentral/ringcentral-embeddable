import { Textarea } from '@ringcentral/spring-ui';
import React, { useMemo, } from 'react';
export default function TextareaWidget(props) {
    const { id, name, value, onChange, onChangeOverride, onBlur, onFocus, options, } = props;
    const handleChange = ({ target: { value: nextValue } }) => {
        onChange(nextValue);
    };
    const handleBlur = ({ target: { value: nextValue }, }) => {
        onBlur(id, nextValue);
    };
    const handleFocus = ({ target: { value: nextValue }, }) => {
        onFocus(id, nextValue);
    };
    const inputProps = useMemo(() => (Object.assign({ 'data-sign': name }, props.inputProps)), [name, props.inputProps]);
    return (React.createElement(Textarea, Object.assign({}, props, { inputProps: inputProps, onChange: onChangeOverride || handleChange, onBlur: handleBlur, onFocus: handleFocus, value: value !== null && value !== void 0 ? value : '', minRows: 4, maxRows: 12, rows: options.rows, fullWidth: true, defaultValue: props.defaultValue, clearBtn: false, variant: "outlined", size: "large" })));
}
//# sourceMappingURL=TextareaWidget.js.map