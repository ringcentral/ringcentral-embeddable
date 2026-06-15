"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Typography = Typography;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
const compat_1 = require("../utils/compat");
function getStringValue(value) {
    return typeof value === 'string' ? value : undefined;
}
function joinClassNames(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
function Typography({ schema, uiSchema = {} }) {
    const isBulletedList = Boolean(uiSchema['ui:bulletedList']);
    const variant = getStringValue(uiSchema['ui:variant']);
    const className = joinClassNames('m-0 text-neutral-b1 [overflow-wrap:anywhere]', (0, compat_1.getTypographyClassName)(variant), isBulletedList ? 'list-disc list-outside !overflow-visible' : 'mt-[5px]');
    return (react_1.default.createElement(spring_ui_1.Text, { component: (0, compat_1.getTypographyComponent)(variant, isBulletedList), className: className },
        react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: schema.description })));
}
//# sourceMappingURL=Typography.js.map