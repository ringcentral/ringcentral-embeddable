"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = Alert;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
function Alert({ schema, uiSchema = {} }) {
    return (react_1.default.createElement(spring_ui_1.Alert, { severity: uiSchema['ui:severity'] || 'info', style: { padding: 10 } },
        react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: schema.description })));
}
//# sourceMappingURL=Alert.js.map