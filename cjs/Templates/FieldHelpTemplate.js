"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FieldHelpTemplate;
const spring_ui_1 = require("@ringcentral/spring-ui");
const utils_1 = require("@rjsf/utils");
const react_1 = __importDefault(require("react"));
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
function FieldHelpTemplate({ help, idSchema }) {
    if (!help) {
        return null;
    }
    return (react_1.default.createElement(spring_ui_1.Text, { id: (0, utils_1.helpId)(idSchema), className: "typography-descriptor", component: "div", style: { color: 'var(--sui-colors-neutral-b2)' } }, typeof help === 'string' ? react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: help }) : help));
}
//# sourceMappingURL=FieldHelpTemplate.js.map