"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BooleanField;
const react_1 = __importDefault(require("react"));
const isObject_1 = __importDefault(require("lodash/isObject"));
const utils_1 = require("@rjsf/utils");
function BooleanField(props) {
    var _a, _b, _c;
    const { autofocus, disabled, formData, hideError, idSchema, name, onBlur, onChange, onFocus, rawErrors, readonly, registry, required, schema, title, uiSchema, } = props;
    const { formContext, globalUiOptions, translateString, widgets } = registry;
    const _d = (0, utils_1.getUiOptions)(uiSchema, globalUiOptions), { label: displayLabel = true, title: uiTitle, widget = 'switch' } = _d, options = __rest(_d, ["label", "title", "widget"]);
    const Widget = (0, utils_1.getWidget)(schema, widget, widgets);
    const yes = translateString(utils_1.TranslatableString.YesLabel);
    const no = translateString(utils_1.TranslatableString.NoLabel);
    let enumOptions;
    const label = (_b = (_a = uiTitle !== null && uiTitle !== void 0 ? uiTitle : schema.title) !== null && _a !== void 0 ? _a : title) !== null && _b !== void 0 ? _b : name;
    if (Array.isArray(schema.oneOf)) {
        enumOptions = (0, utils_1.optionsList)({
            oneOf: schema.oneOf
                .map((option) => {
                if (!(0, isObject_1.default)(option)) {
                    return undefined;
                }
                const schemaOption = option;
                return Object.assign(Object.assign({}, schemaOption), { title: schemaOption.title || (schemaOption.const === true ? yes : no) });
            })
                .filter((option) => Boolean(option)),
        }, uiSchema);
    }
    else {
        const schemaWithEnumNames = schema;
        const enums = (_c = schema.enum) !== null && _c !== void 0 ? _c : [true, false];
        if (!schemaWithEnumNames.enumNames &&
            enums.length === 2 &&
            enums.every((enumValue) => typeof enumValue === 'boolean')) {
            enumOptions = [
                {
                    label: enums[0] ? yes : no,
                    value: enums[0],
                },
                {
                    label: enums[1] ? yes : no,
                    value: enums[1],
                },
            ];
        }
        else {
            enumOptions = (0, utils_1.optionsList)({
                enum: enums,
                enumNames: schemaWithEnumNames.enumNames,
            }, uiSchema);
        }
    }
    return (react_1.default.createElement(Widget, { autofocus: autofocus, disabled: disabled, formContext: formContext, hideError: hideError, hideLabel: !displayLabel, id: idSchema.$id, label: label, name: name, onBlur: onBlur, onChange: onChange, onFocus: onFocus, options: Object.assign(Object.assign({}, options), { enumOptions }), rawErrors: rawErrors, readonly: readonly, registry: registry, required: required, schema: schema, uiSchema: uiSchema, value: formData }));
}
//# sourceMappingURL=BooleanField.js.map