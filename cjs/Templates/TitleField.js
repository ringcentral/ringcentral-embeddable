"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TitleField;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const spring_icon_1 = require("@ringcentral/spring-icon");
function TitleField({ id, title, uiSchema = {}, extended = false, onClick, }) {
    const isCollapsible = uiSchema['ui:collapsible'] || false;
    const isDisabled = uiSchema['ui:disabled'] || false;
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { id: id, style: {
                alignItems: 'center',
                cursor: isCollapsible ? 'pointer' : 'default',
                display: 'flex',
                margin: '8px 0',
                overflow: 'hidden',
            }, onClick: onClick },
            react_1.default.createElement(spring_ui_1.Text, { className: extended ? 'typography-subtitle' : 'typography-mainText', component: "div", style: {
                    color: isDisabled ? 'var(--sui-colors-neutral-b3)' : undefined,
                    flex: 1,
                } }, title),
            isCollapsible ? react_1.default.createElement(spring_ui_1.Icon, { symbol: extended ? spring_icon_1.CaretUpMd : spring_icon_1.CaretDownMd, size: "small" }) : null),
        isCollapsible ? react_1.default.createElement(spring_ui_1.Divider, null) : null));
}
//# sourceMappingURL=TitleField.js.map