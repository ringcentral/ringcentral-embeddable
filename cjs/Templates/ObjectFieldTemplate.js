"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ObjectFieldTemplate;
const react_1 = __importStar(require("react"));
const utils_1 = require("@rjsf/utils");
function ObjectFieldTemplate(props) {
    const { description, title, properties, required, disabled, readonly, uiSchema = {}, idSchema, schema, formData, onAddClick, registry, } = props;
    const uiOptions = (0, utils_1.getUiOptions)(uiSchema);
    const TitleFieldTemplate = (0, utils_1.getTemplate)('TitleFieldTemplate', registry, uiOptions);
    const DescriptionFieldTemplate = (0, utils_1.getTemplate)('DescriptionFieldTemplate', registry, uiOptions);
    const { ButtonTemplates: { AddButton }, } = registry.templates;
    const isCollapsible = uiOptions.collapsible || false;
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(isCollapsible ? false : true);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        title ? (react_1.default.createElement(TitleFieldTemplate, { id: (0, utils_1.titleId)(idSchema), title: title, required: required, schema: schema, uiSchema: uiSchema, registry: registry, extended: isExpanded, onClick: () => {
                if (isCollapsible) {
                    setIsExpanded(!isExpanded);
                }
            } })) : null,
        description ? (react_1.default.createElement(DescriptionFieldTemplate, { id: (0, utils_1.descriptionId)(idSchema), description: description, schema: schema, uiSchema: uiSchema, registry: registry, style: { marginTop: -4 } })) : null,
        isExpanded ? (react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: title ? 10 : 0 } },
            properties.map((element) => {
                if (element.hidden) {
                    return element.content;
                }
                const fieldUiSchema = (uiSchema === null || uiSchema === void 0 ? void 0 : uiSchema[element.name]) || {};
                return (react_1.default.createElement("div", { key: element.name, style: {
                        marginBottom: (fieldUiSchema === null || fieldUiSchema === void 0 ? void 0 : fieldUiSchema['ui:collapsible']) ? 0 : 10,
                        marginLeft: (fieldUiSchema === null || fieldUiSchema === void 0 ? void 0 : fieldUiSchema['ui:bulletedList']) ? 16 : undefined,
                    } }, element.content));
            }),
            (0, utils_1.canExpand)(schema, uiSchema, formData) ? (react_1.default.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end' } },
                react_1.default.createElement(AddButton, { className: "object-property-expand", onClick: onAddClick(schema), disabled: disabled || readonly, uiSchema: uiSchema, registry: registry }))) : null)) : null));
}
//# sourceMappingURL=ObjectFieldTemplate.js.map