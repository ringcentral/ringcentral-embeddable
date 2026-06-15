"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextWithMarkdown = exports.ActionMenu = void 0;
exports.JSONSchemaPage = JSONSchemaPage;
const react_1 = __importDefault(require("react"));
const core_1 = require("@rjsf/core");
const Fields_1 = require("./Fields");
const Templates_1 = require("./Templates");
const Widgets_1 = require("./Widgets");
const validator_1 = require("./validator");
const ActionMenu_1 = require("./components/ActionMenu");
Object.defineProperty(exports, "ActionMenu", { enumerable: true, get: function () { return ActionMenu_1.ActionMenu; } });
const TextWithMarkdown_1 = require("./components/TextWithMarkdown");
Object.defineProperty(exports, "TextWithMarkdown", { enumerable: true, get: function () { return TextWithMarkdown_1.TextWithMarkdown; } });
const theme = { widgets: Widgets_1.widgets, templates: Templates_1.templates };
const Form = (0, core_1.withTheme)(theme);
const validator = new validator_1.Validator();
function JSONSchemaPage({ schema, uiSchema = {}, formData, onFormDataChange, onButtonClick, hiddenSubmitButton = true, onSubmit, }) {
    let formUISchema = uiSchema;
    if (hiddenSubmitButton) {
        formUISchema = Object.assign(Object.assign({}, formUISchema), { 'ui:submitButtonOptions': {
                norender: true,
            } });
    }
    else if (formUISchema.submitButtonOptions) {
        formUISchema = Object.assign(Object.assign({}, formUISchema), { 'ui:submitButtonOptions': Object.assign({}, formUISchema.submitButtonOptions) });
    }
    return (react_1.default.createElement(Form, { schema: schema, validator: validator, formData: formData, onChange: (event) => {
            onFormDataChange(event.formData);
        }, uiSchema: formUISchema, fields: Fields_1.fields, onFocus: (name, value) => {
            if (value === '$$clicked') {
                onButtonClick === null || onButtonClick === void 0 ? void 0 : onButtonClick(name);
            }
        }, onSubmit: onSubmit }));
}
//# sourceMappingURL=index.js.map