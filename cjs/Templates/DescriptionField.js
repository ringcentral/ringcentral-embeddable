"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DescriptionField;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
function DescriptionField(props) {
    const { id, description, style = {}, uiSchema = {} } = props;
    if (!description) {
        return null;
    }
    const isDisabled = uiSchema['ui:disabled'] || false;
    return (react_1.default.createElement(spring_ui_1.Text, { id: id, className: "typography-descriptor", component: "div", style: Object.assign({ color: isDisabled ? 'var(--sui-colors-neutral-b3)' : 'var(--sui-colors-neutral-b2)' }, style) }, typeof description === 'string' ? react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: description }) : description));
}
//# sourceMappingURL=DescriptionField.js.map