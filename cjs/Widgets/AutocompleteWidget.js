"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AutocompleteWidget;
const react_1 = __importStar(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
function AutocompleteWidget({ id, label, hideLabel, placeholder, required, disabled, readonly, value, options, onChange, rawErrors = [], multiple, }) {
    const [autocompleteValue, setAutocompleteValue] = (0, react_1.useState)([]);
    const [inputValue, setInputValue] = (0, react_1.useState)('');
    const isAutocompleteUpdating = (0, react_1.useRef)(false);
    const { enumOptions = [], placeholder: optionsPlaceholder } = options;
    const resolvedPlaceholder = placeholder !== null && placeholder !== void 0 ? placeholder : optionsPlaceholder;
    const autocompleteOptions = (0, react_1.useMemo)(() => (Array.isArray(enumOptions)
        ? enumOptions.map((option) => ({
            id: option.value,
            label: option.label,
            schema: option.schema,
            value: option.value,
        }))
        : []), [enumOptions]);
    (0, react_1.useEffect)(() => {
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
    return (react_1.default.createElement(spring_ui_1.Autocomplete, { id: id, label: (0, utils_1.labelValue)(label, hideLabel || !label, false), placeholder: resolvedPlaceholder, disabled: disabled || readonly, required: required, multiple: multiple, toggleButton: autocompleteOptions.length > 0, variant: "tags", options: autocompleteOptions.filter((option) => {
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
            return (react_1.default.createElement(spring_ui_1.SuggestionListItem, Object.assign({}, itemProps, { id: String(itemId !== null && itemId !== void 0 ? itemId : itemValue), key: key !== null && key !== void 0 ? key : `${itemId}-${state.index}`, highlighted: state.highlighted }),
                react_1.default.createElement(spring_ui_1.MenuItemText, { primary: itemLabel, info: itemValue })));
        }, "aria-describedby": (0, utils_1.ariaDescribedByIds)(id) }));
}
//# sourceMappingURL=AutocompleteWidget.js.map