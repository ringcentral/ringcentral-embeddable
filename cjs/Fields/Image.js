"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = Image;
const react_1 = __importDefault(require("react"));
function Image({ schema, uiSchema = {}, formData, onFocus, name, }) {
    const src = formData || uiSchema['ui:src'] || schema.default;
    const alt = uiSchema['ui:alt'] || schema.title || '';
    const clickable = uiSchema['ui:clickable'] || false;
    const customStyle = uiSchema['ui:style'] || {};
    if (!src) {
        return null;
    }
    return (react_1.default.createElement("img", { src: src, alt: alt, style: Object.assign(Object.assign({ display: 'block', maxWidth: '100%', height: 'auto' }, customStyle), { cursor: clickable ? 'pointer' : customStyle.cursor }), onClick: clickable ? () => onFocus(name, '$$clicked') : undefined }));
}
//# sourceMappingURL=Image.js.map