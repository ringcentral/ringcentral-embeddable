"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = Link;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
const compat_1 = require("../utils/compat");
function Link({ schema, uiSchema = {}, disabled, onFocus, name, }) {
    const href = uiSchema['ui:href'] || undefined;
    const isBulletedList = uiSchema['ui:bulletedList'];
    const component = isBulletedList ? 'li' : 'a';
    return (react_1.default.createElement(spring_ui_1.Link, { component: component, variant: (0, compat_1.getLinkVariant)(uiSchema['ui:variant'], uiSchema['ui:color']), underline: uiSchema['ui:underline'] || 'hover', href: href, target: "_blank", rel: "noopener noreferrer", style: {
            opacity: disabled ? 0.5 : undefined,
            pointerEvents: disabled ? 'none' : undefined,
        }, onClick: () => {
            if (disabled) {
                return;
            }
            if (!href) {
                onFocus(name, '$$clicked');
                return;
            }
            if (component !== 'a') {
                window.open(href, '_blank');
            }
        } },
        react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: schema.description })));
}
//# sourceMappingURL=Link.js.map