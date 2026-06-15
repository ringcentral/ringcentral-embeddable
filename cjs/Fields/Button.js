"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = Button;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const compat_1 = require("../utils/compat");
function Button({ schema, uiSchema = {}, onFocus, disabled, name, }) {
    return (react_1.default.createElement(spring_ui_1.Button, { variant: (0, compat_1.getButtonVariant)(uiSchema['ui:variant']), onClick: () => {
            onFocus(name, '$$clicked');
        }, fullWidth: uiSchema['ui:fullWidth'], disabled: disabled || uiSchema['ui:disabled'], color: (0, compat_1.getButtonColor)(uiSchema['ui:color']) }, schema.title));
}
//# sourceMappingURL=Button.js.map